import { MqttEntity } from "./MqttEntity"
import { Tuya2MqttDevice } from "./Tuya2MqttDevice"





export class Tuya2MqttPresenceSensor extends Tuya2MqttDevice {
    async init() {
        const dev = new MqttEntity({
            name: this.tuya_device.name,
            device_class: 'binary_sensor',
            device_id: this.tuya_device.device_id,
            mqtt: this.mqtt
        })

        const state = dev.add_state('state')
        await dev.broadcast({
            device_class: 'motion',
            enabled_by_default: true
        })

        this.tuya_device.$dps.subscribe(dps => {
            dps[`1`] != undefined && state.update(dps[`1`] == 'presence' ? 'ON' : 'OFF')
        })


        this.tuya_device.sync()
    }
} 