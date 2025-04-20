const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.assetExts.push('pte');  
defaultConfig.resolver.assetExts.push('bin');

// Exclude large files from Metro bundler
defaultConfig.watchFolders = [__dirname];
defaultConfig.resolver.blacklistRE = [
  /.*assets\/llama3_2-3B_qat_lora\.pte$/
];

module.exports = defaultConfig;