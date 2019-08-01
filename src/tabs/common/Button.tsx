import _ from "lodash";
import React, { Component } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  View,
} from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { LightModal } from "../LightModal";

export interface Props {
  id: string;
  on?: boolean;
  title: string;
  onFavoriteClick: (id: string) => void;
  onEditClick: (id: string) => void;
  onClick: (id: string) => void;
}

interface State {
  on: boolean;
}

export class ItemButton extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      on: this.props.on,
    };
  }
  render() {
    const { width } = Dimensions.get("window");
    const margin = width * .01;
    const buttonDimension = width * .2;
    const editButtonDimension = buttonDimension / 3;
    return (
      <View style={[styles.buttonContainer, {
        marginBottom: margin * 4,
        marginLeft: margin,
        marginRight: margin,
        marginTop: margin * 4,
        width: buttonDimension,
        height: buttonDimension,
        maxHeight: buttonDimension,
        maxWidth: buttonDimension,
      }]}>
        {/* <this.props.editModalClass visible={false} /> */}
        <AwesomeButton
          // Main button
          paddingHorizontal={5}
          height={buttonDimension}
          width={buttonDimension}
          onPress={() => this.props.onClick(this.props.id)}>
          {this.props.title}
        </AwesomeButton>
        <AwesomeButton
          // Edit button
          onPress={() => this.props.onEditClick(this.props.id)}
          backgroundColor="#3399ff"
          backgroundDarker="#0000ff"
          style={{
            width: buttonDimension / 3,
            height: buttonDimension / 3,
            top: -(buttonDimension / 5.5),
            left: buttonDimension * .75,
          }}
          height={editButtonDimension}
          width={editButtonDimension}>
          <Image
            style={{
              width: editButtonDimension * .8,
              height: editButtonDimension * .8,
            }}
            source={require("../../../assets/edit.png")} />
        </AwesomeButton>
        <AwesomeButton
          // Favorite button
          onPress={() => this.props.onFavoriteClick(this.props.id)}
          backgroundColor="#ffcc66"
          backgroundDarker="#ff9900"
          style={{
            width: buttonDimension / 3,
            height: buttonDimension / 3,
            top: -(editButtonDimension + buttonDimension / 5.5),
            left: -(buttonDimension * .06),
          }}
          height={editButtonDimension}
          width={editButtonDimension}>
          <Image
            style={{
              width: editButtonDimension * .8,
              height: editButtonDimension * .8,
            }}
            source={require("../../../assets/favorite.png")} />
        </AwesomeButton>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {},
  favoriteButton: {
    bottom: 70,
  },
});
