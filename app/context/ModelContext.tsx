import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { useLLM } from 'react-native-executorch';

interface ModelContextType {
  modelReady: boolean;
  downloadProgress: number;
  llama: any; // Using any type for simplicity, but could be typed properly
  isLoading: boolean;
  modelPath: string;
  tokenizerPath: any;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};

interface ModelProviderProps {
  children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const [modelPath, setModelPath] = useState('');
  const [tokenizerPath, setTokenizerPath] = useState('');
  const [modelReady, setModelReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const prepareModel = async () => {
      try {
        // Get the bundle directory
        const bundleDir = FileSystem.documentDirectory;
        const modelFilename = 'llama3_2-3B_qat_lora.pte';
        const modelAssetPath = `${bundleDir}${modelFilename}`;
        const tokenizerBin = require('../../assets/tokenizer.bin');
        
        // Check if model exists in FileSystem
        const modelInfo = await FileSystem.getInfoAsync(modelAssetPath);
        
        // If model doesn't exist in FileSystem, download it from Hugging Face
        if (!modelInfo.exists) {
          const modelUrl = 'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-1B/spinquant/llama3_2_spinquant.pte';
          console.log('downloading');
          try {
            // Download model from Hugging Face to document directory
            const downloadResumable = FileSystem.createDownloadResumable(
              modelUrl,
              modelAssetPath,
              {},
              (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                setDownloadProgress(progress);
                console.log(`Download progress: ${Math.round(progress * 100)}%`);
              }
            );
            
            const downloadResult = await downloadResumable.downloadAsync();
            if (downloadResult?.uri) {
              console.log('Model downloaded successfully');
            } else {
              throw new Error('Download failed without error');
            }
          } catch (downloadError) {
            console.error('Error downloading model:', downloadError);
            Alert.alert('Model Error', 'Could not download the model file. Please check your internet connection and try again.');
            setIsLoading(false);
            return;
          }
        }
        
        setModelPath(modelAssetPath);
        setTokenizerPath(tokenizerBin);
        setModelReady(true);
        console.log('Model and tokenizer prepared successfully');
      } catch (error) {
        console.error('Error preparing model:', error);
        Alert.alert('Model Error', 'Failed to prepare the LLM model file.');
      } finally {
        setIsLoading(false);
      }
    };
    
    prepareModel();
  }, []);

//   const llama = useLLM({
//     modelSource: modelPath,
//     tokenizerSource: tokenizerPath,
//     systemPrompt: 'Be a helpful assistant',
//     contextWindowLength: 3,
//   });
  const llama = null;
  const value = {
    modelReady,
    downloadProgress,
    llama,
    isLoading,
    modelPath,
    tokenizerPath,
  };

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
};

// Add a placeholder component as the default export
// This is necessary because Expo Router expects all files to have a default export
const ModelContextScreen = () => {
  return null;
};

export default ModelContextScreen; 