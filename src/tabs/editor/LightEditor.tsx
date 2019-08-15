import { STATUS_CODES } from "http";
import _ from "lodash";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import { createBasesFromColor, rgb, rgbStrings, rgbStrings as solarized } from "solarizer";
import { LightsApi } from "../../hue/LightsApi";
import { ColorMode } from "../../models/ColorMode";
import { Lights } from "../../models/Light";
import { Light } from "../../models/Light";
import { getStyles } from "../common/Style";
import { getColorPicker2 } from "./components/ColorPicker";
import { getLightSelector } from "./components/LightSelector";
import { getStatusToggleRow, Status } from "./components/StatusToggle";
import { getSubmitCancel } from "./components/SubmitCancel";
import { getTabLike } from "./components/TabLike";
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
      const allLights = await lightPromise;
      if (light.state.colormode) {
        light.state.colormode = ColorMode.HS;
        light.state.hue = light.state.hue ? light.state.hue : 0;
        light.state.sat = light.state.sat ? light.state.sat : 0;
      }
      this.setState({ light });
    }
  }

  changeField(value: any, fieldName: string) {
    console.log(`${fieldName} changed: ${value}`);
    _.set(this.state.light, fieldName, value);
    this.setState({ light: this.state.light });
  }

  async submitChanges() {
    await this.lightsApi.put(this.state.light);
    const light = await this.lightsApi.get(this.state.light.id);
    this.setState({ light });
  }

  async resetChanges() {
    this.setState({ light: await this.lightsApi.get(this.state.light.id) });
  }

  async setHsb(hsb: { hue: number, sat: number, bri: number }) {
    this.state.light.state.bri = hsb.bri;
    this.state.light.state.sat = hsb.sat;
    this.state.light.state.hue = hsb.hue;
    this.setState({ light: this.state.light });
    await this.lightsApi.putState(this.state.light.id, this.state.light.state);
    this.setState({ light: await this.lightsApi.get(this.state.light.id) });
  }

  render() {
    const styles = getStyles();
    const getView = () =>
      this.state.light
        ? <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {getTitle("Light", this.state.light.id, this.state.light.name, this.changeField.bind(this))}
              {/* {
                this.state.editingColor
                  ? getColorPicker2(
                    this.state.light.state.hue,
                    this.state.light.state.sat,
                    this.state.light.state.bri,
                    this.setHsb.bind(this),
                    "LightModalColorPicker",
                  ) : null
              } */}
              {/* {
                getTabLike([
                  {
                    label: "Change Colors",
                    selected: this.state.editingColor,
                    toggleCallback: this.toggleEditingLightsOrColors.bind(this),
                    selectedColors: createBasesFromColor(rgb.green, "base01"),
                    deSelectedColors: rgbStrings,
                  },
                  {
                    label: "Select Lights",
                    selected: this.state.editingLights,
                    toggleCallback: this.toggleEditingLightsOrColors.bind(this),
                    selectedColors: createBasesFromColor(rgb.green, "base01"),
                    deSelectedColors: rgbStrings,
                  },
                ])
              } */}
              {
                getStatusToggleRow(
                  "Light Status Row",
                  "action.on",
                  {
                    onText: "Currently: All On",
                    offText: "Currently: All Off",
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
                  this.changeField.bind(this),
                )
              }
              {
                getSubmitCancel(
                  "Submit Changes",
                  "Reset Changes",
                  this.submitChanges.bind(this),
                  this.resetChanges.bind(this),
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
