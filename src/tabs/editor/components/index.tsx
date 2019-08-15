// // Why is this Necessary...
// import React from "react";
// import { Switch, Text, TextInput,  View } from "react-native";
// import AwesomeButton from "react-native-really-awesome-button";
// import { createBasesFromColor, rgb, rgbStrings as solarized } from "solarizer";
// import { getStyles } from "../../common/Style";

// export function getLabelOnlyRow(label: string) {
//   const styles = getStyles();
//   return (
//     <View style={[styles.fieldRow]}>
//       <Text style={[styles.label]}>{label}:</Text>
//     </View>);
// }

// export function getStringInputRow(
//   label: string,
//   fieldName: string,
//   initialValue: string,
//   editable: boolean,
//   changeFieldCallback?: (text: string, fieldName: string) => void,
// ): JSX.Element {
//   const styles = getStyles();
//   return (
//     <View style={[styles.fieldRow]}>
//       <Text style={[styles.label]}>{label}:</Text>
//       <TextInput
//         value={initialValue}
//         editable={editable}
//         style={editable ? styles.input : styles.lockedInput}
//         onChangeText={(value) => changeFieldCallback(value, fieldName)}
//       />
//     </View>);
// }

// export function getToggleRow(
//   label: string,
//   fieldName: string,
//   initialValue: boolean,
//   editable: boolean,
//   changeFieldCallback?: (newValue: boolean, fieldName: string) => void,
// ): JSX.Element {
//   const styles = getStyles();
//   return (
//     <View style={[styles.fieldRow]}>
//       <Text style={[styles.label]}>{label}:</Text>
//       <Switch
//         value={initialValue}
//         disabled={!editable}
//         style={[editable ? styles.toggle : styles.lockedToggle]}
//         onValueChange={(value) => changeFieldCallback(value, fieldName)}
//       />
//     </View>);
// }

// export function getMultiSelectRow(
//   openMultiText: string,
//   closeMultiText: string,
//   fieldName: string,
//   initiallySelectedItems: string[],
//   allItems: Array<{ id: string, name: string }>,
//   currentlyOpen: boolean,
//   changeFieldCallback: (selectedItemId: string) => void,
//   toggleCallback: () => void,
// ) {
//   const styles = getStyles();
//   const lightSelectButtons = allItems.map((lightMeta) => {
//     return (<AwesomeButton
//       style={{ marginBottom: 5 }}
//       key={lightMeta.id}
//       onPress={() => changeFieldCallback(lightMeta.id)}
//       accessibilityLabel={lightMeta.name}
//       backgroundColor={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base01 : styles.solarized.base01}
//       backgroundActive={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base02 : styles.solarized.base02}
//       backgroundDarker={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base03 : styles.solarized.base03}
//       textColor={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base1 : styles.solarized.base1}
//       height={70}
//       width={70}
//       textSize={12}
//       textLineHeight={15}
//     >
//       {`${lightMeta.name}`}
//     </AwesomeButton>);
//   });
//   const multiSelect = (
//     <View style={styles.multiSelect}>
//       {lightSelectButtons}
//     </View>);

//   if (currentlyOpen) {
//     return (
//       <View style={[styles.multiSelectRow]}>
//         {multiSelect}
//         <AwesomeButton
//           key={`${openMultiText} toggle`}
//           accessibilityLabel={openMultiText}
//           backgroundColor={currentlyOpen ? styles.solarized.base01 : styles.green.base01}
//           backgroundActive={currentlyOpen ? styles.solarized.base02 : styles.green.base02}
//           backgroundDarker={currentlyOpen ? styles.solarized.base03 : styles.green.base03}
//           textColor={currentlyOpen ? styles.solarized.base1 : styles.green.base1}
//           height={50}
//           onPress={() => toggleCallback()}
//           // textSize={12}
//           disabled={false}
//         >{` ${closeMultiText} `}</AwesomeButton>
//       </View>
//     );
//   } else {
//     return (
//       <View style={[styles.multiSelectRow]}>
//         <AwesomeButton
//           key={`${openMultiText} toggle`}
//           accessibilityLabel={openMultiText}
//           backgroundColor={currentlyOpen ? styles.solarized.base01 : styles.green.base01}
//           backgroundActive={currentlyOpen ? styles.solarized.base02 : styles.green.base02}
//           backgroundDarker={currentlyOpen ? styles.solarized.base03 : styles.green.base03}
//           textColor={currentlyOpen ? styles.solarized.base1 : styles.green.base1}
//           height={50}
//           onPress={() => toggleCallback()}
//           // textSize={12}
//           disabled={false}
//         >{` ${openMultiText} `}</AwesomeButton>
//       </View>
//     );
//   }
// }
