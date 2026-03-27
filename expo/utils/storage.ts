import AsyncStorage from '@react-native-async-storage/async-storage';

const Storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (e) {
      console.error('[Storage] getItem error:', key, e);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('[Storage] setItem error:', key, e);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('[Storage] removeItem error:', key, e);
    }
  },
};

export default Storage;
