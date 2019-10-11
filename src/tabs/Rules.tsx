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
import { RulesApi } from "../hue/RulesApi";
import { Rules } from "../models/Rule";
import { deregister, register } from "./common/Alerter";
import { ItemButton } from "./common/Button";
import { getFavoriteArray, toggleFavorite } from "./common/Favorites";
import { rules } from "./common/HueState";
import { grey, yellow } from "./common/Style";

interface State {
  rules?: Rules;
  favorites: string[];
}

export class RulesComponent extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  title: any;
  rulesApi: RulesApi;

  constructor(props: NavigationContainerProps & NavigationNavigatorProps<any>) {
    super(props);
    this.title = v4();
    this.state = { favorites: [] };
    this.rulesApi = new RulesApi();
  }

  componentWillUnmount() { deregister("Rules"); }
  async componentDidMount() {
    console.log(`Rules did mount`);
    register("Rules", this.updateRules.bind(this));
  }

  async updateRules() {
    this.setState({
      rules,
      favorites: await getFavoriteArray("favoriteRules"),
    });
  }

  async onClick(id: string) {
    // await this.rulesApi.put({id, config: { on: !this.state.rules[id].config.on } });
    await this.updateRules();
  }

  onEditClick(id: string) {
    console.log(`Edit clicked`);
    this.props.navigation.navigate("RuleEditor", { id });
  }

  onFavoriteClick(id: string) {
    console.log(`favorite clicked`);
  }

  render() {
    const ruleButtons = this.state.rules
      ? sortBy(Object.values(this.state.rules), "name")
        .map((rule) => {
          return (
            <ItemButton
              isFavorite={this.state.favorites.includes(rule.id)}
              id={rule.id}
              key={`rule-${rule.id}`}
              colorMap={rule.status==="enabled" ? yellow : grey}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={(id: string) => toggleFavorite("favoriteRules", id)}
              title={rule.name}
              reachable={true}
            />
          );
        })
        // .concat(
        //   <ItemButton
        //     colorMap={grey}
        //     key={`rule-SCAN`}
        //     onClick={this.rulesApi.searchForNew}
        //     title={"Scan for new rules"}
        //     reachable={true}
        //     hideEditButton={true}
        //     hideFavoritesButton={true}
        //   />,
        // )
      : <ActivityIndicator size="large" color="#0000ff" />;
    return (
      <View style={[styles.scene]} >
        {ruleButtons}
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
