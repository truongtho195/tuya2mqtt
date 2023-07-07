import { BehaviorSubject, Observable, Subject } from "rxjs";
import TuyAPI from 'tuyapi'
import { DpsState, GenericTuyaDevice } from './GenericTuyaDevice';
import { Loop } from "./Loop";

export type TuyaDeviceDataPointState = {
    id: string
    cid?: string
    dps: DpsState
}

export class TuyaDeviceManager {

    static async link(configs: GenericTuyaDevice[]) {
        const top_device_configs = configs.filter(c => !c.sub)
        const devices = await Loop.mapAsync(
            top_device_configs,
            config => this.#setup_device(
                config,
                configs.filter(c => c.parent == config.id)
            )
        )
        return devices.reduce((p, c) => {
            c.forEach((d, i) => p.set(i, d))
            return p
        }, new Map<string, GenericTuyaDevice>())
    }

    static async  #setup_device(
        config:   GenericTuyaDevice ,
        children:   GenericTuyaDevice[] = []
    ) {
        const devices = new Map<string, GenericTuyaDevice>()
        for (const child of [config, ...children]) {
            devices.set(config.id, {
                ...child,
                $state: new Subject(),
                $trigger: new Subject()
            })
        }
        const device = new TuyAPI({
            id: config.id,
            key: config.key,
            issueGetOnConnect: true,
            version: config.version,
            issueRefreshOnConnect: true,
            issueRefreshOnPing: true
        })
        await device.find({ all: true })
        await new Promise<void>(s => device.on('connected', s))
        const on_data = (data: { dps: any, cid: string }) => {
            if (typeof data == 'string') return
            if (data.dps) {
                devices.get(data.cid)?.$state.next(data.dps)
            }
        }
        device.on('dp-refresh', on_data as any)
        device.on('data', on_data as any)
        devices.forEach(({ $trigger, node_id }) => $trigger.subscribe(data => {
            device.set({
                multiple: true,
                data,
                cid: node_id
            } as any)
        }))
        return devices
    }
}

