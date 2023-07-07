import { Subject } from "rxjs"


export type DpsState = {
    [index: string]: string | number | boolean
}



export type GenericTuyaDevice = {
    "name": string
    "id": string
    "key": string
    "mac": string
    "uuid": string
    "category": string
    "product_name": string
    "product_id": string
    "biz_type": 0,
    "model": string
    "sub": false,
    "icon": string
    "mapping": {},
    "ip": string
    "version": string
    parent: string
    node_id: string
    $state: Subject<DpsState>
    $trigger: Subject<DpsState>
}
