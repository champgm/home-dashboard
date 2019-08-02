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
    _.set(this.state.group, fieldName, value);
    // this.state.group[fieldName] = value;
    this.setState({ group: this.state.group });
  }

  changeLights(lights: string[]) {
    console.log(`setting group.lights`);
    console.log(`to: ${lights}`);
    this.state.group.lights = lights;
    this.setState({ group: this.state.group });
  }

  // getSelectedLights(): Light[] {
  //   return Object.values(this.state.allLights)
  //     .filter((light) => this.state.group.lights.includes(light.id));
  // }

  render() {
    const styles = getStyles();
    const modalView = () =>
      this.state.group
        ? <ScrollView >
          {getStringInputRow("ID", "id", this.state.group.id, false)}
          {getStringInputRow("Type", "type", this.state.group.type, false)}
          {getLabelOnlyRow("State")}
          <View style={[styles.fieldRowSubContainer]}>
            {getToggleRow("All On", "state.all_on", this.state.group.state.all_on, false)}
            {getToggleRow("Any On", "state.any_on", this.state.group.state.any_on, false)}
          </View>
          {getStringInputRow("Name", "name", this.state.group.name, true, this.changeField.bind(this))}
          {getToggleRow("Recycle", "recycle", this.state.group.recycle, true, this.changeField.bind(this))}
          {getMultiSelectRow("Lights", this.state.group.lights, Object.values(this.state.allLights), this.changeLights.bind(this))}
          <TouchableHighlight
            onPress={() => {
              this.props.onEditCancel();
              this.setState({ visible: false });
            }}>
            <Text>Hide Modal</Text>
          </TouchableHighlight>
        </ScrollView>
        : <ActivityIndicator size="large" color="#0000ff" />;
    return (
      <View >
        <Modal
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
