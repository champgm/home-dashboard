import _ from "lodash";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  View,
} from "react-native";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import { createBasesFromColor, rgb, rgbStrings, rgbStrings as solarized } from "solarizer";
import { GroupsApi } from "../../hue/GroupsApi";
import { LightsApi } from "../../hue/LightsApi";
import { ColorMode, verify as verifyColorMode } from "../../models/ColorMode";
import { Group } from "../../models/Group";
import { Lights } from "../../models/Light";
import { getStyles } from "../common/Style";
import { getLightSelector } from "./LightSelector";
import { getTabLike } from "./TabLike";
import { getTitle } from "./Title";
import { getColorPicker2 } from "./ColorPicker";
import { Status, getStatusToggleRow } from "./StatusToggle";

interface State {
  group?: Group;
  allLights?: Lights;
  originalGroup?: Group;
  hsb?: any;
  editingLights: boolean;
  editingColor: boolean;
}

export class GroupEditor extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  groupsApi: GroupsApi;
  lightsApi: LightsApi;
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
        originalGroup: group,
      });
    }
  }

  changeField(value: any, fieldName: string) {
    console.log(`${fieldName} changed: ${value}`);
    _.set(this.state.group, fieldName, value);
    this.setState({ group: this.state.group });
  }

  toggleLightSelection(lightId) {
    this.state.group.lights = this.state.group.lights.includes(lightId)
      ? this.state.group.lights.filter((selectedId) => selectedId !== lightId)
      : this.state.group.lights.concat(lightId);
    this.setState({ group: this.state.group });
  }

  toggleEditingLightsOrColors() {
    this.setState({
      editingLights: !this.state.editingLights,
      editingColor: !this.state.editingColor,
    });
  }

  setHsb(hsb: { hue: number, sat: number, bri: number }) {
    this.state.group.action.bri = hsb.bri;
    this.state.group.action.sat = hsb.sat;
    this.state.group.action.hue = hsb.hue;
    this.setState({ group: this.state.group });
  }

  render() {
    const { height } = Dimensions.get("window");
    const styles = getStyles();
    const stateAsSelectables = () => Object.keys(this.state.group.state).map((stateKey) => ({ id: stateKey, name: stateKey }));
    const statesOn = () => Object.keys(this.state.group.state).filter((stateKey) => (this.state.group.state[stateKey]));

    const getView = () =>
      this.state.group
        ? <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {getTitle("Group", this.state.group.id, this.state.group.name, this.changeField.bind(this))}
              {
                this.state.editingColor
                  ? getColorPicker2(
                    // this.state.hsb,
                    this.state.group.action.hue,
                    this.state.group.action.sat,
                    this.state.group.action.bri,
                    this.setHsb.bind(this),
                    "GroupModalColorPicker",
                  )
                  : null
              }
              {
                this.state.editingLights
                  ? getLightSelector(
                    this.state.group.lights,
                    Object.values(this.state.allLights),
                    this.toggleLightSelection.bind(this),
                  )
                  : null
              }
              {
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
                  () => {
                    if (this.state.group.state.all_on) { return Status.ON; }
                    if (this.state.group.state.any_on) { return Status.INDETERMINATE; }
                    if (!this.state.group.state.any_on) { return Status.OFF; }
                  },
                  this.changeField.bind(this),
                )
              }
              {/* {getToggleRow("Recycle", "recycle", this.state.group.recycle, true, this.changeField.bind(this))} */}
            </View>
          </ScrollView>
          {/* <TouchableHighlight
            onPress={() => {

              this.props.navigation.navigate("Home", {

              });
            }}>
            <Text>Hide Modal</Text>
          </TouchableHighlight> */}
        </View >
        : <ActivityIndicator size="large" color="#0000ff" />;
    return (
      <View style={[{ flex: 1 }, styles.background]}>
        {getView()}
      </View>
    );
  }
}
