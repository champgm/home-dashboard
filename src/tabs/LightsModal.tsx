import React, { Component } from "react";
import { Alert, Modal, Text, TouchableHighlight, View } from "react-native";

export interface Props {
  visible: boolean;
}

interface State {
  modalVisible: boolean;
}

export class LightsModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { modalVisible: this.props.visible };
  }

  render() {
    return (
      <View style={{ marginTop: 22 }}>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            Alert.alert("Modal has been closed.");
          }}>
          <View style={{ marginTop: 22 }}>
            <View>
              <Text>Hello World!</Text>

              <TouchableHighlight
                onPress={() => {
                  this.setState({ modalVisible: !this.state.modalVisible });
                }}>
                <Text>Hide Modal</Text>
              </TouchableHighlight>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}
