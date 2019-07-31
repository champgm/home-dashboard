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
} from "react-native";
// import Modal from "react-native-modal";
import { style } from "../common";
import { GroupsApi } from "../hue/GroupsApi";
import { LightsApi } from "../hue/LightsApi";
import { Group } from "../models/Group";

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
      this.setState({
        group: await this.props.groupsApi.get(this.props.id),
      });
    }
  }

  render() {
    const { height, width } = Dimensions.get("window");
    const inputRowHeight = 40;
    const fieldMemberStyle = {
      // margin: 20,
    };
    const modalView = this.state.group
      ? <View style={[styles.fieldRow, { marginTop: height * .1 }]}>
        <View style={[styles.inputRow, { height: inputRowHeight }]}>
          <Text style={[styles.label, fieldMemberStyle]}>Name:</Text>
          <TextInput style={[styles.input, fieldMemberStyle]}
            onChangeText={(text) => {
              const group = this.state.group;
              group.name = text;
              this.setState({ group });
            }}
            value={this.state.group.name}
          />
        </View>
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
        // onRequestClose={() => {          Alert.alert("Modal has been closed.");        }}
        >
          {modalView}
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    // height: 40,
  },
  fieldRow: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-around",
  },
  // fieldMember: {
  //   margin:
  // }
  label: {
    textAlignVertical: "center",
    // flex: 1,
  },
  input: {
    borderColor: "#000000",
    borderRadius: 5,
    borderWidth: 2,
    flex: 1,
  },
});
