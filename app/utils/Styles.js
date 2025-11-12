import React from "react";
import {
    Dimensions,
    I18nManager,
    Platform,
    StyleSheet,
    View,
} from "react-native";

// import { Actions } from 'react-native-router-flux';
import { Ionicons } from "@expo/vector-icons";
import Color from "react-native-material-color";
import * as Constants from "./Constants";

export const width = Dimensions.get("window").width;
export const height = Dimensions.get("window").height;
export const isLtr = () => !I18nManager.isRTL;

export const leftNavView = {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
};

export const leftNavBtn = {
    marginHorizontal: 12,
    color: Constants.appColor,
};

export const btnsView = {
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
};

export const btn = {
    backgroundColor: Constants.appColor,
    width: width / 2 - 28,
    justifyContent: "center",
};

export const hypeLink = {
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
    textDecorationColor: "#000",
    color: "blue",
};

export const fab = (size) => ({
    overflow: "hidden",
    backgroundColor: Constants.appColor,
    borderColor: Constants.appColor,
    borderWidth: 1,
    height: size,
    width: size,
    borderRadius: size / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.8,
    shadowRadius: 2,
    shadowOffset: {
        height: 2,
        width: 0,
    },
    elevation: 6,
});

export const shadow = {
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: {
        height: 2,
        width: 0,
    },
};

export const badge = (size) => [
    fab(size),
    {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: Color.RED[500],
        borderColor: "transparent",
    },
];

export const badgeText = {
    fontSize: 14,
    color: "white",
    overflow: "hidden",
    backgroundColor: "transparent",
};

export const btnText = {
    fontSize: 18,
    color: "white",
    padding: 12,
    overflow: "hidden",
    backgroundColor: "transparent",
};

export const modal = {
    height: -1,
    width: width - 48,
    backgroundColor: Color.GREY[100],
    padding: 12,
    marginBottom: 24,
    borderRadius: 6,
    marginTop: 24,
    alignItems: "center",
    marginLeft: isLtr() ? 0 : 48,
    alignSelf: isLtr() ? null : "center",
};

export const modalView = {
    width: modal.width - 24,
    alignItems: "flex-start",
    justifyContent: "center",
};

export const border = {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Color.GREY[500],
    borderRadius: 4,
};

export const modalInput = {
    width: modal.width - 24,
    textAlign: isLtr() ? "left" : "right",
    padding: 6,
    fontSize: 16,
    color: "black",
    ...border,
    borderWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
};

export const modalBoxInput = {
    ...modalInput,
    borderWidth: StyleSheet.hairlineWidth,
};

export const boxInput = {
    ...modalBoxInput,
    width: modal.width,
    borderColor: Color.GREY[600],
};

export const lightInput = {
    textAlign: isLtr() ? "left" : "right",
    padding: 12,
    fontSize: 17,
    color: "black",
    backgroundColor: Color.GREY[100],
    borderRadius: 4,
};

export const modalInputTitle = {
    fontSize: 18,
    color: Color.GREY[900],
    textAlign: "left",
    alignSelf: "flex-start",
    marginBottom: 12,
    marginLeft: 2,
};

export const input = {
    ...boxInput,
    textAlign: "center",
    backgroundColor: Color.White,
};

export const modalBtnsView = {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    alignSelf: "flex-end",
    padding: Platform.select({ android: 8 }),
};

export const closeModalIcon = {
    position: "absolute",
    right: 0,
    marginTop: -12,
    padding: 12,
    overflow: "hidden",
    backgroundColor: "transparent",
};

export const closeSmallModalIcon = {
    position: "absolute",
    right: 0,
    padding: 8,
};

export const logo = {
    alignSelf: "center",
    resizeMode: Platform.OS === "android" ? "contain" : "cover",
    height: Platform.OS === "android" ? 150 : 100,
    width: width * 0.7,
    position: "relative",
    borderRadius: Platform.OS === "android" ? 32 : 16,
    marginTop: Platform.OS === "android" ? 0 : 42,
    marginBottom: Platform.OS === "android" ? 0 : 24,
};

export const splashLogo = {
    alignSelf: "center",
    resizeMode: Platform.OS === "android" ? "contain" : "cover",
    height: Platform.OS === "android" ? width * 0.7 * 0.78 : width * 0.55 * 0.78,
    width: Platform.OS === "android" ? width * 0.7 : width * 0.55,
    position: "relative",
    marginTop: Platform.OS === "android" ? -32 : 0,
    borderRadius: Platform.OS === "android" ? 32 : 16,
    marginBottom: 24,
};

export const splashTitle = {
    alignSelf: "center",
    resizeMode: Platform.OS === "android" ? "contain" : "cover",
    height: 300 / 7,
    width: 300,
    position: "relative",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Color.GREY[900],
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 24,
    marginTop: Platform.OS === "android" ? -18 : 6,
};

export const rightNavView = {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
};

export const rightNavBtn = {
    marginHorizontal: 12,
};

export const drawerIcon = {
    marginLeft: Platform.OS === "ios" ? 12 : 18,
    marginRight: 12,
    paddingHorizontal: Platform.OS === "android" ? 8 : 8,
    paddingVertical: Platform.OS === "android" ? 4 : 2,
    paddingTop: Platform.OS === "android" ? 4 : 4,
    borderRadius: Platform.OS === "android" ? 24 : 18,
    color: "white",
    overflow: "hidden",
    backgroundColor: Constants.appColor,
};

export const drawerButton = (
    <Ionicons
        style={drawerIcon}
        name="md-menu"
        color={Constants.appColor}
        size={28}
        onPress={() => Actions.drawerOpen()}
    />
);

export const searchBarView = {
    padding: 8,
    marginHorizontal: 12,
    marginTop: 12,
    elevation: 2,
    marginBottom: 2,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
};

export const searchTI = {
    textAlign: "left",
    flex: 0.9,
    marginHorizontal: 8,
    fontSize: 16,
};

export const searchIcon = {
    flex: 0.05,
    marginHorizontal: 8,
    color: Color.GREY[700],
};

export const clearIcon = {
    flex: 0.05,
    position: "absolute",
    right: 16,
    color: Color.GREY[600],
};

export const modalTitle = {
    fontSize: 18,
    paddingLeft: 2,
    paddingBottom: 12,
};

export const orderItemsList = {
    maxHeight: height / 3,
};

export const itemRowView = {
    padding: 4,
    width: modal.width - 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Color.GREY[500],
    flexDirection: "row",
    justifyContent: "space-between",
};

export const subItemRowView = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
};

export const bottomView = {
    flexDirection: "row",
    padding: 16,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
};

export const bottomBtn = {
    width: width / 2.75,
    backgroundColor: Constants.appColor,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
};

export const bottomBtnText = {
    color: "white",
    fontSize: 16,
    paddingBottom: 2,
};

export const flatlist = {
    padding: 12,
};
export const card = {
    padding: 8,
    alignItems: "flex-start",
    // elevation: 4,
    backgroundColor: Color.GREY[50],
    marginBottom: 12,
    ...border,
};

export const renderSeparator = (w) => (
    <View key={`${Math.random()}`} style={{ width: w }} />
);
export const renderVSeparator = (h) => (
    <View key={`${Math.random()}`} style={{ height: h }} />
);

export const circle = (diameter, paddingTop) => ({
    borderWidth: 1,
    borderColor: Color.Grey,
    borderRadius: diameter / 2,
    width: diameter,
    height: diameter,
    paddingTop: paddingTop,
    textAlign: "center",
    backgroundColor: Color.YELLOW[200],
    overflow: "hidden",
    fontWeight: "bold",
});
