import _ from "lodash";
import React, { Component } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
  ViewStyle,
} from "react-native";
import { getLabelOnlyRow, getMultiSelectRow, getStringInputRow, getToggleRow } from ".";
// import Modal from "react-native-modal";
import { style } from "../../common";
import { GroupsApi } from "../../hue/GroupsApi";
import { LightsApi } from "../../hue/LightsApi";
import { Group } from "../../models/Group";
import { Light, Lights } from "../../models/Light";
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

  render() {
    const { height } = Dimensions.get("window");
    const styles = getStyles();
    const stateAsSelectables = () => Object.keys(this.state.group.state).map((stateKey) => ({ id: stateKey, name: stateKey }));
    const statesOn = () => Object.keys(this.state.group.state).filter((stateKey) => (this.state.group.state[stateKey]));
    const modalView = () =>
      this.state.group
        ? <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{
            flex: 1,
            borderColor: "#000000",
            backgroundColor: "#d8d8d8",
            borderRadius: 5,
            borderWidth: 2,
          }}>
            {getStringInputRow("ID", "id", this.state.group.id, false)}
            {getStringInputRow("Type", "type", this.state.group.type, false)}
            {getLabelOnlyRow("State")}
            <View style={[styles.fieldRowSubContainer]}>
              {getToggleRow("All On", "state.all_on", this.state.group.state.all_on, false)}
              {getToggleRow("Any On", "state.any_on", this.state.group.state.any_on, false)}
            </View>
            {getMultiSelectRow("State", statesOn(), stateAsSelectables(), () => { }, true)}
            {getStringInputRow("Name", "name", this.state.group.name, true, this.changeField.bind(this))}
            {getMultiSelectRow("Lights", this.state.group.lights, Object.values(this.state.allLights), this.toggleLightSelection.bind(this))}
            {getToggleRow("Recycle", "recycle", this.state.group.recycle, true, this.changeField.bind(this))}
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
