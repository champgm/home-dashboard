# home-dashboard

This project is adapted from [home-dashboard](https://github.com/champgm/home-dashboard).

It is created with Expo typescript template:

`npx create-expo-app --template`

## Running & Testing
`npx expo start`

## Build
https://docs.expo.dev/build/setup/

Steps to install the app directly to the Android device:

1. Create EAS build

- Install lastest EAS CLI \
`npm install -g eas-cli`

- Log in to EXPO (need EXPO username/pwd) \
`eas login`

- Configure project - this will generate `eas.json` file \
`eas build:configure`

2. Build APKs for android emulators/devices

- Modify `eas.json` like the following:
```
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "preview2": {
      "android": {
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "preview3": {
      "developmentClient": true
    },
    "production": {}
  }
}

```

- Run build \
`eas build -p android --profile preview`

- Download and install on device

Note:
I created `.easignore` file in addition to `.gitignore` file so that EAS will be able to find the configuration file.