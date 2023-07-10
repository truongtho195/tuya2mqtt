import { MqttEntity } from "./MqttEntity"
import { Tuya2MqttDevice } from "./Tuya2MqttDevice"


export class Tuya2MqttBinarySensor extends Tuya2MqttDevice {
    async init() {
        const dev = new MqttEntity({
            name: this.tuya_device.name,
            device_class: 'binary_sensor',
            device_id: this.tuya_device.id,
            mqtt: this.mqtt
        })

        const state = dev.add_state('state')
        await dev.broadcast({
            device_class: 'door',
            enabled_by_default: true
        })

        this.tuya_device.$state.subscribe(dps => {
            dps[`1`] != undefined && state.update(dps[`1`] ? 'ON' : 'OFF')
        })


        this.tuya_device.sync()
    }
} 