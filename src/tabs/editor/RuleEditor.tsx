import _ from "lodash";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import { LightsApi } from "../../hue/LightsApi";
import { RulesApi } from "../../hue/RulesApi";
import { Lights } from "../../models/Light";
import { getEmpty, Rule } from "../../models/Rule";
import { deregister } from "../common/Alerter";
import { lights } from "../common/HueState";
import { getStyles } from "../common/Style";
import { getTitle } from "./components/Title";

interface State {
  rule?: Rule;
  lights?: Lights;
  hsb?: any;
  newRule?: boolean;
}

export class RuleEditor extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  rulesApi: RulesApi;
  lightsApi: LightsApi;

  constructor(props) {
    super(props);
    this.state = {};
    this.rulesApi = new RulesApi();
    this.lightsApi = new LightsApi();
  }

  async componentDidMount() {
    const id = this.props.navigation.getParam("id", "-1");
    if (id !== "-1") {
      const rulePromise = this.rulesApi.get(id);
      const rule = await rulePromise;
      this.setState({ lights, rule, newRule: false });
    } else {
      const rule = getEmpty();
      this.setState({ lights, rule, newRule: true });
    }
  }

  componentWillUnmount() {
    deregister("RuleEditor");
  }

  setName(name: string) {
    this.state.rule.name = name;
    this.setState({ rule: this.state.rule });
  }

  async updateRule() {
    if (!this.state.newRule) {
      await this.rulesApi.put(this.state.rule);
      this.setState({ rule: await this.rulesApi.get(this.state.rule.id) });
    } else {
      this.setState({ rule: this.state.rule });
    }
  }

  async createRule() {
    await this.rulesApi.create(this.state.rule);
    this.props.navigation.navigate("Rules");
  }

  async deleteRule() {
    await this.rulesApi.delete(this.state.rule.id);
    this.props.navigation.navigate("Rules");
  }

  render() {
    const styles = getStyles();
    const getView = () =>
      this.state.rule
        ? <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              <AwesomeButton
                style={{ marginTop: styles.buttonHeight / 2 }}
                key={`Delete Light: ${this.state.rule.id}`}
                accessibilityLabel={`Delete Light: ${this.state.rule.id}`}
                backgroundColor={styles.red.base01}
                backgroundActive={styles.red.base02}
                backgroundDarker={styles.red.base03}
                textColor={styles.red.base1}
                height={styles.buttonHeight / 2}
                onPress={() => this.deleteRule()}
              >{` DELETE `}</AwesomeButton>
              {getTitle(
                "Rule",
                this.state.rule.id,
                this.state.rule.name,
                this.updateRule.bind(this),
                this.setName.bind(this))}
              {
                this.state.newRule ?
                  <AwesomeButton
                    style={{
                      alignSelf: "flex-end",
                    }}
                    key={`Create Rule`}
                    accessibilityLabel={`Create Rule`}
                    backgroundColor={styles.green.base01}
                    backgroundActive={styles.green.base02}
                    backgroundDarker={styles.green.base03}
                    textColor={styles.green.base1}
                    height={styles.buttonHeight}
                    onPress={() => this.createRule()}
                  >
                    {` Create `}
                  </AwesomeButton> : undefined
              }
            </View>
          </ScrollView>
        </View >
        : <ActivityIndicator size="large" color="#0000ff" />;
    return (
      <View style={[{ flex: 1 }, styles.background]}>
        {getView()}
      </View>
    );
  }
}
