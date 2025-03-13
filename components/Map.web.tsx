import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { Alert } from '../types/alerts';
import { EVENT_COLORS } from '@/constants/alerts';
import { leafletMapHtml } from '../assets/inline-map';
import { getRelativeTime } from '@/utils/dateUtils';

// Track if selection originated from map click
let selectionFromMapClick = false;

interface WebAlertMapProps {
  alerts: Alert[];
  onAlertSelected: (alert: Alert | null) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number | null;
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
  const [highlightedAlertId, setHighlightedAlertId] = useState<string | null>(null);
  const mapInitializedRef = useRef(false);
  
  // Process alerts with colors and time formatting
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

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        // Parse message data
        let data;
        if (typeof event.data === 'string') {
          try {
            data = JSON.parse(event.data);
          } catch (parseError) {
            console.error('Error parsing message data:', parseError);
            return;
          }
        } else if (typeof event.data === 'object') {
          data = event.data;
        } else {
          console.log('Ignoring non-object, non-string message:', event.data);
          return;
        }
        
        // Process the data object
        switch (data.type) {
          case 'MAP_READY':
            console.log('Web Map is ready!');
            setMapReady(true);
            break;
            
          case 'ALERT_SELECTED':
            if (data.alertId) {
              // Check if this came from a map click
              const fromMapClick = data.fromMapClick === true;
              console.log("Alert selected, fromMapClick:", fromMapClick);
              
              const selectedAlert = alerts.find(alert => alert.properties.id === data.alertId);
              if (selectedAlert) {
                // Save the information that this was a map click
                selectionFromMapClick = fromMapClick;
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

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [alerts, onAlertSelected]);
  
  // Send alerts to the map when ready or when alerts change
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
      
      mapInitializedRef.current = true;
      
      // If we have a highlighted alert, send that message after initialization
      if (highlightedAlertId) {
        setTimeout(() => {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            console.log('Sending highlight alert message for:', highlightedAlertId);
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
              type: 'HIGHLIGHT_ALERT',
              alertId: highlightedAlertId
            }), "*");
          }
        }, 500); // Short delay to ensure the map has processed the alerts
      }
    }
  }, [mapReady, alerts, mapLayer, highlightedAlertId]);

  // Expose the ability to post messages to the iframe
  useImperativeHandle(ref, () => ({
    postMessage: (message: string) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          const data = JSON.parse(message);
          
          // Handle highlight alert special case
          if (data.type === 'HIGHLIGHT_ALERT' && data.alertId) {
            // Make sure we keep the urlNavigation flag when passed
            const urlNavigation = typeof data.urlNavigation !== 'undefined' 
              ? data.urlNavigation 
              : !selectionFromMapClick;
            
            // Update the message with the resolved urlNavigation flag
            data.urlNavigation = urlNavigation;
            
            // Log for debugging
            console.log(`Highlighting alert ${data.alertId}, urlNavigation:`, urlNavigation);
            
            message = JSON.stringify(data);
            setHighlightedAlertId(data.alertId);
            
            // If the map is already initialized, send the message immediately
            if (mapInitializedRef.current) {
              iframeRef.current.contentWindow.postMessage(message, "*");
            }
            // Otherwise, it will be sent after initialization in the useEffect
          } else if (data.type === 'TOGGLE_RADAR') {
            // Make sure we properly send radar visibility toggle
            console.log("Toggling radar visibility to:", data.visible);
            message = JSON.stringify(data);
            iframeRef.current.contentWindow.postMessage(message, "*");
          } else if (data.type === 'ZOOM_IN' || data.type === 'ZOOM_OUT') {
            // For zoom operations, make sure we send immediately
            console.log("Web Map: Sending zoom command:", data.type);
            iframeRef.current.contentWindow.postMessage(message, "*");
          } else {
            // For all other messages, send immediately
            iframeRef.current.contentWindow.postMessage(message, "*");
          }
        } catch (e) {
          console.error('Error posting message to iframe:', e);
        }
      }
    },
    
    // Expose the selection source flag to parent
    isSelectionFromMapClick: () => selectionFromMapClick
  }));

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={leafletMapHtml}
        style={{...styles.webView, border: 'none'}}
        title="Weather Alerts Map"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  webView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%'
  },
});

export default WebAlertMap;
