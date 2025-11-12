import { DefaultTheme } from "react-native-paper";
import * as Constants from "./app/utils/Constants";

export const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: Constants.appColor,
        background: 'transparent'
    }
}

export const loginTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: '#A91B0D',
        background: 'transparent'
    }
}