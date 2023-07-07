import { Tuya2MqttDevice } from "./Tuya2MqttDevice"
import { MqttDevice } from './MqttDevice'


export class Tuya2MqttSwitch extends Tuya2MqttDevice {
    async init() {
        const dev = new MqttDevice(
            this.mqtt,
            'switch',
            this.tuya_device.id,
            this.tuya_device.name
        )
        const state = dev.add_state('state')
        const command = dev.add_action('command')
        await dev.broadcast()
        this.tuya_device.$state.subscribe(({ dps }) => {
            state.update(dps['1'] ? 'ON' : 'OFF')
        })
        command.subscribe(v => this.tuya_device.$trigger.next({ '3': v == 'ON' }))
    }
}
