import { Tuya2MqttButton } from "./Tuya2MqttButton";
import { Tuya2MqttCurtain } from "./Tuya2MqttCurtain";
import { Tuya2MqttBinarySensor } from "./Tuya2MqttBinarySensor";
import { Tuya2MqttSwitch } from "./Tuya2MqttSwitch";
import { Tuya2MqttPresenceSensor } from "./Tuya2MqttPresenceSensor";

export const TuyaSupportDevices = {
    mcs: Tuya2MqttBinarySensor,
    cl: Tuya2MqttCurtain,
    kg: Tuya2MqttSwitch,
    wxkg: Tuya2MqttButton,
    hps: Tuya2MqttPresenceSensor,
    tdq: Tuya2MqttSwitch
}