import React, { forwardRef, useImperativeHandle } from 'react';
import { Platform } from 'react-native';
import WebMap from './Map.web';
import AndroidMap from './Map.android';
import { Alert } from '@/types/alerts';

interface MapProps {
  alerts: Alert[];
  onAlertSelected: (alert: Alert | null) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number | undefined;
  mapLayer?: string;
}

// Fix the component error by explicitly handling the import
const Map = forwardRef<any, MapProps>((props, ref) => {
  // Create a forwarding ref to pass commands to platform-specific maps
  const mapRef = React.useRef<any>(null);
  
  useImperativeHandle(ref, () => ({
    postMessage: (message: string) => {
      if (mapRef.current && mapRef.current.postMessage) {
        mapRef.current.postMessage(message);
      }
    }
  }));
  
  // Use the appropriate map component
  if (Platform.OS === 'web') {
    return <WebMap {...props} ref={mapRef} />;
  } else {
    return <AndroidMap {...props} ref={mapRef} />;
  }
});

// Add a display name for better debugging
Map.displayName = 'Map';

export default Map;
