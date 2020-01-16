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
import { Plugs } from "../models/Plug";
import { PlugsApi } from "../tplink/PlugsApi";
import { deregister, register } from "./common/Alerter";
import { ItemButton } from "./common/Button";
import { getFavoriteArray, toggleFavorite } from "./common/Favorites";
import { plugs } from "./common/HueState";
import { grey, yellow } from "./common/Style";

interface State {
  plugs?: Plugs;
  favorites: string[];
}

export class PlugsComponent extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  title: any;
  plugsApi: PlugsApi;

  constructor(props: NavigationContainerProps & NavigationNavigatorProps<any>) {
    super(props);
    this.title = v4();
    this.state = { favorites: [] };
    this.plugsApi = new PlugsApi();
  }

  componentWillUnmount() { deregister("Plugs"); }
  async componentDidMount() {
    console.log(`Plugs did mount`);
    register("Plugs", this.updatePlugs.bind(this));
  }

  async updatePlugs() {
    this.setState({
      plugs,
      favorites: await getFavoriteArray("favoritePlugs"),
    });
  }

  async onClick(id: string) {
    await this.plugsApi.setState(id, !this.state.plugs[id].on);
    await this.updatePlugs();
  }

  onEditClick(id: string) {
    console.log(`Edit clicked`);
    this.props.navigation.navigate("PlugEditor", { id });
  }

  onFavoriteClick(id: string) {
    console.log(`favorite clicked`);
  }

  render() {
    const plugButtons = this.state.plugs
      ? sortBy(Object.values(this.state.plugs), "name")
        .map((plug) => {
          return (
            <ItemButton
              isFavorite={this.state.favorites.includes(plug.id)}
              id={plug.id}
              key={`plug-${plug.id}`}
              colorMap={plug.on ? yellow : grey}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={(id: string) => toggleFavorite("favoritePlugs", id)}
              title={plug.name}
              reachable={true}
            />
          );
        }).concat(
          <ItemButton
            colorMap={grey}
            key={`plug-SCAN`}
            onClick={this.plugsApi.searchForNew}
            title={"Scan for new plugs"}
            reachable={true}
            hideEditButton={true}
            hideFavoritesButton={true}
          />,
        )
      : <ActivityIndicator size="large" color="#0000ff" />;
    return (
      <View style={[styles.scene]} >
        {plugButtons}
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
