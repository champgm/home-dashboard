import Constants from "expo-constants";
import _ from "lodash";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import { Route, SceneMap, TabView } from "react-native-tab-view";
import v4 from "uuid/v4";
import { sortBy } from "../common";
import { Light, Lights } from "../models/Light";
import { ItemButton } from "./common/Button";
import { LightModal } from "./LightModal";

export interface Props {
  lights: Promise<Lights>;
}

interface State {
  lights?: Lights;
  modalVisible: boolean;
  lightBeingEdited: string;
}

export const key = "lights";
export const title = "Lights";
export class LightsComponent extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      modalVisible: false,
      lightBeingEdited: "-1",
    };
  }

  componentDidMount() {
    this.props.lights.then((lights) => {
      this.setState({ lights });
    });
  }

  onClick(id: string) {

  }

  onEditClick(id: string) {
    // console.log(`Calling edit`);
    this.setState({
      modalVisible: true,
      lightBeingEdited: id,
    });
  }

  onFavoriteClick(id: string) {

  }

  onEditCancel() {
    this.setState({
      modalVisible: false,
      lightBeingEdited: "0",
    });
  }

  async onEditSubmit(id: string) {
    // Do something here first
    this.setState({
      modalVisible: false,
      lightBeingEdited: "0",
    });
  }

  render() {

    const lightButtons = this.state.lights
      ? sortBy(Object.values(this.state.lights), "name")
        .map((light) => {
          return (
            <ItemButton
              id={light.id}
              key={v4()}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={this.onFavoriteClick.bind(this)}
              title={light.name}
            />
          );
        })
      : <ActivityIndicator size="large" color="#0000ff" />;

    return (
      <View style={[styles.scene]} >
        {lightButtons}
        <LightModal
          id={this.state.lightBeingEdited}
          visible={this.state.modalVisible}
          key={this.state.lightBeingEdited}
          onEditCancel={this.onEditCancel.bind(this)}
          onEditSubmit={this.onEditSubmit.bind(this)}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  scene: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#002b36",
    flex: 1,
  },
});
