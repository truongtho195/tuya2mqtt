import { LightweightMqtt } from './libs/tuya2mqtt/LightweightMqtt'
import { Tuya2MqttDevice } from './libs/tuya2mqtt/Tuya2MqttDevice'
import { TuyaSupportDevices } from './libs/tuya2mqtt/TuyaSupportDevices'
import { TuyaDeviceManager } from './libs/tuyapi/TuyaDeviceManager'

console.log('Running')
const mqtt = await LightweightMqtt.connect({
    host: 'localhost',
    port: 10000,
    username: 'ba',
    password: 'Duongvanba1997@'
})
console.log('MQTT connected')

const tuya_device_manager = new TuyaDeviceManager({
    key: '',
    secret: ''
})

tuya_device_manager.new_devices.subscribe(
    tuya_device => {
        const factory = TuyaSupportDevices[tuya_device.category] as typeof TuyaSupportDevices[keyof typeof TuyaSupportDevices]
        new factory(mqtt, tuya_device)
    }
)


tuya_device_manager.start() 