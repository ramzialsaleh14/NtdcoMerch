import { registerRootComponent } from 'expo';
import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { Text as PaperText } from 'react-native-paper';
import App from './App';

// Very early bootstrap: ensure any <Text> rendered before App mounts has a
// conservative color so plain text won't become invisible under OS dark mode.
// This only injects a color when no color is specified by component styles.
try {
    const fallbackColor = '#111111';

    RNText.defaultProps = RNText.defaultProps || {};
    RNText.defaultProps.style = { color: fallbackColor, ...(RNText.defaultProps.style || {}) };

    // Patch react-native-paper's Text if available — helps library components.
    if (PaperText) {
        PaperText.defaultProps = PaperText.defaultProps || {};
        PaperText.defaultProps.style = { color: fallbackColor, ...(PaperText.defaultProps.style || {}) };
    }

    const originalCreateElement = React.createElement;
    React.createElement = function (type, props, ...children) {
        try {
            const isTextType = type === RNText || type === PaperText || (type && (type.displayName === 'Text' || type.name === 'Text'));
            if (isTextType) {
                props = props || {};
                const flattened = StyleSheet.flatten(props.style) || {};
                const hasColor = Object.prototype.hasOwnProperty.call(flattened, 'color');
                if (!hasColor) {
                    const fallback = { color: fallbackColor };
                    // Keep arrays and objects supported — if style already array, prepend fallback
                    props.style = Array.isArray(props.style) ? [fallback, ...props.style] : [fallback, props.style].filter(Boolean);
                }
            }
        } catch (e) {
            // no-op; fall back to original createElement
            // eslint-disable-next-line no-console
            console.log('index.js Text fallback error', e);
        }
        return originalCreateElement(type, props, ...children);
    };
} catch (e) {
    // eslint-disable-next-line no-console
    console.log('index.js Text fallback failed', e);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
