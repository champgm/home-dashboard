import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Image, View } from "react-native";
import AwesomeButton from "@rcaferati/react-native-awesome-button";

describe("AwesomeButton compatibility spike", () => {
  test("renders fixed geometry, custom image content, and an independent callback", async () => {
    const onPress = jest.fn();
    const view = render(
      <AwesomeButton
        backgroundActive="#073642"
        backgroundColor="#b58900"
        backgroundDarker="#002b36"
        height={120}
        onPress={onPress}
        paddingHorizontal={5}
        raiseLevel={6}
        springRelease
        textColor="#fdf6e3"
        width={120}
        dangerouslySetPressableProps={{ accessibilityLabel: "AwesomeButton compatibility spike" }}
      >
        <View>
          <Image source={require("../../assets/lightBulb.png")} testID="spike-image" />
        </View>
      </AwesomeButton>,
    );

    expect(view.getByLabelText("AwesomeButton compatibility spike")).toBeTruthy();
    expect(view.getByTestId("spike-image").props.source).toBeDefined();
    expect(view.getByTestId("aws-btn-bottom").props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ backgroundColor: "#002b36", height: 114, width: 120 }),
    ]));

    fireEvent.press(view.getByLabelText("AwesomeButton compatibility spike"));
    await waitFor(() => expect(onPress).toHaveBeenCalledTimes(1));
  });
});
