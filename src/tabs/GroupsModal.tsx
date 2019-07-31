import React, { Component } from "react";
import { Alert, Modal, Text, TouchableHighlight, View } from "react-native";
import { GroupsApi } from "../hue/GroupsApi";
import { Group } from "../models/Group";

export interface Props {
  id: string;
  api: GroupsApi;
  visible: boolean;
  onEditSubmit: (id: string) => {};
  onEditCancel: () => {};
}

interface State {
  visible: boolean;
  group?: Group;
}

export class GroupModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { visible: this.props.visible };
  }

  async componentDidMount() {
    this.setState({ group: await this.props.api.get(this.props.id) });
  }

  render() {
    return (
      <View style={{ marginTop: 22 }}>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.visible}
          onRequestClose={() => {
            Alert.alert("Modal has been closed.");
          }}>
          <View style={{ marginTop: 22 }}>
            <View>
              <Text>Hello World!</Text>
              <Text>.</Text>
              <Text>.</Text>
              <Text>.</Text>
              <Text>.</Text>
              <TouchableHighlight
                onPress={() => { this.props.onEditCancel(); }}>
                <Text>Hide Modal</Text>
              </TouchableHighlight>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}
