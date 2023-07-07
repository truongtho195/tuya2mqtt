import { LightweightMqtt } from "./LightweightMqtt"

export class MqttDevice {


    private device_topic: string
    #topics = new Set<string>()


    constructor(
        public readonly mqtt: LightweightMqtt,
        public readonly device_class: string,
        public readonly id: string,
        public readonly name: string
    ) {
        this.device_topic = `homeassistant/${this.device_class}/${this.id}`
    }

    add_action(name: string) {
        const topic = `${this.device_topic}/${name}`
        this.#topics.add(name)
        return this.mqtt.liten(topic)

    }

    add_state(name: string) {
        const topic = `${this.device_topic}/${name}`
        this.#topics.add(name)
        return {
            update: async (value: string) => {
                console.log(`Update ${topic} = ${value}`)
                await this.mqtt.publish(topic, value)
            }
        }
    }

    // async set_state(new_state: string) {
    //     await this.mqtt.publish(`${this.device_topic}/state`, new_state)
    // }

    async set_online_status(is_online: boolean) {
        await this.mqtt.publish(`${this.device_topic}/availability`, is_online ? 'online' : 'offline')
    }


    async broadcast(extra_config: { [key: string]: string | number | boolean | object } = {}) {

        const availability = await this.add_state('availability')

        const config = {
            name: this.name,
            unique_id: this.id,
            ...[...this.#topics].reduce((p, name) => ({
                ...p,
                [name + '_topic']: `${this.device_topic}/${name}`
            }), {}),
            ...extra_config
        }

        console.log({ config })

        await this.mqtt.publish(
            `${this.device_topic}/config`,
            JSON.stringify(config),
            { retain: true }
        )
        await new Promise(s => setTimeout(s, 1000))

        await availability.update('online')
    }


}