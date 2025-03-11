import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { Alert } from '../types/alerts';
import { EVENT_COLORS } from '@/constants/alerts';
import { leafletMapHtml } from '../assets/inline-map';
import { getRelativeTime } from '@/utils/dateUtils';

interface WebAlertMapProps {
  alerts: Alert[];
  onAlertSelected: (alert: Alert | null) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  mapLayer?: string;
}

const WebAlertMap = forwardRef<any, WebAlertMapProps>(({
  alerts,
  onAlertSelected,
  initialCenter = { lat: 39.8283, lng: -98.5795 }, // US center
  initialZoom = 4,
  mapLayer = 'standard'
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mapReady, setMapReady] = useState(false);

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'MAP_READY':
            console.log('Map is ready!');
            setMapReady(true);
            break;
            
          case 'ALERT_SELECTED':
            if (data.alertId) {
              const selectedAlert = alerts.find(alert => alert.properties.id === data.alertId);
              if (selectedAlert) {
                onAlertSelected(selectedAlert);
              }
            }
            break;
            
          case 'CLICK_OUTSIDE':
            onAlertSelected(null);
            break;
        }
      } catch (e) {
        console.error('Error handling message from map:', e);
      }
    };

    // Add event listener
    window.addEventListener('message', handleMessage);
    
    // Clean up
    return () => window.removeEventListener('message', handleMessage);
  }, [alerts, onAlertSelected]);

  useImperativeHandle(ref, () => ({
    postMessage: (message: string) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(message, "*");
      }
    }
  }));

  const processAlertsForMap = (alerts: Alert[]) => {
    return alerts.map(alert => {
      const color = EVENT_COLORS[alert.properties.event as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
      const issued = new Date(alert.properties.sent || alert.properties.effective);
      const relativeTime = getRelativeTime(issued);
      
      return {
        ...alert,
        properties: {
          ...alert.properties,
          color,
          relativeTime
        }
      };
    });
  };

  // Send alerts when they change or when map is ready
  useEffect(() => {
    if (mapReady && iframeRef.current && iframeRef.current.contentWindow) {
      console.log('Sending alerts to map:', alerts.length);
      const processedAlerts = processAlertsForMap(alerts);
      
      // Initialize the map with alert data and layer setting
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        type: 'INITIALIZE_MAP',
        alerts: processedAlerts,
        layer: mapLayer,
        zoomControl: false // Disable the built-in zoom controls
      }), "*");
    }
  }, [mapReady, alerts, mapLayer]);

  // Debug when iframe loads
  const handleIframeLoad = () => {
    console.log('Iframe loaded');
    // Don't set mapReady here - wait for the MAP_READY message from the iframe
  };

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={leafletMapHtml}
        style={{...styles.webView, border: 'none'}}
        onLoad={handleIframeLoad}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative', // Ensure proper positioning
  },
  webView: {
    position: 'absolute', // Use absolute positioning
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%'
  },
});

export default WebAlertMap;
