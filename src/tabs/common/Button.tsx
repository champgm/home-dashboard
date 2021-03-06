import _ from "lodash";
import React, { Component } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { RgbBaseMap, RgbBaseStringMap } from "solarizer/tsc-out/RgbMaps";
import { blue, yellow } from "./Style";

export interface Props {
  colorMap: RgbBaseStringMap;
  id?: string;
  isFavorite?: boolean;
  on?: boolean;
  reachable?: boolean;
  title: string;
  onFavoriteClick?: (id: string) => void;
  onEditClick?: (id: string) => void;
  onClick: (id: string) => void;
  hideEditButton?: boolean;
  hideFavoritesButton?: boolean;
}

interface State {
  on: boolean;
  reachable: boolean;
}

export class ItemButton extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      on: this.props.on,
      reachable: this.props.reachable,
    };
  }

  getReachableImage(buttonDimension) {
    if (this.props.reachable) {
      return undefined;
    }
    return (
      <Image
        style={{
          opacity: .4,
          zIndex: 100,
          width: buttonDimension * .9,
          height: buttonDimension * .9,
          top: -(buttonDimension * 1.65),
          left: buttonDimension * .07,
        }}
        source={require("../../../assets/questionMark.png")} />
    );
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
        <AwesomeButton
          // Main button
          paddingHorizontal={5}
          backgroundColor={this.props.colorMap.base01}
          backgroundActive={this.props.colorMap.base02}
          backgroundDarker={this.props.colorMap.base03}
          textColor={this.props.colorMap.base1}
          height={buttonDimension}
          width={buttonDimension}
          onPress={() => this.props.onClick(this.props.id)}>
          {this.props.title}
        </AwesomeButton>
        {!this.props.hideEditButton ? <AwesomeButton
          // Edit button
          onPress={() => this.props.onEditClick(this.props.id)}
          backgroundColor={blue.base01}
          backgroundActive={blue.base02}
          backgroundDarker={blue.base03}
          textColor={blue.base1}
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
        </AwesomeButton> : undefined}
        {!this.props.hideFavoritesButton ? <AwesomeButton
          // Favorite button
          onPress={() => this.props.onFavoriteClick(this.props.id)}
          backgroundColor={this.props.isFavorite ? yellow.base01 : this.props.colorMap.base01}
          backgroundActive={this.props.isFavorite ? yellow.base02 : this.props.colorMap.base02}
          backgroundDarker={this.props.isFavorite ? yellow.base03 : this.props.colorMap.base03}
          textColor={yellow.base1}
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
        </AwesomeButton> : undefined}
        {this.getReachableImage(buttonDimension)}
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
