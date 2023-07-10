import { MqttEntity } from "./MqttEntity"
import { Tuya2MqttDevice } from "./Tuya2MqttDevice"

export class Tuya2MqttButton extends Tuya2MqttDevice {
    async init() {
        const dev = new MqttEntity({
            name: this.tuya_device.name,
            device_class: 'sensor',
            device_id: this.tuya_device.id,
            mqtt: this.mqtt
        }) 
        const state = dev.add_state('state')
        await dev.broadcast({
            enabled_by_default: true
        })
        this.tuya_device.$state.subscribe(dps => {
            if (Object.keys(dps).length == 1) {
                for (const [key, value] of Object.entries(dps)) {
                    state.update(`${key}:${value}`)
                }
                setTimeout(() => state.update(`Unknown`), 500)
            }

        })
    }
} 