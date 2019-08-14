import React from "react";
import { Text, TextInput, View } from "react-native";
import { getStyles } from "../common/Style";

export function getTitle(
  itemType: string,
  itemId: string,
  name: string,
  changeFieldCallback?: (text: string, fieldName: string) => void,
) {
  const styles = getStyles();
  return (
    <View style={{
      marginBottom: styles.heightMargin,
      flexDirection: "column",
      justifyContent: "center",
      height: 80,
    }}>
      <Text style={{
        fontWeight: "bold",
        fontSize: 20,
        color: styles.solarized.base0,
        textAlign: "center",
      }}>{`${itemType} ${itemId}`}</Text>
      <TextInput
        style={{
          textAlign: "center",
          color: styles.solarized.base1,
          flex: 1,
          fontSize: 30,
          marginLeft: styles.widthMargin,
          marginRight: styles.widthMargin,
          textAlignVertical: "center",
          borderBottomColor: styles.solarized.base02,
          borderBottomWidth: 2,
          borderBottomLeftRadius: 5,
          borderTopRightRadius: 5,
          backgroundColor: styles.solarized.base00,
        }}
        value={name}
        editable={true}
        onChangeText={(value) => changeFieldCallback(value, "name")}
      />
    </View>);
}