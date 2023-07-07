import { LightweightMqtt } from "./LightweightMqtt";
import { GenericTuyaDevice } from "./GenericTuyaDevice";

export class Tuya2MqttDevice {
    constructor(
        protected mqtt: LightweightMqtt,
        protected tuya_device: GenericTuyaDevice
    ) { }
}
