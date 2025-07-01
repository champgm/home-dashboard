import React, { useEffect, useState, useReducer } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { RgbBaseStringMap } from 'solarizer/tsc-out/RgbMaps';
import { sortBy } from '../common';
import { grey, orange, yellow } from '../common/Style';
import { getStatus, Groups } from "../models/Group";
import { groups, update } from "../common/HueState";
import { GroupsApi } from '../hue/GroupsApi';

import ItemButton from '../components/ItemButton';
import { Text, View } from '../components/Themed';
import { useIsFocused } from '@react-navigation/native';
import { getFavoriteArray, toggleFavorite } from '../common/Favorites';
import { RootTabScreenProps } from '../types';
import { Alert } from '../models/Alert';


export default function TabGroupsScreen({ route, navigation }: RootTabScreenProps<'Groups'>) {

  const [groupsObj, setGroupsObj] = useState<Groups>({});
  const [favorites, setFavorites] = useState<string[]>([]);

  const groupsApi = new GroupsApi();
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      await update();
      // this is needed to trigger rendering when tab changes
      if (isFocused) {
        setGroupsObj(groups);

        const fvGroups = await getFavoriteArray("favoriteGroups");
        setFavorites(fvGroups);
      }
    })()
  }, [isFocused]);

  async function updateGroups(id: string) {

    switch (getStatus(groupsObj[id].state.all_on, groupsObj[id].state.any_on)) {
      case Status.ON: {
                        await groupsApi.putAction(id, { on: false }); 
                        await update()

                        setGroupsObj(groups);
                        break;
                      }
      case Status.OFF: {
                        await groupsApi.putAction(id, { on: true });
                        await update()

                        setGroupsObj(groups);
                        break;
                      }
      case Status.INDETERMINATE: {
                        await groupsApi.putAction(id, { on: true }); 
                        await update()

                        setGroupsObj(groups);                        
                        break;
                      }
      default: {
          console.log(`Invalid group state: ${JSON.stringify(groupsObj[id], null, 2)}`); 
          break;
        }
    }
  }

  function onCreateNewClick() {
    console.log(`NEW clicked`);
    navigation.navigate("GroupEditor");
  }

  function onEditClick(id: string, name: string, brightness: number, alert: Alert, all_on: boolean, any_on: boolean) {
    console.log(`Edit group ${name} clicked`);
    navigation.navigate("GroupEditor", { id, name, brightness, alert, all_on, any_on });
  }

  async function onFavoriteClick(id: string) {
    await toggleFavorite("favoriteGroups", id);

    const fvGroups = await getFavoriteArray("favoriteGroups");
    setFavorites(fvGroups);
  }

  const groupButtons = groupsObj
  ? sortBy(Object.values(groupsObj), "name")
    .map((group) => {
      let colorMap: RgbBaseStringMap;
      switch (getStatus(group.state.all_on, group.state.any_on)) {
        case Status.ON: colorMap = yellow; break;
        case Status.OFF: colorMap = grey; break;
        case Status.INDETERMINATE: colorMap = orange; break;
        default:
          colorMap = grey;
          break;
      }
      return (
        <ItemButton
          isFavorite={favorites.includes(group.id)}
          id={group.id}
          colorMap={colorMap}
          key={`group-${group.id}`}
          onClick={ () => updateGroups(group.id)}
          onEditClick= { () => onEditClick(group.id, group.name, group.action.bri, 
            group.action.alert, group.state.all_on, group.state.any_on) }
          onFavoriteClick={() => onFavoriteClick(group.id)}
          title={group.name}
          reachable={true}
        />
      );
    })
    .concat(
      <ItemButton
        colorMap={grey}
        key={`group-NEW`}
        onClick={ onCreateNewClick }
        title={"NEW"}
        reachable={true}
        hideEditButton={true}
        hideFavoritesButton={true}
      />,
    )
  : <ActivityIndicator size="large" color="#0000ff" />;

  return (
    <View style={styles.container}>
      { groupButtons }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-around",
    // backgroundColor: "#002b36",
    flex: 1,
  },
});

enum Status { ON, OFF, INDETERMINATE }
