import _ from "lodash";
import React from "react";
import ColorPicker from "react-colorizer";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { getColorPicker, getLabelOnlyRow, getMultiSelectRow, getStringInputRow, getToggleRow } from ".";
import { GroupsApi } from "../../hue/GroupsApi";
import { LightsApi } from "../../hue/LightsApi";
import { ColorMode, verify as verifyColorMode } from "../../models/ColorMode";
import { Group } from "../../models/Group";
import { Lights } from "../../models/Light";
import { getStyles } from "../common/Style";

export interface Props {
  id: string;
  groupsApi: GroupsApi;
  lightsApi: LightsApi;
  visible: boolean;
  onEditSubmit: (id: string) => {};
  onEditCancel: () => {};
}

interface State {
  group?: Group;
  allLights?: Lights;
  originalGroup?: Group;
  hasGroup: boolean;
  visible: boolean;
}

export class GroupModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasGroup: this.props.id !== "-1",
      visible: this.props.visible,
    };
  }

  async componentDidMount() {
    if (this.props.id !== "-1") {
      const groupPromise = this.props.groupsApi.get(this.props.id);
      const lightPromise = this.props.lightsApi.getAll();
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
        hasGroup: true,
        originalGroup: group,
      });
    }
  }

  changeField(value: any, fieldName: string) {
    console.log(`${fieldName} changed: ${value}`);
    _.set(this.state.group, fieldName, value);
    // this.state.group[fieldName] = value;
    this.setState({ group: this.state.group });
  }

  toggleLightSelection(lightId) {
    this.state.group.lights = this.state.group.lights.includes(lightId)
      ? this.state.group.lights.filter((selectedId) => selectedId !== lightId)
      : this.state.group.lights.concat(lightId);
    this.setState({ group: this.state.group });
  }
  // selectColorMode(colorMode: string) {
  //   this.state.group.action.colormode = colorMode.toLocaleLowerCase() as ColorMode;
  //   this.setState({ group: this.state.group });
  // }

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
    // const get
    const modalView = () =>
      this.state.group
        ? <View style={{ flex: 1 }}>
          <ScrollView>
            <TouchableOpacity>
              <TouchableHighlight>
                <View>
                  {getStringInputRow("ID", "id", this.state.group.id, false)}
                  {getStringInputRow("Type", "type", this.state.group.type, false)}
                  {getMultiSelectRow("State", statesOn(), stateAsSelectables(), () => { }, true, false)}
                  {getStringInputRow("Name", "name", this.state.group.name, true, this.changeField.bind(this))}
                  {getMultiSelectRow("Lights", this.state.group.lights, Object.values(this.state.allLights), this.toggleLightSelection.bind(this))}
                  {getLabelOnlyRow("Action")}
                  <View style={styles.fieldRowSubContainer}>
                    {getToggleRow("On", "action.on", this.state.group.action.on, true, this.changeField.bind(this))}
                    {/* {this.state.group.action.colormode
                      ? getMultiSelectRow(
                        "Color Mode",
                        [this.state.group.action.colormode.toLocaleUpperCase()],
                        [{ id: "XY", name: "XY" }, { id: "HS", name: "HS" }, { id: "CT", name: "CT" }],
                        this.selectColorMode.bind(this),
                        false,
                        false)
                      : undefined} */}
                    {getColorPicker(
                      this.state.group.action.hue,
                      this.state.group.action.sat,
                      this.state.group.action.bri,
                      this.setHsb.bind(this),
                      "GroupModalColorPicker",
                    )}
                  </View>
                  {getToggleRow("Recycle", "recycle", this.state.group.recycle, true, this.changeField.bind(this))}
                </View>
              </TouchableHighlight>
            </TouchableOpacity>
          </ScrollView>
          <TouchableHighlight
            onPress={() => {
              this.setState({ visible: false });
              this.props.onEditCancel();
            }}>
            <Text>Hide Modal</Text>
          </TouchableHighlight>
        </View>
        : <ActivityIndicator size="large" color="#0000ff" />;
    return (
      <View>
        <Modal
          // presentationStyle="formSheet"
          animationType="slide"
          transparent={false}
          visible={this.state.visible}
        >
          {modalView()}
        </Modal>
      </View>
    );
  }
}
