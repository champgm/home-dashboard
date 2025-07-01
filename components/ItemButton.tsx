import _ from "lodash";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { RgbBaseMap, RgbBaseStringMap } from "solarizer/tsc-out/RgbMaps";
import { blue, yellow, grey } from "../common/Style";

export interface Props {
  colorMap: RgbBaseStringMap;
  id?: string;
  isFavorite?: boolean;
  on?: boolean;
  reachable?: boolean;
  title: string;
  onFavoriteClick?: (id: string) => void;
  onEditClick?: (id: string) => void;
  onClick: (id?: string) => void;
  hideEditButton?: boolean;
  hideFavoritesButton?: boolean;
}

interface State {
  on: boolean | undefined;
  reachable: boolean | undefined;
}

export default function ItemButton(props: Props) {

    // const initialState: State = {on: props.on, reachable: props.reachable}
    // const [lightState, setLightState] = useState<State>(initialState);

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
            backgroundColor={props.colorMap.base01}
            backgroundActive={props.colorMap.base02}
            backgroundDarker={props.colorMap.base03}
            textColor={props.colorMap.base1}
            height={buttonDimension}
            width={buttonDimension}
            onPress={() => props.onClick(props.id)}>
            {props.title}
          </AwesomeButton>
          {!props.hideEditButton ? <AwesomeButton
            // Edit button
            onPress={() => props.onEditClick?.(props.id!)}
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
              source={require("../assets/edit.png")} />
          </AwesomeButton> : undefined}
          {!props.hideFavoritesButton ? <AwesomeButton
            // Favorite button
            onPress={() => props.onFavoriteClick?.(props.id!)}
            backgroundColor={props.isFavorite ? yellow.base01 : grey.base01}
            backgroundActive={props.isFavorite ? yellow.base02 : grey.base02}
            backgroundDarker={props.isFavorite ? yellow.base03 : grey.base03}
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
              source={require("../assets/favorite.png")} />
          </AwesomeButton> : undefined}
          { getReachableImage(props.reachable, buttonDimension) }
        </View>
      );

}

function getReachableImage(reachable: boolean | undefined, buttonDimension: number) {
    if (reachable) {
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
        source={require("../assets/questionMark.png")} />
    );
  }

const styles = StyleSheet.create({
  buttonContainer: {},
  favoriteButton: {
    bottom: 70,
  },
});