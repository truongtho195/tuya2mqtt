import { LightweightMqtt } from './libs/tuya2mqtt/LightweightMqtt'
import { Tuya2MqttDevice } from './libs/tuya2mqtt/Tuya2MqttDevice'
import { TuyaSupportDevices } from './libs/tuya2mqtt/TuyaSupportDevices'
import { TuyaDeviceManager } from './libs/tuyapi/TuyaDeviceManager'
import devices from './bin/devices.json' assert {type: 'json'}
import { TuyaDevice, TuyaDeviceConfig } from './libs/tuyapi/TuyaConnection'

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

function capitalizeFirstChar(string) {
    if (typeof string !== 'string') {
        throw new Error('Input must be a string');
    }

    if (string.length === 0) {
        return string;
    }

    const firstChar = string.charAt(0).toUpperCase();
    const remainingChars = string.slice(1);

    return firstChar + remainingChars;
}


tuya_device_manager.new_devices.subscribe(
    async tuya_device => {
        if (tuya_device.parent?.endsWith('kqxa') || tuya_device.ip.startsWith('192.168.2')) {
            const factory = TuyaSupportDevices[tuya_device.category] as typeof TuyaSupportDevices[keyof typeof TuyaSupportDevices]
            if (!factory) return
            const t2mdev = new factory(mqtt, tuya_device)
            await t2mdev.init()
        }
    }
)


tuya_device_manager.start(
    devices.map(d => ({ ...d, local_key: d.key, device_id: d.id, name: capitalizeFirstChar(d.name) } as TuyaDeviceConfig))
) 