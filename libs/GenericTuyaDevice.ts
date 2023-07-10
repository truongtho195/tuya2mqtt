import { Subject } from "rxjs"


export type DpsState = {
    [index: string]: string | number | boolean
}

export type TuyaDeviceConfig = {
    name: string
    id: string
    key: string
    mac: string
    uuid: string
    category: string
    product_name: string
    product_id: string
    biz_type: string | number,
    model: string
    sub: boolean,
    icon: string
    ip: string
    version: string
    parent?: string
    node_id?: string
    mapping: {
        [dp: string]: {
            code: string
            type: string
            values: any
        } | undefined
    }
}

export type GenericTuyaDevice = TuyaDeviceConfig & {
    state: DpsState,
    $state: Subject<DpsState>
    $trigger: Subject<DpsState>
    sync: () => void
}
