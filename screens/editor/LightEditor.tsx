import { useEffect } from "react";
import { useState } from "react";
import { ActivityIndicator, Alert as NativeAlert } from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { update } from "../../common/HueState";
import { getStyles } from "../../common/Style";
import { ScrollView, View } from "../../components/Themed";
import { LightsApi } from "../../hue/LightsApi";
import { getBlinking, Light } from "../../models/Light";
import { RootStackScreenProps, RootTabScreenProps } from "../../types";
import { getBrightnessSlider } from "./components/BrightnessSlider";
import { getStatusToggleRow, Status } from "./components/StatusToggle";
import { getTitle } from "./components/Title";
import { rgbStrings as solarized } from "solarizer";
import { ColorMode } from "../../models/ColorMode";
import { Alert } from "../../models/Alert";
import { LightState } from "../../models/LightState";


export default function LightEditor({ route, navigation }: RootStackScreenProps<'LightEditor'>) {

    const {id, name, brightness, alert, on} = route.params;
    // TODO not a good way to init light
    const [light, setLight] = useState<Light>(Object);

    const [lightName, setLightName] = useState<string>(name);
    const [lightBrightness, setLightBrightness] = useState<number>(brightness);
    const [lightAlert, setLightAlert] = useState<string>(alert);
    const [lightOnState, setLightOnState] = useState<boolean>(on);

    const lightsApi = new LightsApi();
    let debouncingBrightness = false;

    useEffect(() => {
       (async () => {
            if (id !== "-1") {
                const lgt = await lightsApi.get(id);
                if (
                  lgt.state.colormode
                  && (lgt.state.colormode !== ColorMode.HS)
                  && lgt.state.on
                ) {
                  lgt.state.colormode = ColorMode.HS;
                  lgt.state.hue = lgt.state.hue ? lgt.state.hue : 0;
                  lgt.state.sat = lgt.state.sat ? lgt.state.sat : 254;
                  await lightsApi.putState(id, lgt.state);
                }
                setLight(lgt)
              }
       })()
    }, [])
    
    async function endNameEdit() {
        const lgt = {...light, name: lightName}
        await lightsApi.put(lgt);
        await update();

        setLight(lgt);
    }

    function setBrightness(brightness: number, overrideDebounce: boolean) {
        if (!debouncingBrightness || overrideDebounce) {
            debouncingBrightness = true;
            const lightState = {...light.state, bri: brightness}
            const lgt = {...light, state: lightState}
            // don't need await - it will cause slider stuck/jumping 
            lightsApi.putState(id, { bri: brightness });
            update()

            setLightBrightness(brightness)
            setLight(lgt)
            setTimeout(() => debouncingBrightness = false, 500);
        }
    }

    async function toggleAlert(alert: boolean) {
        console.log("alert value after " + alert)

        let lightState: LightState;
        let alertType: string;
        if (alert) {
            alertType = Alert.LSELECT
            lightState = {...light.state, alert: alertType}
        } else {
            alertType = Alert.NONE;
            lightState = {...light.state, alert: alertType}
        }

        const lgt = {...light, state: lightState};
        await lightsApi.putState(id, { alert: alertType });
        await update()

        setLightAlert(alertType);
        setLight(lgt)
    }

    async function toggleOn(on: boolean) {
        const lightState = {...light.state, on: on}
        await lightsApi.putState(id, { on: on });
        await update();

        setLightOnState(on);
        setLight({...light, state: lightState})
    }

    async function deleteLight() {
        await lightsApi.delete(id);
        await update()
        navigation.goBack()
    }

    const deleteAlert = () => {
      NativeAlert.alert('', 'Delete Light?', [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {text: 'Delete', onPress: () => deleteLight()},
      ]);
    }

    const styles = getStyles();
    const getView = () =>
      id ?
            <View style={{ flex: 1 }}>
              <AwesomeButton
                style={{ marginTop: styles.buttonHeight / 2 }}
                key={`Delete Light: ${id}`}
                // accessibilityLabel={`Delete Light: ${light.id}`}
                backgroundColor={styles.red.base01}
                backgroundActive={styles.red.base02}
                backgroundDarker={styles.red.base03}
                textColor={styles.red.base1}
                height={styles.buttonHeight / 2}
                onPress={() => deleteAlert()}
              >{` DELETE `}</AwesomeButton>
              {getTitle(
                "Light",
                id,
                lightName,
                endNameEdit,
                setLightName)
              }
              {getBrightnessSlider(
                lightBrightness,
                setBrightness,
                solarized,
              )}
              {
                getStatusToggleRow(
                  "Light Alert Row",
                  "action.alert",
                  {
                    onText: "Currently: Blinking",
                    offText: "Currently: Not Blinking",
                    onBaseColor: solarized.yellow,
                    offBaseColor: solarized.base01,
                  },
                  {
                    turnOnText: "Start",
                    turnOffText: "Stop",
                    turnOnBaseColor: solarized.yellow,
                    turnOffBaseColor: solarized.red,
                  },
                  () => getBlinking(lightAlert),
                  toggleAlert,
                )
              }
              {
                getStatusToggleRow(
                  "Light Status Row",
                  "state.on",
                  {
                    onText: "Currently: On",
                    offText: "Currently: Off",
                    onBaseColor: solarized.yellow,
                    offBaseColor: solarized.base01,
                  },
                  {
                    turnOnText: "Turn On",
                    turnOffText: "Turn Off",
                    turnOnBaseColor: solarized.yellow,
                    turnOffBaseColor: solarized.red,
                  },
                  () => lightOnState ? Status.ON : Status.OFF,
                  toggleOn,
                )
              }
            </View>
        : <ActivityIndicator size="large" color="#0000ff" />;

    return (
        <View style={[{ flex: 1 }, styles.background]}>
            {getView()}
        </View>
    );
}