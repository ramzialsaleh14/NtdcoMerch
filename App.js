import { StatusBar } from "expo-status-bar";
import { Text, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from "react-native-paper";
import AppNavigator from "./app/app.navigation";
import { theme } from "./App.style";
import * as Notifications from "expo-notifications";
import React, { useEffect } from "react";
import * as Strings from "./app/utils/Strings";
import * as Localization from "expo-localization";
import i18n from "i18n-js";
import { MenuProvider } from "react-native-popup-menu";
import * as Commons from "./app/utils/Commons";

export const getLanguage = async () => {
  await Commons.createDB();
  const currentLang = await Commons.getFromAS("lang");
  if (currentLang == null || currentLang == "") {
    if (currentLang == "en") await Commons.saveToAS("lang", "en");
    if (currentLang == "ar") await Commons.saveToAS("lang", "ar");
  }
  if (currentLang == "en") i18n.locale = "en";
  if (currentLang == "ar") i18n.locale = "ar";
  if (currentLang == "" || currentLang == null) { i18n.locale = "ar"; await Commons.saveToAS("lang", "ar") }
  i18n.enableFallback = true;
};

const App = () => {
  getLanguage();

  // Ensure plain <Text> components without an explicit color remain visible
  // across OS themes (avoid white text on white background when device
  // is in dark mode). We still allow components to override color locally.
  try {
    Text.defaultProps = Text.defaultProps || {};
    const existing = Text.defaultProps.style || {};
    // Prefer theme color; fall back to a safe dark value.
    Text.defaultProps.style = { color: theme?.colors?.text || '#111111', ...existing };
    // Also wrap React.createElement so we inject a safe fallback color into
    // every <Text> element even if the component passes a style object
    // without a color. This handles cases where components provide style
    // but don't set color (they'd otherwise inherit system dark-mode color).
    const originalCreateElement = React.createElement;
    React.createElement = function (type, props, ...children) {
      try {
        if (type === Text) {
          props = props || {};
          // StyleSheet.flatten handles numeric ids and arrays so we can reliably
          // detect whether a color attribute is present on the final style.
          const flattened = StyleSheet.flatten(props.style) || {};
          const hasColor = Object.prototype.hasOwnProperty.call(flattened, 'color');
          if (!hasColor) {
            const fallback = { color: theme?.colors?.text || '#111111' };
            props.style = Array.isArray(style) ? [fallback, ...style] : [fallback, style].filter(Boolean);
          }
        }
      } catch (e) {
        // If anything goes wrong here we fall back to original createElement below.
        console.log('createElement patch error', e);
      }
      return originalCreateElement(type, props, ...children);
    };
  } catch (e) {
    // No-op if Text properties are frozen or unavailable in the runtime.
    console.log('Warning: could not set Text.defaultProps.style', e);
  }
  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
    </PaperProvider>
  );
};

export default App;
