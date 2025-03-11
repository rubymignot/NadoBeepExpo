import { Platform } from 'react-native';
import WebMap from './Map.web';
import AndroidMap from './Map.android';

// Re-export the platform-specific Map file
export default Platform.OS === 'web' ? WebMap : AndroidMap;
