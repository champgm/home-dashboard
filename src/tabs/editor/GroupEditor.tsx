import _ from "lodash";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import { createBasesFromColor, rgb, rgbStrings, rgbStrings as solarized } from "solarizer";
import { GroupsApi } from "../../hue/GroupsApi";
import { LightsApi } from "../../hue/LightsApi";
import { Alert } from "../../models/Alert";
import { ColorMode } from "../../models/ColorMode";
import { getBlinking, getStatus, Group } from "../../models/Group";
import { Lights } from "../../models/Light";
import { deregister, register } from "../common/Alerter";
import { getStyles } from "../common/Style";
import { getBrightnessSlider } from "./components/BrightnessSlider";
import { getColorPicker2 } from "./components/ColorPicker";
import { getLightSelector } from "./components/LightSelector";
import { getStatusToggleRow } from "./components/StatusToggle";
import { getTabLike } from "./components/TabLike";
import { getTitle } from "./components/Title";

interface State {
  group?: Group;
  allLights?: Lights;
  hsb?: any;
  editingLights: boolean;
  editingColor: boolean;
}

export class GroupEditor extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  groupsApi: GroupsApi;
  lightsApi: LightsApi;
  debouncingBrightness = false;

  constructor(props) {
    super(props);
    this.state = {
      editingColor: false,
      editingLights: true,
    };
    this.groupsApi = new GroupsApi();
    this.lightsApi = new LightsApi();
  }

  async componentDidMount() {
    const id = this.props.navigation.getParam("id", "-1");
    if (id !== "-1") {
      const groupPromise = this.groupsApi.get(id);
      const lightPromise = this.lightsApi.getAll();
      const group = await groupPromise;
      const allLights = await lightPromise;
      if (group.action.colormode) {
        group.action.colormode = ColorMode.HS;
        group.action.hue = group.action.hue ? group.action.hue : 0;
        group.action.sat = group.action.sat ? group.action.sat : 0;
      }
      this.setState({
        allLights,
        group,
      });
    }
    register("GroupEditor", this.componentDidMount.bind(this));
  }

  componentWillUnmount() {
    deregister("GroupEditor");
  }

  setName(name: string) {
    this.state.group.name = name;
    this.setState({ group: this.state.group });
  }

  async endNameEdit() {
    await this.groupsApi.put(this.state.group);
    this.setState({ group: await this.groupsApi.get(this.state.group.id) });
  }

  async toggleLightSelection(lightId) {
    this.state.group.lights = this.state.group.lights.includes(lightId)
      ? this.state.group.lights.filter((selectedId) => selectedId !== lightId)
      : this.state.group.lights.concat(lightId);
    this.groupsApi.put(this.state.group);
    this.setState({ group: await this.groupsApi.get(this.state.group.id) });
  }

  async toggleOn(on: boolean) {
    this.state.group.action.on = on;
    await this.groupsApi.putAction(this.state.group.id, { on: this.state.group.action.on });
    this.setState({ group: await this.groupsApi.get(this.state.group.id) });
  }

  async toggleAlert(alert: boolean) {
    if (alert) {
      this.state.group.action.alert = Alert.LSELECT;
    } else {
      this.state.group.action.alert = Alert.NONE;
    }
    await this.groupsApi.putAction(this.state.group.id, { alert: this.state.group.action.alert });
    this.setState({ group: await this.groupsApi.get(this.state.group.id) });
  }

  async setHsb(hsb: { h: number, s: number, b: number }) {
    if (this.state.group.action.colormode) {
      this.state.group.action.sat = hsb.s;
      this.state.group.action.hue = hsb.h;
    }
    this.state.group.action.bri = hsb.b;
    await this.groupsApi.putAction(this.state.group.id, this.state.group.action);
    this.setState({ group: await this.groupsApi.get(this.state.group.id) });
  }

  async setBrightness(brightness: number, overrideDebounce: boolean) {
    if (!this.debouncingBrightness || overrideDebounce) {
      this.debouncingBrightness = true;
      this.state.group.action.bri = brightness;
      await this.groupsApi.putAction(this.state.group.id, { bri: brightness });
      await this.setState({ group: await this.groupsApi.get(this.state.group.id) });
      setTimeout(() => this.debouncingBrightness = false, 500);
    }
  }

  render() {
    const styles = getStyles();
    const getView = () =>
      this.state.group
        ? <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {getTitle(
                "Group",
                this.state.group.id,
                this.state.group.name,
                this.endNameEdit.bind(this),
                this.setName.bind(this))}
              {
                getLightSelector(
                  this.state.group.lights,
                  Object.values(this.state.allLights),
                  this.toggleLightSelection.bind(this),
                )
              }
              {getBrightnessSlider(
                this.state.group.action.bri,
                this.setBrightness.bind(this),
                solarized,
              )}
              {
                getStatusToggleRow(
                  "Group Alert Row",
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
                  () => getBlinking(this.state.group),
                  this.toggleAlert.bind(this),
                )
              }
              {
                getStatusToggleRow(
                  "Group Status Row",
                  "action.on",
                  {
                    onText: "Currently: All On",
                    offText: "Currently: All Off",
                    indeterminateText: "Some On",
                    onBaseColor: solarized.yellow,
                    offBaseColor: solarized.base01,
                    indeterminateBaseColor: solarized.orange,
                  },
                  {
                    turnOnText: "Turn On",
                    turnOffText: "Turn Off",
                    turnOnBaseColor: solarized.yellow,
                    turnOffBaseColor: solarized.base01,
                  },
                  () => getStatus(this.state.group),
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
