import React, { useState, useEffect, useReducer } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';

import ItemButton from '../components/ItemButton';
import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';
import { sortBy } from "../common";
import { LightsApi } from "../hue/LightsApi";
import { Lights } from "../models/Light";
import { lights, update } from "../common/HueState";
import { grey, yellow } from "../common/Style";
import { getFavoriteArray, toggleFavorite } from "../common/Favorites";
import { useIsFocused } from '@react-navigation/native';


export default function TabLightsScreen({ route, navigation }: RootTabScreenProps<'Lights'>) {

  const [lightsObj, setLightsObj] = useState<Lights>({});
  const [favorites, setFavorites] = useState<string[]>([]);

  const lightsApi = new LightsApi();
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      await update()
      // trigger rendering when tab changes
      if (isFocused) {
        setLightsObj(lights);

        const fvLights = await getFavoriteArray("favoriteLights");
        setFavorites(fvLights);
      }
    })()
    
  }, [isFocused]);

  async function updateLights(id: string) {
    
    await lightsApi.putState(id, { on: !lightsObj[id].state.on });
    await update()

    setLightsObj( lights );
  }

  function onEditClick(id: string, name: string, brightness: number, alert: string, on: boolean) {
    console.log(`Edit light ${name} clicked`);
    navigation.navigate("LightEditor", { id, name, brightness, alert, on });
  }

  async function onFavoriteClick(id: string) {
    await toggleFavorite("favoriteLights", id);

    const fvLights = await getFavoriteArray("favoriteLights");
    setFavorites(fvLights);
  }

  const lightButtons = lightsObj
      ? sortBy(Object.values(lightsObj), "name")
        .map((light) => {
          return (
            <ItemButton
              isFavorite={favorites.includes(light.id)}
              id={light.id}
              key={`light-${light.id}`}
              colorMap={light.state.on ? yellow : grey}
              onClick = { () => updateLights(light.id) }
              onEditClick = { () => onEditClick(light.id, light.name, light.state.bri, light.state.alert, light.state.on) }
              onFavoriteClick={() => onFavoriteClick(light.id)}
              title={light.name}
              reachable={light.state.reachable}
            />
          );
        }).concat(
          <ItemButton
            colorMap={grey}
            key={`light-SCAN`}
            onClick={lightsApi.searchForNew}
            title={"Scan for new lights"}
            reachable={true}
            hideEditButton={true}
            hideFavoritesButton={true}
          />,
        )
      : <ActivityIndicator size="large" color="#0000ff" />;

  return (
    <View style={styles.container}>
      { lightButtons }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-around",
    // backgroundColor: "#002b36",
  },
});
