# Hi there
This is small nodejs code to connect tuya devices to home assistant. Script will pull all devices from tuya cloud then connect with home assistant using local socket in your LAN network
Feature: 
- Support switch, binary sensor, presence sensor, curtain, sence switch button
- Support zigbee device 
- Automatic pull devices config from tuya cloud
- Auto setup to home assistant via MQTT discovery
- Near realtime state update/control
- Auto add ARP record => fix offline problem
- Auto reconnect after device offline (you can test by turn off then turn device on)

# Requirement
- Nodejs 
- Yarn or NPM
- Tuya developer account with client id, client secret, user id (how to get =>  https://github.com/rospogrigio/localtuya#adding-the-integration)
- Home assistant with MQTT install (remember host, port, username, password)

# Install 
With yarn:
```bash
git clone https://github.com/duongvanba/tuya2mqtt.git
cd tuya2mqtt
yarn
yarn add ts-node typescript
yarn build
```

With npm:
```bash
git clone https://github.com/duongvanba/tuya2mqtt.git
cd tuya2mqtt
npm install
npm i typescript ts-node
npm run build
```
# Run
With yarn
```bash
MQTT_HOST=(your mqtt host) MQTT_PORT=(your mqtt port) MQTT_USERNAME=(your mqtt username) MQTT_PASSWORD=(your mqtt password) API_KEY=(your tuya api key) API_SECRET=(your tuya secret) USER_ID=(tuya user id from tuya developer account) yarn start
```

With NPM
```bash
MQTT_HOST=(your mqtt host) MQTT_PORT=(your mqtt port) MQTT_USERNAME=(your mqtt username) MQTT_PASSWORD=(your mqtt password) API_KEY=(your tuya api key) API_SECRET=(your tuya secret) USER_ID=(tuya user id from tuya developer account) npm run start
```


You can install screen to run above script in background
```bash
sudo apt-get install screen
```