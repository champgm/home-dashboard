import _ from "lodash";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import { rgbStrings as solarized } from "solarizer";
import { LightsApi } from "../../hue/LightsApi";
import { Alert } from "../../models/Alert";
import { ColorMode } from "../../models/ColorMode";
import { Light } from "../../models/Light";
import { getBlinking } from "../../models/Light";
import { deregister, register } from "../common/Alerter";
import { getStyles } from "../common/Style";
import { getBrightnessSlider } from "./components/BrightnessSlider";
import { getColorPicker2 } from "./components/ColorPicker";
import { getStatusToggleRow, Status } from "./components/StatusToggle";
import { getTitle } from "./components/Title";

interface State {
  light?: Light;
  hsb?: any;
}

export class LightEditor extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  lightsApi: LightsApi;
  debouncingBrightness = false;

  constructor(props) {
    super(props);
    this.state = {
    };
    this.lightsApi = new LightsApi();
    this.lightsApi = new LightsApi();
  }

  async componentDidMount() {
    const id = this.props.navigation.getParam("id", "-1");
    if (id !== "-1") {
      const lightPromise = this.lightsApi.get(id);
      const light = await lightPromise;
      // console.log(`light${JSON.stringify(light, null, 2)}`);
      if (
        light.state.colormode
        && (light.state.colormode !== ColorMode.HS)
        && light.state.on
      ) {
        light.state.colormode = ColorMode.HS;
        light.state.hue = light.state.hue ? light.state.hue : 0;
        light.state.sat = light.state.sat ? light.state.sat : 254;
        this.lightsApi.putState(light.id, light.state);
      }
      this.setState({ light });
    }
    register("LightEditor", this.componentDidMount.bind(this));
  }

  componentWillUnmount() {
    deregister("LightEditor");
  }
  async toggleOn(on: boolean) {
    this.state.light.state.on = on;
    await this.lightsApi.putState(this.state.light.id, { on: this.state.light.state.on });
    this.setState({ light: await this.lightsApi.get(this.state.light.id) });
  }

  async toggleAlert(alert: boolean) {
    if (alert) {
      this.state.light.state.alert = Alert.LSELECT;
    } else {
      this.state.light.state.alert = Alert.NONE;
    }
    await this.lightsApi.putState(this.state.light.id, { alert: this.state.light.state.alert });
    this.setState({ light: await this.lightsApi.get(this.state.light.id) });
  }

  setName(name: string) {
    this.state.light.name = name;
    this.setState({ light: this.state.light });
  }

  async endNameEdit() {
    await this.lightsApi.put(this.state.light);
    this.setState({ light: await this.lightsApi.get(this.state.light.id) });
  }

  async deleteLight() {
    await this.lightsApi.delete(this.state.light.id);
    this.props.navigation.navigate("Lights");
  }

  async setBrightness(brightness: number, overrideDebounce: boolean) {
    if (!this.debouncingBrightness || overrideDebounce) {
      this.debouncingBrightness = true;
      this.state.light.state.bri = brightness;
      await this.lightsApi.putState(this.state.light.id, { bri: brightness });
      await this.setState({ light: await this.lightsApi.get(this.state.light.id) });
      setTimeout(() => this.debouncingBrightness = false, 500);
    }
  }

  async setHsb(hsb: { h: number, s: number, b: number }) {
    if (!this.state.light.state.on) {
      await this.lightsApi.putState(this.state.light.id, { on: true });
      await this.setState({ light: await this.lightsApi.get(this.state.light.id) });
    }
    if (this.state.light.state.colormode) {
      this.state.light.state.sat = hsb.s;
      this.state.light.state.hue = hsb.h;
    }
    this.state.light.state.bri = hsb.b;
    // console.log(`Set HSB: ${JSON.stringify(hsb)}`);
    if (this.state.light.state.on) {
      await this.lightsApi.putState(this.state.light.id, {
        hue: this.state.light.state.hue,
        sat: this.state.light.state.sat,
        bri: this.state.light.state.bri,
      });
    }
    this.setState({ light: await this.lightsApi.get(this.state.light.id) });
  }

  render() {
    const styles = getStyles();
    const getView = () =>
      this.state.light
        ? <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              <AwesomeButton
                style={{ marginTop: styles.buttonHeight / 2 }}
                key={`Delete Light: ${this.state.light.id}`}
                accessibilityLabel={`Delete Light: ${this.state.light.id}`}
                backgroundColor={styles.red.base01}
                backgroundActive={styles.red.base02}
                backgroundDarker={styles.red.base03}
                textColor={styles.red.base1}
                height={styles.buttonHeight / 2}
                onPress={() => this.deleteLight()}
              >{` DELETE `}</AwesomeButton>
              {getTitle(
                "Light",
                this.state.light.id,
                this.state.light.name,
                this.endNameEdit.bind(this),
                this.setName.bind(this))
              }
              {getBrightnessSlider(
                this.state.light.state.bri,
                this.setBrightness.bind(this),
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
                    turnOffBaseColor: solarized.base01,
                  },
                  () => getBlinking(this.state.light),
                  this.toggleAlert.bind(this),
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
                    turnOffBaseColor: solarized.base01,
                  },
                  () => this.state.light.state.on ? Status.ON : Status.OFF,
                  this.toggleOn.bind(this),
                )
              }
            </View>
          </ScrollView>
        </View >
        : <ActivityIndicator size="large" color="#0000ff" />;
    return (
      <View style={[{ flex: 1 }, styles.background]}>
        {getView()}
      </View>
    );
  }
}
