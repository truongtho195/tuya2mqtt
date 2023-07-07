import { randomUUID } from "crypto"
import { MqttClient, IClientOptions, IClientPublishOptions, connect } from "mqtt"
import { Observable, finalize } from "rxjs"

export class LightweightMqtt {

    #listeners = new Map<string, Map<string, Function>>()

    private constructor(private client: MqttClient) {
        this.client.on('message', (topic, payload) => {
            const data = payload.toString('utf-8')
            this.#listeners.get(topic)?.forEach(cb => cb(data))
        })
    }

    static async connect(config: IClientOptions) {
        const client = connect(config)
        await new Promise(s => client.on('connect', s))
        return new this(client)
    }


    liten<T = string>(topic) {
        this.client.subscribe(topic)
        const id = randomUUID()
        !this.#listeners.has(topic) && this.#listeners.set(topic, new Map())
        return new Observable<T>(s => {
            this.#listeners.get(topic)?.set(id, v => s.next(v))
        }).pipe(
            finalize(() => {
                this.#listeners.get(topic)?.delete(id)
                this.#listeners.get(topic)?.size == 0 && this.#listeners.delete(topic)
            })
        )
    }


    publish(topic: string, payload: string, options?: IClientPublishOptions) {
        return this.client.publish(topic, payload, options || {})
    }

}
