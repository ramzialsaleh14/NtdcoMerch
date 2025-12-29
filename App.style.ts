import { DefaultTheme } from "react-native-paper";
import * as Constants from "./app/utils/Constants";

export const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: Constants.appColor,
        background: 'transparent',
        // Force a conservative default text color so plain <Text> without explicit
        // color remains visible on light backgrounds even when the OS is in
        // dark mode (avoids white-on-white rendering).
        text: '#111111',
        // onSurface is used by some libraries; keep it consistent
        onSurface: '#111111'
    }
}

export const loginTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: '#A91B0D',
        background: 'transparent',
        text: '#111111',
        onSurface: '#111111'
    }
}