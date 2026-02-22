const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)

config.resolver.alias = {
    ...config.resolver.alias,
    'react-native-reanimated': 'react-native-reanimated',
}

config.transformer.getTransformOptions = async () => ({
    transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
    },
})

module.exports = withNativeWind(config, { input: './global.css' })
