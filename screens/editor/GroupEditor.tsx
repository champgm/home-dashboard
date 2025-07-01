import { useEffect, useState } from "react";
import { ActivityIndicator, Alert as NativeAlert } from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { lights, update } from "../../common/HueState";
import { getStyles } from "../../common/Style";
import { ScrollView, View } from "../../components/Themed";
import { GroupsApi } from "../../hue/GroupsApi";
import { getBlinking, getEmpty, getStatus, Group } from "../../models/Group";
import { Lights } from "../../models/Light";
import { RootStackScreenProps } from "../../types";
import { getBrightnessSlider } from "./components/BrightnessSlider";
import { getLightSelector } from "./components/LightSelector";
import { getTitle } from "./components/Title";
import { rgbStrings as solarized } from "solarizer";
import { getStatusToggleRow } from "./components/StatusToggle";
import { Alert } from "../../models/Alert";

export default function GroupEditor({ route, navigation }: RootStackScreenProps<'GroupEditor'>) {

    let id: string = '-1';
    let name: string = '';
    let brightness: number = 256;
    let alert = Alert.NONE;
    let all_on = false;
    let any_on = false;

    if (route.params != undefined) {
        id = route.params.id;
        name = route.params.name;
        brightness = route.params.brightness;
        alert = route.params.alert;
        all_on = route.params.all_on;
        any_on = route.params.any_on;
    }

    const [group, setGroup] = useState<Group>(Object);

    const [groupName, setGroupName] = useState<string>(name);
    const [lightsObj, setLightsObj] = useState<Lights>({});
    const [newGroup, setNewGroup] = useState<boolean>(false);

    const [groupLights, setGroupLights] = useState<string[]>([])
    const [groupBrightness, setGroupBrightness] = useState<number>(brightness);
    const [groupAlert, setGroupAlert] = useState<Alert>(alert);
    const [groupAllOn, setGroupAllOn] = useState<boolean>(all_on);
    const [groupAnyOn, setGroupAnyOn] = useState<boolean>(any_on);

    const groupsApi = new GroupsApi();
    let debouncingBrightness = false;

    useEffect(() => {
        (async () => {
            if (id !== "-1") {
                const grp = await groupsApi.get(id);
                setGroup(grp)
                setGroupLights(grp.lights)
                setLightsObj(lights)
                setNewGroup(false)
            } else {
                setGroup(getEmpty())
                setGroupLights([])
                setLightsObj(lights)
                setNewGroup(true)
            }
       })()
    }, []);
    
    async function endNameEdit() {
        const grp = {...group, name: groupName}

        if (!newGroup) {
            await groupsApi.put(grp);
            await update();
        }

        setGroup(grp);
    }

    async function updateGroup(grp: Group) {
        if (!newGroup) {
          await groupsApi.put(grp);
          await update()
          setGroup(grp);
        } else {
          setGroup(grp);
        }
    }

    async function toggleLightSelection(lightId: string) {
        const lightsArray = group.lights.includes(lightId)
          ? group.lights.filter((selectedId) => selectedId !== lightId)
          : group.lights.concat(lightId);
          
        const grp = {...group, lights: lightsArray}
        await updateGroup(grp);
        setGroupLights(lightsArray);
    }

    async function createGroup() {
        await groupsApi.create(group);
        await update()
        
        navigation.goBack()
    }

    async function deleteGroup() {
        await groupsApi.delete(group.id);
        await update()
        navigation.goBack()
    }

    const deleteAlert = () => {
      NativeAlert.alert('', 'Delete Group?', [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {text: 'Delete', onPress: () => deleteGroup()},
      ]);
    }

    async function setBrightness(brightness: number, overrideDebounce: boolean) {

        if (!debouncingBrightness || overrideDebounce) {
          debouncingBrightness = true;
          const newAction = {...group.action, bri: brightness}
          const newGrp = {...group, action: newAction}

          if (!newGroup) {
            groupsApi.putAction(id, { bri: brightness });
            update()
          }

          setGroupBrightness(brightness)
          setGroup(newGrp);         
          setTimeout(() => debouncingBrightness = false, 500);
        }
    }

    async function toggleAlert(alert: boolean) {
        let newAlert: Alert;
        if (alert) {
          newAlert = Alert.LSELECT;
        } else {
          newAlert = Alert.NONE;
        }
        const newAction = {...group.action, alert: newAlert }
        const newGrp = {...group, action: newAction}

        if (!newGroup) {
            await groupsApi.putAction(id, {alert: newAlert});
            await update()
        }

        setGroupAlert(newAlert);
        setGroup(newGrp)
    }

    async function toggleOn(on: boolean) {
        const newAction = {...group.action, on: on};
        const newGrp = {...group, action: newAction}

        if (!newGroup) {
            await groupsApi.putAction(id, {on: on});
            await update()
        }

        const grp = await groupsApi.get(id);
        setGroup(grp)
        setGroupAllOn(grp.state.all_on)
        setGroupAnyOn(grp.state.any_on)
    }

    const styles = getStyles();
    const getView = () =>
      id ? 
      <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1 }}>
              <AwesomeButton
                style={{ marginTop: styles.buttonHeight / 2 }}
                key={`Delete Light: ${group.id}`}
                // accessibilityLabel={`Delete Light: ${this.state.group.id}`}
                backgroundColor={styles.red.base01}
                backgroundActive={styles.red.base02}
                backgroundDarker={styles.red.base03}
                textColor={styles.red.base1}
                height={styles.buttonHeight / 2}
                onPress={() => deleteAlert()}
              >{` DELETE `}</AwesomeButton>
              {getTitle(
                "Group",
                id,
                groupName,
                endNameEdit,
                setGroupName)}
              {
                getLightSelector(
                  groupLights,
                  Object.values(lightsObj),
                  toggleLightSelection,
                )
              }
              {getBrightnessSlider(
                groupBrightness,
                setBrightness,
                solarized,
              )}
              {
                getStatusToggleRow(
                  "Group Alert Row",
                  "action.alert",
                  {
                    onText: "Currently: Blinking",
                    offText: "Currently: Not Blinking",
                    onBaseColor: solarized.yellow,
                    offBaseColor: solarized.base01,
                  },
                  {
                    turnOnText: "Start",
                    turnOffText: "Stop",
                    turnOnBaseColor: solarized.yellow,
                    turnOffBaseColor: solarized.red,
                  },
                  () => getBlinking(groupAlert),
                  toggleAlert,
                )
              }
              {
                getStatusToggleRow(
                  "Group Status Row",
                  "action.on",
                  {
                    onText: "Currently: All On",
                    offText: "Currently: All Off",
                    indeterminateText: "Some On",
                    onBaseColor: solarized.yellow,
                    offBaseColor: solarized.base01,
                    indeterminateBaseColor: solarized.orange,
                  },
                  {
                    turnOnText: "Turn On",
                    turnOffText: "Turn Off",
                    turnOnBaseColor: solarized.yellow,
                    turnOffBaseColor: solarized.red,
                  },
                  () => getStatus(groupAllOn, groupAnyOn),
                  toggleOn,
                )
              }
              {
                newGroup ?
                  <AwesomeButton
                    style={{
                      alignSelf: "flex-end",
                    }}
                    key={`Create Group`}
                    // accessibilityLabel={`Create Group`}
                    backgroundColor={styles.green.base01}
                    backgroundActive={styles.green.base02}
                    backgroundDarker={styles.green.base03}
                    textColor={styles.green.base1}
                    height={styles.buttonHeight}
                    onPress={() => createGroup()}
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