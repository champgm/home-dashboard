import { Text, TextInput, View } from "react-native";
import { getStyles } from "../common/Style";

export function getStringInputRow() {
  const {
    fieldRowContainerStyle,
    fieldRowStyle,
    inputStyle,
    labelStyle,
    lockedInputStyle,
  } = getStyles();
  const getNameRow = () => (
    <View style={[styles.fieldRow]}>
      <Text style={[styles.label, labelStyle]}>Name:</Text>
      <TextInput
        value={this.state.group.name}
        style={[styles.input, inputStyle]}
        onChangeText={(text) => this.changeField(text, "name")}
      />
    </View>);
}
