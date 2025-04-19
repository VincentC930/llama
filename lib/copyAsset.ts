import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export const copyAssetToFS = async (filename: string) => {
  const asset = Asset.fromModule(require(`@/assets/models/llama3/${filename}`));
  await asset.downloadAsync();
  const dest = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.copyAsync({ from: asset.localUri!, to: dest });
  return dest;
};
