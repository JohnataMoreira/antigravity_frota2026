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

// Web stub path for react-native-vision-camera
const visionCameraStub = path.resolve(__dirname, 'src/stubs/vision-camera.web.js');

// Use resolveRequest to intercept react-native-vision-camera on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Redirect ALL vision-camera imports to a no-op stub on web
    if (
        platform === 'web' &&
        (moduleName === 'react-native-vision-camera' ||
            moduleName.startsWith('react-native-vision-camera/'))
    ) {
        return { filePath: visionCameraStub, type: 'sourceFile' };
    }
    // Use default resolution for everything else
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
