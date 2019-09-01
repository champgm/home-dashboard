import _ from "lodash";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import { createBasesFromColor, rgb, rgbStrings, rgbStrings as solarized } from "solarizer";
import { GroupsApi } from "../../hue/GroupsApi";
import { LightsApi } from "../../hue/LightsApi";
import { Alert } from "../../models/Alert";
import { ColorMode } from "../../models/ColorMode";
import { getBlinking, getEmpty, getStatus, Group } from "../../models/Group";
import { Lights } from "../../models/Light";
import { deregister, register } from "../common/Alerter";
import { lights } from "../common/HueState";
import { getStyles } from "../common/Style";
import { getBrightnessSlider } from "./components/BrightnessSlider";
import { getColorPicker2 } from "./components/ColorPicker";
import { getLightSelector } from "./components/LightSelector";
import { getStatusToggleRow } from "./components/StatusToggle";
import { getTabLike } from "./components/TabLike";
import { getTitle } from "./components/Title";

interface State {
  group?: Group;
  lights?: Lights;
  hsb?: any;
  editingLights: boolean;
  editingColor: boolean;
  newGroup?: boolean;
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
      const group = await groupPromise;
      if (group.action.colormode) {
        group.action.colormode = ColorMode.HS;
        group.action.hue = group.action.hue ? group.action.hue : 0;
        group.action.sat = group.action.sat ? group.action.sat : 0;
      }
      this.setState({ lights, group, newGroup: false });
    } else {
      const group = getEmpty();
      this.setState({ lights, group, newGroup: true });
    }
  }

  componentWillUnmount() {
    deregister("GroupEditor");
  }

  setName(name: string) {
    this.state.group.name = name;
    this.setState({ group: this.state.group });
  }

  async updateGroup() {
    if (!this.state.newGroup) {
      await this.groupsApi.put(this.state.group);
      this.setState({ group: await this.groupsApi.get(this.state.group.id) });
    } else {
      this.setState({ group: this.state.group });
    }
  }

  async toggleLightSelection(lightId) {
    this.state.group.lights = this.state.group.lights.includes(lightId)
      ? this.state.group.lights.filter((selectedId) => selectedId !== lightId)
      : this.state.group.lights.concat(lightId);
    await this.updateGroup();
  }

  async toggleOn(on: boolean) {
    this.state.group.action.on = on;
    await this.updateGroup();
  }

  async toggleAlert(alert: boolean) {
    if (alert) {
      this.state.group.action.alert = Alert.LSELECT;
    } else {
      this.state.group.action.alert = Alert.NONE;
    }
    await this.updateGroup();
  }

  async setBrightness(brightness: number, overrideDebounce: boolean) {
    if (!this.debouncingBrightness || overrideDebounce) {
      this.debouncingBrightness = true;
      this.state.group.action.bri = brightness;
      await this.updateGroup();
      setTimeout(() => this.debouncingBrightness = false, 500);
    }
  }

  async createGroup() {
    await this.groupsApi.create(this.state.group);
    this.props.navigation.navigate("Groups");
  }

  async deleteGroup() {
    await this.groupsApi.delete(this.state.group.id);
    this.props.navigation.navigate("Groups");

  }

  render() {
    const styles = getStyles();
    const getView = () =>
      this.state.group
        ? <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              <AwesomeButton
                style={{ marginTop: styles.buttonHeight / 2 }}
                key={`Delete Light: ${this.state.group.id}`}
                accessibilityLabel={`Delete Light: ${this.state.group.id}`}
                backgroundColor={styles.red.base01}
                backgroundActive={styles.red.base02}
                backgroundDarker={styles.red.base03}
                textColor={styles.red.base1}
                height={styles.buttonHeight / 2}
                onPress={() => this.deleteGroup()}
              >{` DELETE `}</AwesomeButton>
              {getTitle(
                "Group",
                this.state.group.id,
                this.state.group.name,
                this.updateGroup.bind(this),
                this.setName.bind(this))}
              {
                getLightSelector(
                  this.state.group.lights,
                  Object.values(this.state.lights),
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
              {
                this.state.newGroup ?
                  <AwesomeButton
                    style={{
                      alignSelf: "flex-end",
                    }}
                    key={`Create Group`}
                    accessibilityLabel={`Create Group`}
                    backgroundColor={styles.green.base01}
                    backgroundActive={styles.green.base02}
                    backgroundDarker={styles.green.base03}
                    textColor={styles.green.base1}
                    height={styles.buttonHeight}
                    onPress={() => this.createGroup()}
                  >
                    {` Create `}
                  </AwesomeButton> : undefined
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
