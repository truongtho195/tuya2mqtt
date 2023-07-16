import { MqttEntity } from "./MqttEntity"
import { Tuya2MqttDevice } from "./Tuya2MqttDevice"




export class Tuya2MqttCurtain extends Tuya2MqttDevice {
    #timer: NodeJS.Timeout
    async init() {
        const dev = new MqttEntity({
            name: this.tuya_device.name,
            device_class: 'cover',
            device_id: this.tuya_device.device_id,
            mqtt: this.mqtt
        })
        const state = dev.add_state('state')
        const position = dev.add_state<number>('position')
        const command = dev.add_action('command')
        const set_possion = dev.add_action<number>('set_position')
        await dev.broadcast({
            optimistic: true,
            position_closed: 0,
            position_open: 100
        })
        set_possion.subscribe(p => {
            this.tuya_device.set_dps({ '2': 100 - Number(p) })
        })
        command.subscribe(cmd => {
            if (cmd == 'STOP') {
                this.tuya_device.set_dps({ '1': 'stop' })
            }
            if (cmd == 'CLOSE') {
                state.update('closing')
                this.tuya_device.set_dps({ '1': 'closed' })
            }

            if (cmd == 'OPEN') {
                state.update('opening')
                this.tuya_device.set_dps({ '1': 'open' })
            }
        })
        this.tuya_device.$dps.subscribe(async dps => {
            console.log({ [this.tuya_device.name]: dps })
            this.#timer && clearTimeout(this.#timer)
            if (dps[1] != undefined) {
                if (dps['1'] == 'close') {
                    state.update('closing')
                    this.#timer = setTimeout(() => state.update('closed'), 5000)
                }
                if (dps['1'] == 'open') {
                    state.update('opening')
                    this.#timer = setTimeout(() => state.update('open'), 5000)
                }
            }
            if (dps['3'] != undefined) {
                const inverted_possion = 100 - Number(dps['3'])
                position.update(inverted_possion)
                state.update(inverted_possion == 0 ? 'closed' : 'open')
            }
        })
        this.tuya_device.sync()

    }
} 