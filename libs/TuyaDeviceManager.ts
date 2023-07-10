import { BehaviorSubject, Observable, Subject, firstValueFrom, map, merge } from "rxjs";
import TuyAPI from 'tuyapi'
import { DpsState, GenericTuyaDevice, TuyaDeviceConfig } from './GenericTuyaDevice';
import { Loop } from "../helpers/Loop";
import { execSync } from "child_process";
import { TuyaSupportDevices } from "./TuyaSupportDevices";

export type TuyaDeviceDataPointState = {
    devId: string
    cid?: string
    dps: DpsState
}

export class TuyaDeviceManager {

    public readonly devices = new Map<string, GenericTuyaDevice>()

    constructor(private configs: TuyaDeviceConfig[]) { }

    static async scan_devices() {
        console.log('Scanning')
        const dev = new TuyAPI({
            id: '680064082462ab173fd6',
            key: '15e1ba5e1a0b6737',
            issueGetOnConnect: true,
            issueRefreshOnConnect: true,
            issueRefreshOnPing: true
        })
        return await dev.find({ all: true }) as any as Array<{
            id: string
            ip: string
        }>
    }

    async connect() {

        const found_devices = await TuyaDeviceManager.scan_devices()
        console.log(`Foudn ${found_devices.length} devices`)
        const found_devices_map = found_devices.reduce((p, c) => {
            p.set(c.id, c.ip)
            return p
        }, new Map<string, string>())

        const master_devices = this.configs
            .filter(c => found_devices_map.has(c.id))
            .map(d => ({
                ...d,
                ip: found_devices_map.get(d.id) || d.ip
            }))

        await Loop.mapAsync(master_devices, async master_device => {
            console.log(`[${master_device.name}]`)
            // Add ARP
            console.log(`    -> Adding ARP: sudo arp -s ${master_device.ip} ${master_device.mac}`)
            execSync(`sudo arp -s ${master_device.ip} ${master_device.mac}`)

            // Connect 
            const children = this.configs.filter(d => d.parent == master_device.id)
            await this.#setup_master_device(master_device, children)
        }, 1)

        return this.devices
    }

    async #setup_master_device(
        master_config: TuyaDeviceConfig,
        children: TuyaDeviceConfig[] = []
    ) {

        console.log('    -> Connecting')
        // Setup
        const device = new TuyAPI({
            id: master_config.id,
            key: master_config.key,
            issueGetOnConnect: true,
            version: master_config.version,
            issueRefreshOnConnect: true,
            issueRefreshOnPing: true,
            ip: master_config.ip
        })
        device.on('error', err => {
            // console.log(err)
        })
        if (!master_config.ip) {
            const found = await device.find({ timeout: 10000 })
            console.log({ found })
            if (!found) return
        }


        await new Promise<void>(s => {
            device.on('connected', s)
            device.connect()
        })

        console.log('    -> Connected')

        // Create devices 
        for (const $ of [master_config, ...children]) {
            const $state = new Subject<DpsState>()
            const id = $.node_id || $.id

            // Force state sync function 
            const sync = () => {
                $state.next(this.devices.get(id)?.state || {})
            }


            // Add to device list
            const $trigger = new Subject<DpsState>()
            this.devices.set(id, {
                ...$,
                state: {},
                $state,
                $trigger,
                sync
            })


            // Trigger handler
            $trigger.subscribe(data => {
                console.log(`Trigger ${$.name}`, data)
                device.set({
                    multiple: true,
                    shouldWaitForResponse: false,
                    data,
                    ...$.node_id ? { cid: $.node_id } : {}
                })
            })
        }

        // Devices state update handler
        new Observable<TuyaDeviceDataPointState>(handler => {
            device.on('data', (e: any) => handler.next(e))
            device.on('dp-refresh', (e: any) => handler.next(e))
        }).subscribe(data => {
            if (!data.dps) return
            const device_id = data.cid || data.devId
            const device = this.devices.get(device_id)

            if (!device) return
            // console.log({
            //     dps_update: {
            //         name: device?.name,
            //         dps: data.dps
            //     }
            // })
            device.$state.next(data.dps)
            device.state = { ...device.state, ...data.dps }
        })


        // Query first state
        for (const { node_id, id, name, mapping,product_name } of [master_config, ...children]) {
            const dp_count = Object.keys(mapping).length
            console.log(`[QUERY INITAL STATE] ${name} [${product_name}] - ${dp_count} data points`)
            if (dp_count > 0) {
                await firstValueFrom(merge(
                    this.devices.get(node_id || id)?.$state || new Subject(),
                    device.get({
                        schema: true,
                        ...node_id ? { cid: node_id } : {}
                    }) 
                ))
            }
            console.log(`Query data for ${name} DONE`)
        }


    }

}

