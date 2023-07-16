import { TuyaDevice } from "../tuyapi/TuyaConnection";
import { LightweightMqtt } from "./LightweightMqtt"; 

export class Tuya2MqttDevice {
    constructor(
        protected mqtt: LightweightMqtt,
        protected tuya_device: TuyaDevice
    ) { }

    init() { }
}
