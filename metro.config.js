const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Make sure Web can access audio files
config.resolver.assetExts.push('mp3', 'wav');

// Allow importing sound files with require
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

module.exports = config;
