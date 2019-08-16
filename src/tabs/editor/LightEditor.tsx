import _ from "lodash";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import { rgbStrings as solarized } from "solarizer";
import { LightsApi } from "../../hue/LightsApi";
import { Alert } from "../../models/Alert";
import { ColorMode } from "../../models/ColorMode";
import { getBlinking } from "../../models/Light";
import { Light } from "../../models/Light";
import { deregister, register } from "../common/Alerter";
import { getStyles } from "../common/Style";
import { getColorPicker2 } from "./components/ColorPicker";
import { getStatusToggleRow, Status } from "./components/StatusToggle";
import { getTitle } from "./components/Title";

interface State {
  light?: Light;
  hsb?: any;
}

export class LightEditor extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  lightsApi: LightsApi;
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
      console.log(`light${JSON.stringify(light, null, 2)}`);
      if (light.state.colormode && (light.state.colormode !== ColorMode.HS)) {
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
    console.log(`Set HSB: ${JSON.stringify(hsb)}`);
    await this.lightsApi.putState(this.state.light.id, {
      hue: this.state.light.state.hue,
      sat: this.state.light.state.sat,
      bri: this.state.light.state.bri,
    });
    this.setState({ light: await this.lightsApi.get(this.state.light.id) });
  }

  render() {
    const styles = getStyles();
    const getView = () =>
      this.state.light
        ? <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {getTitle(
                "Light",
                this.state.light.id,
                this.state.light.name,
                this.endNameEdit.bind(this),
                this.setName.bind(this))
              }
              {
                getColorPicker2(
                  {
                    h: this.state.light.state.hue ? this.state.light.state.hue : 0,
                    s: this.state.light.state.sat ? this.state.light.state.sat : 0,
                    b: this.state.light.state.bri,
                  },
                  this.setHsb.bind(this),
                  "GroupModalColorPicker",
                )
              }
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
              {/* {
                getSubmitCancel(
                  "Submit Changes",
                  "Reset Changes",
                  this.submitChanges.bind(this),
                  this.resetChanges.bind(this),
                )
              } */}
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
