import React, { useState, useEffect } from "react";
import { Button, Card, Modal, Portal, TextInput } from "react-native-paper";
import * as ServerOperations from "../utils/ServerOperations";
import * as Commons from "../utils/Commons";
import * as SecureStore from "expo-secure-store";
import * as Constants from "../utils/Constants";
import * as Localization from "expo-localization";
import {
  SafeAreaView,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import i18n from "../languages/langStrings";
import { loginTheme } from "../../App.style";

TouchableOpacity.defaultProps = { activeOpacity: 0.8 };
// interface Props {
//   navigation: any
// }

const AppButton = ({ onPress, title }) => (
  <TouchableOpacity onPress={onPress} style={styles.appButtonContainer}>
    <Text style={styles.appButtonText}>{title}</Text>
  </TouchableOpacity>
);

export const LoginScreen = ({ navigation }) => {
  const [userNo, onChangeUser] = useState("");
  const [password, onChangePassword] = useState("");
  const [userNoStorage, onChangeUserStorage] = useState("");
  const [passwordStorage, onChangePasswordStorage] = useState("");

  const getLoginInfo = async () => {
    const userFromStorage = await Commons.getFromAS("userID");
    const passFromStorage = await Commons.getFromAS("password");
    if (userFromStorage !== "" && userFromStorage !== null) {
      onChangeUser(userFromStorage);
      onChangePassword(passFromStorage);
      onChangeUserStorage(userFromStorage);
      onChangePasswordStorage(passFromStorage);
    }
  };

  useEffect(() => {
    getLoginInfo();
    console.log(userNoStorage);
  }, []);

  useEffect(() => {
    if (
      userNoStorage != "" &&
      userNoStorage !== null &&
      passwordStorage != "" &&
      passwordStorage !== null
    ) {
      onChangeUser(userNoStorage);
      onChangePassword(passwordStorage);
      onLoginClick();
    }
  }, [userNoStorage, passwordStorage]);

  const onLoginClick = async () => {
    try {
      const resp = await ServerOperations.checkLogin(userNo, password);
      if (resp.result === true) {
        await Commons.saveToAS("userID", userNo);
        await Commons.saveToAS("password", password);
        await Commons.saveToAS("isTeamLeader", resp.isTeamLeader ? "true" : "false");
        if (resp.merchUsers) {
          await Commons.saveToAS("merchUsers", JSON.stringify(resp.merchUsers));
        }
        navigation.navigate("Main", { updateData: resp.updateData });
      } else {
        if (resp.msg) {
          Commons.okAlert("", resp.msg);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      Commons.okAlert(i18n.t("error"), i18n.t("loginFailed"));
    }
  };

  return (
    <SafeAreaView style={styles.cardContainer}>
      <Text style={{ position: "absolute", top: 20, alignSelf: "center" }}>
        {Constants.appVersion}
      </Text>
      <View style={styles.viewContainer}>
        <Card>
          <Card.Title
            title={i18n.t("loginTitle")}
            titleStyle={styles.cardTitle}
          ></Card.Title>
          <Card.Content>
            <TextInput
              label={i18n.t("user")}
              value={userNo}
              onChangeText={onChangeUser}
            />
            <TextInput
              label={i18n.t("password")}
              secureTextEntry={true}
              value={password}
              onChangeText={onChangePassword}
            />
            <View style={styles.loginButtonContainer}>
              <AppButton title={i18n.t("login")} onPress={onLoginClick} />
            </View>
          </Card.Content>
        </Card>
        <Image style={styles.image} source={require("../../assets/logo.png")} />
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  viewContainer: {
    width: "80%",
    marginTop: 80,
  },
  cardContainer: {
    display: "flex",
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  modalStyle: {
    backgroundColor: "white",
    padding: 20,
  },
  loginButtonStyle: {
    margin: 2,
    marginLeft: 0,
    marginRight: 0,
  },

  loginButtonContainer: {
    margin: 15,
    width: "100%",
    paddingTop: 15,
    alignSelf: "center",
  },
  image: {
    width: 160,
    height: 195,
    margin: 45,
    marginTop: 40,
    alignSelf: "center",
  },
  appButtonContainer: {
    backgroundColor: Constants.appColor,
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  cardTitle: {
    color: Constants.appColor,
  },
  appButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
});
