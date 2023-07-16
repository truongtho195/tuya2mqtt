import { Observable, Subject, finalize, fromEvent, map, merge, mergeAll } from "rxjs"
import { ApiCredential, TuyaConnection, TuyaDevice, TuyaDeviceConfig } from "./TuyaConnection"
import dgram from 'dgram'
import { UDP_KEY } from "./config"
import { MessageParser } from "./message-parser"

export class TuyaDeviceManager {

    #connections = new Map<string, TuyaConnection>()
    new_devices = new Subject<TuyaDevice>()

    constructor(private credential: ApiCredential) { }

    #cloud_devices = new Map<string, TuyaDeviceConfig>()
    async pull_devices_from_cloud() {

    }

    watch_local_devices() {

        type DiscoverPayload = {
            payload: {
                ip: string,
                version: string
                gwId: string
            }
        }
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

    async #setup_device(device_id: string, local_ip: string) {
        const running_connection = this.#connections.get(device_id)
        if (running_connection) {
            running_connection.$status.value == 'offline' && running_connection.connect(local_ip)
            return
        }
        const cloud_device = this.#cloud_devices.get(device_id)
        if (!cloud_device) return

        const connection = new TuyaConnection({ ...cloud_device, ip: local_ip })
        const sub_device_ids = [... this.#cloud_devices.values()]
            .filter(x => x.parent == device_id)
        const devices = [undefined, ...sub_device_ids].map(dev => connection.register_device(dev))
        await connection.connect()
        this.#connections.set(device_id, connection)
        devices.map(d => this.new_devices.next(d))
    }


    async start(devices: TuyaDeviceConfig[] = []) {
        devices.forEach(d => this.#cloud_devices.set(d.node_id || d.device_id, d))
        this.watch_local_devices().subscribe(
            ({ gwId: device_id, ip }) => this.#setup_device(device_id, ip)
        )
    }
}