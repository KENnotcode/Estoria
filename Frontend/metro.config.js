const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

// Keep package exports enabled for Expo SDK 58, but disable it specifically for Firebase
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('firebase') || moduleName.startsWith('@firebase')) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
