import _ from "lodash";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import { LightsApi } from "../../hue/LightsApi";
import { SensorsApi } from "../../hue/SensorsApi";
import { Lights } from "../../models/Light";
import { getEmpty, Sensor } from "../../models/Sensor";
import { deregister } from "../common/Alerter";
import { lights } from "../common/HueState";
import { getStyles } from "../common/Style";
import { getTitle } from "./components/Title";

interface State {
  sensor?: Sensor;
  lights?: Lights;
  hsb?: any;
  newSensor?: boolean;
}

export class SensorEditor extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  sensorsApi: SensorsApi;
  lightsApi: LightsApi;

  constructor(props) {
    super(props);
    this.state = {};
    this.sensorsApi = new SensorsApi();
    this.lightsApi = new LightsApi();
  }

  async componentDidMount() {
    const id = this.props.navigation.getParam("id", "-1");
    if (id !== "-1") {
      const sensorPromise = this.sensorsApi.get(id);
      const sensor = await sensorPromise;
      this.setState({ lights, sensor, newSensor: false });
    } else {
      const sensor = getEmpty();
      this.setState({ lights, sensor, newSensor: true });
    }
  }

  componentWillUnmount() {
    deregister("SensorEditor");
  }

  setName(name: string) {
    this.state.sensor.name = name;
    this.setState({ sensor: this.state.sensor });
  }

  async updateSensor() {
    if (!this.state.newSensor) {
      await this.sensorsApi.put(this.state.sensor);
      this.setState({ sensor: await this.sensorsApi.get(this.state.sensor.id) });
    } else {
      this.setState({ sensor: this.state.sensor });
    }
  }

  async toggleOn(on: boolean) {
    this.state.sensor.config.on = on;
    await this.updateSensor();
  }

  async createSensor() {
    await this.sensorsApi.create(this.state.sensor);
    this.props.navigation.navigate("Sensors");
  }

  async deleteSensor() {
    await this.sensorsApi.delete(this.state.sensor.id);
    this.props.navigation.navigate("Sensors");

  }

  render() {
    const styles = getStyles();
    const getView = () =>
      this.state.sensor
        ? <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              <AwesomeButton
                style={{ marginTop: styles.buttonHeight / 2 }}
                key={`Delete Light: ${this.state.sensor.id}`}
                accessibilityLabel={`Delete Light: ${this.state.sensor.id}`}
                backgroundColor={styles.red.base01}
                backgroundActive={styles.red.base02}
                backgroundDarker={styles.red.base03}
                textColor={styles.red.base1}
                height={styles.buttonHeight / 2}
                onPress={() => this.deleteSensor()}
              >{` DELETE `}</AwesomeButton>
              {getTitle(
                "Sensor",
                this.state.sensor.id,
                this.state.sensor.name,
                this.updateSensor.bind(this),
                this.setName.bind(this))}
              {
                this.state.newSensor ?
                  <AwesomeButton
                    style={{
                      alignSelf: "flex-end",
                    }}
                    key={`Create Sensor`}
                    accessibilityLabel={`Create Sensor`}
                    backgroundColor={styles.green.base01}
                    backgroundActive={styles.green.base02}
                    backgroundDarker={styles.green.base03}
                    textColor={styles.green.base1}
                    height={styles.buttonHeight}
                    onPress={() => this.createSensor()}
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
