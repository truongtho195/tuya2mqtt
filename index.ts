import { LightweightMqtt } from './libs/tuya2mqtt/LightweightMqtt'
import { TuyaSupportDevices } from './libs/tuya2mqtt/TuyaSupportDevices'
import { TuyaDeviceManager } from './libs/tuyapi/TuyaDeviceManager'

console.log('Running')

const require_params = ['MQTT_HOST', 'MQTT_PORT', 'MQTT_USERNAME', 'MQTT_PASSWORD', 'API_KEY', 'API_SECRET', 'USER_ID']
require_params.forEach(key => {
    if (!process.env[key]) throw new Error(`MISSING ENV ${key}`)
})


const mqtt = await LightweightMqtt.connect({
    host: process.env.MQTT_HOST!,
    port: Number(process.env.MQTT_PORT!),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
})

console.log('MQTT connected')


const tuya_device_manager = new TuyaDeviceManager({
    key: process.env.API_KEY!,
    secret: process.env.API_SECRET!,
    user_id: process.env.USER_ID!
})



tuya_device_manager.new_devices.subscribe(
    async tuya_device => {
        const factory = TuyaSupportDevices[tuya_device.category] as typeof TuyaSupportDevices[keyof typeof TuyaSupportDevices]
        if (!factory) return
        tuya_device.name = `${tuya_device.name[0].toUpperCase}${tuya_device.name.slice(1)}`
        const t2mdev = new factory(mqtt, tuya_device)
        await t2mdev.init()
    }
)


tuya_device_manager.start() 
