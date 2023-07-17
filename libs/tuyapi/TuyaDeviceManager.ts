import { Observable, Subject, finalize, from, fromEvent, lastValueFrom, map, merge, mergeAll, mergeMap } from "rxjs"
import { TuyaConnection, TuyaDevice, TuyaDeviceConfig } from "./TuyaConnection"
import dgram from 'dgram'
import { UDP_KEY } from "./config"
import { MessageParser } from "./message-parser"
import { TuyaContext } from '@tuya/tuya-connector-nodejs';
import fs from 'fs'


export type ApiCredential = {
    key: string,
    secret: string,
    user_id: string,
    region?: string
}

type DiscoverPayload = {
    payload: {
        ip: string,
        version: string
        gwId: string
    }
}



export class TuyaDeviceManager {

    #connections = new Map<string, TuyaConnection>()
    new_devices = new Subject<TuyaDevice>()

    constructor(private credential: ApiCredential) { }

    #cloud_devices = new Map<string, TuyaDeviceConfig>()
    async pull_devices_from_cloud() {
        console.log(`Pulling devices from cloud ...`)
        const api = new TuyaContext({
            baseUrl: `https://openapi.tuya${this.credential.region || 'us'}.com`,
            accessKey: this.credential.key,
            secretKey: this.credential.secret
        })

        const result = await api.request<Array<Omit<TuyaDeviceConfig, 'mapping' | 'device_id'> & { id: string }>>({
            method: 'GET',
            path: `/v1.0/users/${this.credential.user_id}/devices`
        })
        console.log(`Total ${result.result.length} devices`)

        let done = 0
        await lastValueFrom(from(result.result).pipe(
            mergeMap(async config => {
                const r = await api.request<{
                    properties: Array<{
                        code: string
                        dp_id: string
                        value: string | boolean | number
                    }>
                }>({
                    method: 'GET',
                    path: `/v2.0/cloud/thing/${config.id}/shadow/properties`
                })
                this.#cloud_devices.set(config.id, {
                    ...config,
                    device_id: config.id,
                    mapping: r.result.properties.reduce((p, c) => ({
                        ...p,
                        [c.dp_id]: c
                    }), {}),
                    status: undefined
                } as any)
                console.log(`Getting device data point mapping ... ${++done}/${result.result.length}`)
            }, 10)

        ))
        console.log(`Pulled all devices`)
    }

    watch_local_devices() {


        const parser = new MessageParser({
            key: UDP_KEY,
            version: '3.3'
        })

        return new Observable<DiscoverPayload['payload']>(o => {
            const listener = dgram.createSocket({ type: 'udp4', reuseAddr: true })
            listener.bind(6666)

            const listenerEncrypted = dgram.createSocket({ type: 'udp4', reuseAddr: true })
            listenerEncrypted.bind(6667)

            const s = merge(
                fromEvent(listener, 'message'),
                fromEvent(listenerEncrypted, 'message')
            ).pipe(
                map(data => data as [Buffer, dgram.RemoteInfo]),
                finalize(() => {
                    listener.close()
                    listenerEncrypted.close()
                }),
                map(([data, info]) => {
                    try {
                        return parser.parse(data) as DiscoverPayload[]
                    } catch (e) {
                        return []
                    }
                }),
                mergeAll(),
                map(p => p.payload)
            ).subscribe(o)

            return () => s.unsubscribe()
        })

    }

    async #setup_device({ gwId: device_id, ip, version }: DiscoverPayload['payload']) {
        const running_connection = this.#connections.get(device_id)
        if (running_connection) {
            running_connection.connect(ip)
            return
        }
        const cloud_device = this.#cloud_devices.get(device_id)
        if (!cloud_device) return

        const connection = new TuyaConnection({ ...cloud_device, ip, version })
        const sub_device_ids = [... this.#cloud_devices.values()]
            .filter(x => x.parent == device_id)
        const devices = [undefined, ...sub_device_ids].map(dev => connection.register_device(dev))
        await connection.connect()
        this.#connections.set(device_id, connection)
        devices.map(d => this.new_devices.next(d))
    }


    async start(devices: TuyaDeviceConfig[] = []) {
        devices.forEach(d => this.#cloud_devices.set(d.node_id || d.device_id, d))
        await this.pull_devices_from_cloud()
        this.watch_local_devices().subscribe(
            (payload) => this.#setup_device(payload)
        )
    }
}