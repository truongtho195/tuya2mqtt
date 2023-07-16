import { MqttEntity } from "./MqttEntity"
import { Tuya2MqttDevice } from "./Tuya2MqttDevice"



export class Tuya2MqttSwitch extends Tuya2MqttDevice {
    async init() {
        const switch_count = Object.values(this.tuya_device.mapping).filter(
            el => el?.code?.match(/^switch_[0-9]$/)
        ).length

        for (let i = 1; i <= switch_count; i++) {
            const dev = new MqttEntity({
                name: this.tuya_device.name,
                device_class: 'switch',
                device_id: this.tuya_device.device_id,
                mqtt: this.mqtt,
                ...switch_count > 1 ? { entity_id: i } : {}
            })
            const state = dev.add_state('state')
            const command = dev.add_action('command')
            this.tuya_device.$dps.subscribe(dps => {
                dps[`${i}`] != undefined && state.update(dps[`${i}`] ? 'ON' : 'OFF')
            })
            command.subscribe(v => this.tuya_device.set_dps({ [i]: v == 'ON' }))
            await dev.broadcast()
        }
        this.tuya_device.sync()
    }
}
