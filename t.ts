import DeviceList from './bin/devices.json' assert {type: 'json'}
import { LightweightMqtt } from './libs/LightweightMqtt'
import { Loop } from './helpers/Loop'
import { TuyaDeviceManager } from './libs/TuyaDeviceManager'
import { TuyaSupportDevices } from './libs/TuyaSupportDevices'

console.log('Running')
const mqtt = await LightweightMqtt.connect({
    host: 'localhost',
    port: 10000,
    username: 'ba',
    password: 'Duongvanba1997@'
})
console.log('MQTT connected')
const manager = new TuyaDeviceManager(DeviceList.filter(d => {
    return d.parent == 'ebd13f2e4301630249kqxa' || d.id == 'ebd13f2e4301630249kqxa' || d.ip?.startsWith('192.168.2')
}))
const devices = await manager.connect()
await Loop.mapAsync(devices.values(), async device => {
    const factory = TuyaSupportDevices[device.category]
    if (!factory) return
    await new factory(mqtt, device).init()
})
console.log('Ready')
mqtt.listen('homeassistant/status').subscribe(status => {
    if (status => status == 'ONLINE') {
        console.log('HASS ONLINE -> SYNCING ...')
        devices.forEach(d => d.sync())
    }else{
        console.log('HASS OFFLINE')
    }
}) 