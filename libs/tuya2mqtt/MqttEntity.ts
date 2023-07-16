import { LightweightMqtt } from "./LightweightMqtt"


export type MqttEntityConfig = {
    mqtt: LightweightMqtt,
    device_class: string,
    name: string
    device_id: string
    entity_id?: string | number
}

export class MqttEntity {


    private entity_topic: string
    #topics = new Set<string>()


    constructor(private config: MqttEntityConfig) {
        const object_id = `${this.config.device_id}${
            this.config.entity_id != undefined ? `-${this.config.entity_id}` : ''
        }`
        this.entity_topic = `homeassistant/${this.config.device_class}/${object_id.slice(-5)}`
    }

    add_action<T = string>(name: string) {
        const topic = `${this.entity_topic}/${name}`
        this.#topics.add(name)
        return this.config.mqtt.listen<T>(topic).pipe(
            // tap(cmd => console.log(`[MQTT_ACTION] - ${this.name}->${name} = ${cmd}`))
        )

    }

    add_state<T extends string | number | boolean = string>(name: string) {
        const topic = `${this.entity_topic}/${name}`
        this.#topics.add(name)
        return {
            update: async (value: T) => {
                // console.log(`[MQTT_PUSH] - ${this.name}->${name} = ${value}`)
                await this.config.mqtt.publish(topic, value)
            }
        }
    }

    async set_online_status(is_online: boolean) {
        await this.config.mqtt.publish(`${this.entity_topic}/availability`, is_online ? 'online' : 'offline')
    }


    async broadcast(extra_config: { [key: string]: string | number | boolean | object } = {}) {

        const availability = await this.add_state('availability')
        const object_id = this.entity_topic.slice(-5)
        console.log(`Broadcast for device ${this.config.name}: [${object_id}]`)
        const config = {
            name: `${this.config.name} ${this.config.entity_id || ''}`.trim(),
            unique_id: object_id,
            object_id,
            device: {
                identifiers: [this.config.device_id],
                name: this.config.name
            },
            ...[...this.#topics].reduce((p, name) => ({
                ...p,
                [name + '_topic']: `${this.entity_topic}/${name}`
            }), {}),
            ...extra_config
        }
        
        await this.config.mqtt.publish(
            `${this.entity_topic}/config`,
            JSON.stringify(config),
            { retain: true }
        )
        await new Promise(s => setTimeout(s, 1000))

        await availability.update('online')
    }


}