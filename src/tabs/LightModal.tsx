import React, { Component } from "react";
import { Alert, Dimensions, Modal, Text, TouchableHighlight, View } from "react-native";

export interface Props {
  id: string;
  visible: boolean;
  onEditSubmit: (id: string) => {};
  onEditCancel: () => {};
}

interface State {
  visible: boolean;
}

export class LightModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { visible: this.props.visible };
  }

  render() {
    const { height, width } = Dimensions.get("window");
    return (
      <View >
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.visible}
          onRequestClose={() => {
            Alert.alert("Modal has been closed.");
          }}>
          <View style={{ marginTop: height * .1 }}>
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
        </Modal>
      </View>
    );
  }
}
