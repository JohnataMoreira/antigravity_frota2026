const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Root of the monorepo
const monorepoRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(__dirname);

// Watch the root node_modules too (needed for expo-router, expo-linking etc
// that are hoisted to the monorepo root)
config.watchFolders = [monorepoRoot];

// Resolve modules from both local and root node_modules
config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
];

// Web stub paths for native-only modules
const visionCameraStub = path.resolve(__dirname, 'src/stubs/vision-camera.web.js');
const mapsStub = path.resolve(__dirname, 'src/stubs/maps.web.js');

// Use resolveRequest to intercept native-only modules on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web') {
        // Redirect Vision Camera
        if (moduleName === 'react-native-vision-camera' || moduleName.startsWith('react-native-vision-camera/')) {
            return { filePath: visionCameraStub, type: 'sourceFile' };
        }
        // Redirect Maps
        if (moduleName === 'react-native-maps' || moduleName.startsWith('react-native-maps/')) {
            return { filePath: mapsStub, type: 'sourceFile' };
        }
    }

    // Redirect legacy worklets plugin to the new worklets-core plugin
    if (moduleName === 'react-native-worklets/plugin') {
        return context.resolveRequest(context, 'react-native-worklets-core/plugin', platform);
    }

    // Use default resolution for everything else
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
