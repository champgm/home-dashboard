import _ from "lodash";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import v4 from "uuid/v4";
import { sortBy } from "../common";
import { SensorsApi } from "../hue/SensorsApi";
import { Sensors } from "../models/Sensor";
import { deregister, register } from "./common/Alerter";
import { ItemButton } from "./common/Button";
import { getFavoriteArray, toggleFavorite } from "./common/Favorites";
import { sensors } from "./common/HueState";
import { grey, yellow } from "./common/Style";

interface State {
  sensors?: Sensors;
  favorites: string[];
}

export class SensorsComponent extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  title: any;
  sensorsApi: SensorsApi;

  constructor(props: NavigationContainerProps & NavigationNavigatorProps<any>) {
    super(props);
    this.title = v4();
    this.state = { favorites: [] };
    this.sensorsApi = new SensorsApi();
  }

  componentWillUnmount() { deregister("Sensors"); }
  async componentDidMount() {
    console.log(`Sensors did mount`);
    register("Sensors", this.updateSensors.bind(this));
  }

  async updateSensors() {
    this.setState({
      sensors,
      favorites: await getFavoriteArray("favoriteSensors"),
    });
  }

  async onClick(id: string) {
    await this.sensorsApi.put({id, config: { on: !this.state.sensors[id].config.on } });
    await this.updateSensors();
  }

  onEditClick(id: string) {
    console.log(`Edit clicked`);
    this.props.navigation.navigate("SensorEditor", { id });
  }

  onFavoriteClick(id: string) {
    console.log(`favorite clicked`);
  }

  render() {
    const sensorButtons = this.state.sensors
      ? sortBy(Object.values(this.state.sensors), "name")
        .map((sensor) => {
          return (
            <ItemButton
              isFavorite={this.state.favorites.includes(sensor.id)}
              id={sensor.id}
              key={`sensor-${sensor.id}`}
              colorMap={sensor.config.on ? yellow : grey}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={(id: string) => toggleFavorite("favoriteSensors", id)}
              title={sensor.name}
              reachable={sensor.config.reachable}
            />
          );
        }).concat(
          <ItemButton
            colorMap={grey}
            key={`sensor-SCAN`}
            onClick={this.sensorsApi.searchForNew}
            title={"Scan for new sensors"}
            reachable={true}
            hideEditButton={true}
            hideFavoritesButton={true}
          />,
        )
      : <ActivityIndicator size="large" color="#0000ff" />;
    return (
      <View style={[styles.scene]} >
        {sensorButtons}
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
