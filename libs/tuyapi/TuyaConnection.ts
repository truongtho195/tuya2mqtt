import { Socket, connect } from 'net'
import { BehaviorSubject, Observable, Subject, filter, firstValueFrom, fromEvent, interval, map, merge, mergeAll, mergeMap, tap, timer } from 'rxjs'
import { CommandType, MessageParser } from './message-parser'
import { execSync } from 'child_process'

export type TuyaDeviceConfig = {
    device_id: string,
    ip: string
    port?: number
    version: string
    local_key: string
    category: string
    node_id?: string
    parent?: string
    name: string
    mac: string
    mapping: {
        [key: string]: {
            code: string,
            [key: string]: string
        }
    } | {}
}

export type TuyaDevice = TuyaDeviceConfig & {
    $dps: Subject<Dps>
    set_dps: (dps: Dps) => void
    get_status: () => Promise<Dps>
    sync: () => void
}

export type Dps = {
    [key: string]: string | number | boolean
}

export type DpsUpdate = {
    devId: string
    cid: string
    dps: Dps,
    t: number
}



export class TuyaConnection {

    #devices = new Map<string, Subject<Dps>>()

    #$response = new Subject<{
        "payload": DpsUpdate,
        "leftover": boolean,
        "commandByte": number,
        "sequenceN": number
    }>()

    #$request = new Subject<{
        payload: any,
        on_success?: (seq: number) => void
    }>()

    #parser: MessageParser

    public readonly $status = new BehaviorSubject<'created' | 'connecting' | 'online' | 'offline'>('created')

    constructor(private config: TuyaDeviceConfig) {

        this.#parser = new MessageParser({
            key: config.local_key,
            version: config.version
        })
    }

    #seq_number = 100
    async connect(ip = this.config.ip) {
        if (this.$status.value == 'connecting' || this.$status.value == 'online') return
        this.$status.next('connecting')
        for (let i = 1; i <= 5; i++) {
            const socket = connect({
                host: ip,
                port: this.config.port || 6668
            })
try{
            execSync(`sudo arp -s ${this.config.ip} ${this.config.mac}`)
}catch(e){}
            const connected = await new Promise<boolean>(s => {
                socket.on('connect', () => s(true))
                socket.on('error', () => s(false))
            })
            if (!connected) {
                console.log(`Can not connect to ${this.config.name}, retrying ...`)
                continue
            }

            // Map request
            const requester = this.#$request.subscribe(({ payload, on_success }) => {
                const sequenceN = this.#seq_number++
                on_success?.(sequenceN)
                const buffer = this.#parser.encode({
                    ...payload,
                    sequenceN
                })
                socket.writable && socket.write(buffer)
            })


            // Map response
            const responder = fromEvent(socket, 'data').pipe(
                map(data => this.#parser.parse(data) as Array<{
                    payload: DpsUpdate;
                    leftover: boolean;
                    commandByte: number;
                    sequenceN: number;
                }>),
                mergeAll(),
            ).subscribe(data => {
                const id = data.payload.cid || data.payload.devId
                this.#devices.get(id)?.next(data.payload.dps)
                this.#$response.next(data)
            })

            this.$status.next('online')
            console.log(`[${this.config.name}] ONLINE`)

            const pinger = interval(10000).subscribe(
                () => this.#ping()
            )


            firstValueFrom(
                merge(
                    // fromEvent(socket, 'close').pipe(map(() => 'close')),
                    fromEvent(socket, 'error'),
                )
            ).then((e) => {
                console.log(`[${this.config.name}] offline`, e)
                requester.unsubscribe()
                responder.unsubscribe()
                pinger.unsubscribe()
                this.$status.value == 'online' && this.$status.next('offline')
            })

            break
        }
    }

    async #ping() {
        await this.cmd({
            data: Buffer.allocUnsafe(0),
            commandByte: CommandType.HEART_BEAT,
        })
    }

    async cmd(payload: any, wait: boolean = false) {
        const seq = await new Promise<number>(on_success => {
            this.#$request.next({
                payload,
                on_success
            })
        })
        const promise = firstValueFrom(merge(
            timer(3000).pipe(map(() => null)),
            this.#$response.pipe(
                filter(r => r.sequenceN == seq && (
                    wait ? ((r.payload as any) != false) : true
                )),
                map(r => wait ? r.payload : null)
            )
        ))
        return await promise
    }

    async set_dps(data: { dps: Dps, sub_device_id?: string }) {
        return await await this.cmd({
            commandByte: CommandType.CONTROL,
            data: data.sub_device_id ? {
                t: Math.round(new Date().getTime() / 1000).toString(),
                dps: data.dps,
                cid: data.sub_device_id
            } : {
                gwId: this.config.device_id,
                devId: this.config.device_id,
                t: Math.round(new Date().getTime() / 1000).toString(),
                dps: data.dps,
                uid: this.config.device_id,
            }
        })
    }

    async get_status(sub_device_id?: string) {
        return await await this.cmd({
            commandByte: CommandType.DP_QUERY,
            data: {
                gwId: this.config.device_id,
                devId: this.config.device_id,
                t: Math.round(new Date().getTime() / 1000).toString(),
                dps: {},
                uid: this.config.device_id,
                cid: sub_device_id
            }
        }, true)
    }

    register_device(config: TuyaDeviceConfig = this.config) {
        const $dps = new Subject<Dps>()
        this.#devices.set(config.node_id || this.config.device_id, $dps)
        const get_status = async () => {
            const rs = await this.get_status(config.node_id)
            return rs?.dps
        }
        return {
            $dps,
            set_dps: (dps: Dps) => this.set_dps({
                sub_device_id: config.node_id,
                dps
            }),
            get_status,
            sync: () => {
                get_status().then(dps => dps && $dps.next(dps))
            },
            ...config,
        } as TuyaDevice
    }

}

