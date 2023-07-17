# Hi there
This is small nodejs code to connect tuya devices to home assistant. Script will pull all devices from tuya cloud then connect with home assistant using local socket in your LAN network. Current support wifi and zigbee hub (with attached devices): switch, sensor, sence button, curtain (we are working to support more device in furture)

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
```bash
MQTT_HOST=(your mqtt host) MQTT_PORT=(your mqtt port) MQTT_USERNAME=(your mqtt username) MQTT_PASSWORD=(your mqtt password) API_KEY=(your tuya api key) API_SECRET=(your tuya secret) USER_ID=(tuya user id from tuya developer account) yarn start
```
You can install screen to run above script in background
```bash
sudo apt-get install screen
```