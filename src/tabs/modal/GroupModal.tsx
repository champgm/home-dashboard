import React, { Component } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
  ViewStyle,
} from "react-native";
import { getNameRow2, getStringInputRow } from ".";
// import Modal from "react-native-modal";
import { style } from "../../common";
import { GroupsApi } from "../../hue/GroupsApi";
import { LightsApi } from "../../hue/LightsApi";
import { Group } from "../../models/Group";
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
      const group = await this.props.groupsApi.get(this.props.id);
      this.setState({
        group,
        hasGroup: true,
        originalGroup: group,
      });
    }
  }

  changeField(value: any, fieldName: string) {
    this.state.group[fieldName] = value;
    this.setState({ group: this.state.group });
  }

  render() {
    const styles = getStyles();
    const getNameRow = () => (
      <View style={[styles.fieldRow]}>
        <Text style={[styles.label]}>Name:</Text>
        <TextInput
          value={this.state.group.name}
          style={[styles.input]}
          onChangeText={(text) => this.changeField(text, "name")}
        />
      </View>);

    const modalView = () =>
      this.state.group
        ? <View style={[styles.fieldRowContainer]}>
          {/* {getNameRow()} */}
          {getStringInputRow("ID", "id", this.state.group.id, false)}
          {getStringInputRow("Name", "name", this.state.group.name, true, this.changeField.bind(this))}
          {getStringInputRow("Type", "type", this.state.group.name, false)}
          <TouchableHighlight
            onPress={() => {
              this.props.onEditCancel();
              this.setState({ visible: false });
            }}>
            <Text>Hide Modal</Text>
          </TouchableHighlight>
        </View>
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

// const styles = StyleSheet.create({
//   fieldRow: {
//     // flexDirection: "row",
//     // height: 40,
//     // justifyContent: "space-around",
//     // height: 40,
//   },
//   fieldRowContainer: {
//     // flex: 1,
//     // flexDirection: "column",
//     // justifyContent: "center",
//   },
//   label: {
//     // textAlignVertical: "center",
//   },
//   input: {
//     // textAlignVertical: "center",
//     // borderColor: "#000000",
//     // borderRadius: 5,
//     // borderWidth: 2,
//     // flex: 1,
//   },
// });
