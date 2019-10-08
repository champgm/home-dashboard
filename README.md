# Home Dashboard
An amalgamation dashboard for the various smart devices in my home.

![image](https://raw.githubusercontent.com/champgm/home-dashboard/React-Native/screenshot1.png) ![image](https://raw.githubusercontent.com/champgm/home-dashboard/React-Native/screenshot2.png)  ![image](https://raw.githubusercontent.com/champgm/home-dashboard/React-Native/screenshot3.png)

# Configuration
A file, named `Hue.ts` should be placed in `src/configuration`. Its contents should look something like this:
```typescript
const localNetwork = "http://<bridgeIp>:80/api/<bridgeApiKey>";
const localWithEmulator = "http://10.0.2.2:<expoPort>/api/<bridgeApiKey>";

export const bridgeUri = __DEV__ ? localWithEmulator : localNetwork;
```

# Start for testing/development
## Install [Expo](https://expo.io)
```
npm install -g expo
```
## Start Expo
Choose one
```
npm run startlocal
npm run startlan
npm run android
```
A convenience script to start a local android emulator (if installed) without opening Android Studio is included. You will need to modify this if your emulator isn't named `Pixel_2_API_28`.
```
npm run emulator
```

# Build package
You will need to configure your [expo](https://expo.io) account, but it should prompt you to do so if you haven't already
```
npm run build
```