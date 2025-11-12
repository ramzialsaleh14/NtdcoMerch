import * as Constants2 from "../utils/Constants";
import Constants from "expo-constants"
import * as Commons from "../utils/Commons";
import * as ServerOperations from "../utils/ServerOperations";
import uuid from "react-native-uuid";
import React, { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import i18n from "../languages/langStrings";
import {
    Platform,
    I18nManager
} from "react-native";



export const registerUserToken = async (navigation) => {
    const devId = uuid.v4();
    const userID = await Commons.getFromAS("userID");
    const curDevId = await Commons.getFromAS("devId");
    if (curDevId == null) {
        registerForPushNotificationsAsync().then((token) => {
            console.log(token);
            callSendUserToken(userID, token, devId);
        });
    } else {
        const serverToken = await ServerOperations.getServerToken(userID);
        if (serverToken.res != curDevId) {
            if (serverToken.res == "") {
                await Commons.removeFromAS("devId");
                registerUserToken();
            } else {
                await Commons.removeFromAS("userID");
                await Commons.removeFromAS("password");
                await navigation.navigate("Login");
                Commons.okMsgAlert(i18n.t("tokenNotRegistered"));
            }
        } else {
            const userToken = await Commons.getFromAS("devId");
            console.log("devId:  " + userToken);
        }
    }
};

export const callSendUserToken = async (userID, token, devId) => {
    const resp = await ServerOperations.sendUserToken(userID, token, devId);
    if (resp.res == "ok") {
        await Commons.saveToAS("devId", devId);
    } else if (resp.res == "exists") {
        Commons.okAlert("", i18n.t("tokenNotRegistered"));
        await Commons.removeFromAS("userID");
        await Commons.removeFromAS("password");
        navigation.navigate("Login");
    }
};

export const registerForPushNotificationsAsync = async () => {
    let token;
    const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
    }
    token = (
        await Notifications.getExpoPushTokenAsync({
            experienceId: "@ntdco/ntdcohr",
            projectId: Constants.expoConfig.extra.eas.projectId,
        })
    ).data;
    console.log("token: " + token);
    console.log("projectID: " + Constants.expoConfig.extra.eas.projectId);

    if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    return token;
}

export const switchLanguage = async (curLang) => {
    const changeTo = curLang == "English" ? "en" : "ar";
    console.log(changeTo);
    await Commons.removeFromAS("lang");
    await Commons.saveToAS("lang", changeTo);
    if (changeTo == "ar") {
        I18nManager.allowRTL(false);
        I18nManager.forceRTL(false);
    } else {
        I18nManager.allowRTL(false);
        I18nManager.forceRTL(false);
    }
    i18n.locale = changeTo;
};