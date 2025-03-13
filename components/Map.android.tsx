import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { LeafletView, WebviewLeafletMessage, LatLng } from 'react-native-leaflet-view';

import { Alert } from '../types/alerts';
import { EVENT_COLORS } from '@/constants/alerts';

interface NativeAlertMapProps {
  alerts: Alert[];
  onAlertSelected: (alert: Alert | null) => void;
  initialCenter?: LatLng; // Changed to use LatLng type
  initialZoom?: number;
  mapLayer?: string;
}

// Define map-specific types
enum MapLayerType {
  IMAGE_LAYER = "ImageOverlay",
  TILE_LAYER = "TileLayer",
  VECTOR_LAYER = "VectorLayer",
  VIDEO_LAYER = "VideoOverlay",
  WMS_TILE_LAYER = "WMSTileLayer"
}

enum MapShapeType {
  CIRCLE = "Circle",
  POLYGON = "Polygon",
  POLYLINE = "Polyline",
  RECTANGLE = "Rectangle"
}

enum WebViewLeafletEvents {
  MAP_COMPONENT_MOUNTED = "MAP_COMPONENT_MOUNTED",
  MAP_READY = "MAP_READY",
  ON_MAP_TOUCHED = "onMapClicked",
  ON_MAP_MARKER_CLICKED = "onMapMarkerClicked",
  ON_MOVE_END = "onMoveEnd"
}

interface MapLayer {
  baseLayerName: string;
  baseLayerIsChecked: boolean;
  layerType: MapLayerType;
  baseLayer: boolean;
  url: string;
  attribution: string;
  layers?: string;
  format?: string;
  transparent?: boolean;
  opacity?: number;
  version?: string;
}

interface MapShape {
  id: string;
  shapeType: MapShapeType;
  color: string;
  positions?: [number, number][][] | [number, number][];
  center?: { lat: number; lng: number };
  radius?: number;
  properties?: {
    alertId: string;
    event: string;
    headline: string;
    expires: string;
  };
  fillColor?: string;
  fillOpacity?: number;
  weight?: number; 
  opacity?: number;
}

// Utility function to check if a point is inside a polygon
const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};

// Radar Legend Component
const RadarLegend = () => {
  return (
    <View style={styles.radarLegend}>
      <Text style={styles.radarLegendTitle}>Radar Reflectivity (dBZ)</Text>
      <View style={styles.radarLegendScale}>
        <View style={[styles.colorBlock, { backgroundColor: '#00FFFF' }]} />
        <View style={[styles.colorBlock, { backgroundColor: '#00C8FF' }]} />
        <View style={[styles.colorBlock, { backgroundColor: '#0096FF' }]} />
        <View style={[styles.colorBlock, { backgroundColor: '#0064FF' }]} />
        <View style={[styles.colorBlock, { backgroundColor: '#00FF00' }]} />
        <View style={[styles.colorBlock, { backgroundColor: '#00C800' }]} />
        <View style={[styles.colorBlock, { backgroundColor: '#009600' }]} />
        <View style={[styles.colorBlock, { backgroundColor: '#FFFF00' }]} />
        <View style={[styles.colorBlock, { backgroundColor: '#E6E600' }]} />
        <View style={[styles.colorBlock, { backgroundColor: '#FF9600' }]} />
        <View style={[styles.colorBlock, { backgroundColor: '#FF0000' }]} />
        <View style={[styles.colorBlock, { backgroundColor: '#D60000' }]} />
      </View>
      <View style={styles.radarLegendLabels}>
        <Text style={styles.radarLegendLabel}>5</Text>
        <Text style={styles.radarLegendLabel}>20</Text>
        <Text style={styles.radarLegendLabel}>35</Text>
        <Text style={styles.radarLegendLabel}>50</Text>
        <Text style={styles.radarLegendLabel}>65+</Text>
      </View>
    </View>
  );
};

const NativeAlertMap = React.forwardRef<any, NativeAlertMapProps>(({
  alerts,
  onAlertSelected,
  initialCenter = { lat: 39.8283, lng: -98.5795 }, // US center, valid LatLng
  mapLayer = 'standard'
}, ref) => {
  const [mapCenter, setMapCenter] = useState<LatLng>(initialCenter); // Use LatLng state
  const [zoom, setZoom] = useState<number>(5); // Default zoom level, non-nullable
  const [mapReady, setMapReady] = useState(false);
  const [radarVisible, setRadarVisible] = useState(true);
  const [highlightedAlert, setHighlightedAlert] = useState<string | null>(null);
  const pendingAlertHighlightRef = useRef<{alertId: string, shouldZoom: boolean} | null>(null);
  
  // We'll use a ref to store a function for sending messages to the map
  const sendMapMessageRef = useRef<((message: any) => void) | null>(null);
  
  // Timer for radar refresh
  const radarRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Simplified flag to prevent event loops
  const isHandlingUserActionRef = useRef(false);

  // Send zoom command function - simplified for Android
  const sendZoomCommand = useCallback((newZoom: number) => {
    console.log('Android Map: Setting zoom to', newZoom);
    setZoom(newZoom);
    // Don't send direct zoom commands - let the component re-render
  }, []);

  // Convert alert polygons to map shapes with improved styling
  const mapShapes: MapShape[] = alerts.map(alert => {
    const { id, event, headline, expires } = alert.properties;
    const eventColor = EVENT_COLORS[event as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
    
    // Convert GeoJSON coordinates to Leaflet format
    const coordinates = alert.geometry.coordinates[0].map(coord => [coord[1], coord[0]] as [number, number]);
    
    // Check if this alert is the highlighted one
    const isHighlighted = id === highlightedAlert;
    
    return {
      id,
      shapeType: MapShapeType.POLYGON,
      color: eventColor,
      fillColor: eventColor,
      fillOpacity: isHighlighted ? 0.5 : 0.35, // Increase opacity for highlighted alert
      weight: isHighlighted ? 3 : 2, // Make border thicker for highlighted alert
      opacity: isHighlighted ? 1.0 : 0.8, // Make border more opaque for highlighted alert
      positions: [coordinates],
      properties: {
        alertId: id,
        event: event,
        headline: headline,
        expires: expires
      }
    };
  });

  // Create base map layers (without the radar layer)
  const baseMapLayers: MapLayer[] = React.useMemo(() => {
    return [
      {
        baseLayerName: "Standard",
        baseLayerIsChecked: mapLayer === 'standard',
        layerType: MapLayerType.TILE_LAYER,
        baseLayer: true,
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      },
      {
        baseLayerName: "Satellite",
        baseLayerIsChecked: mapLayer === 'satellite',
        layerType: MapLayerType.TILE_LAYER,
        baseLayer: true,
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      },
      {
        baseLayerName: "Dark",
        baseLayerIsChecked: mapLayer === 'dark',
        layerType: MapLayerType.TILE_LAYER,
        baseLayer: true,
        url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
      }
    ];
  }, [mapLayer]);
  
  // Create the radar layer separately
  const radarLayer: MapLayer = React.useMemo(() => {
    // Add a timestamp to force refresh
    const timestamp = new Date().getTime();
    
    return {
      baseLayerName: "Radar",
      baseLayerIsChecked: true,
      layerType: MapLayerType.WMS_TILE_LAYER,
      baseLayer: false,
      url: `https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?_ts=${timestamp}`,
      attribution: '© NOAA',
      layers: "conus_bref_qcd",
      format: "image/png",
      transparent: true,
      opacity: 0.7,
      version: "1.3.0"
    };
  }, []);
  
  // Combine layers based on visibility
  const mapLayers = React.useMemo(() => {
    const combinedLayers = [...baseMapLayers];
    if (radarVisible) {
      combinedLayers.push(radarLayer);
    }
    return combinedLayers;
  }, [baseMapLayers, radarLayer, radarVisible]);
  
  // Setup radar refresh
  useEffect(() => {
    // Start the refresh timer
    const startRadarRefresh = () => {
      if (radarRefreshTimerRef.current) {
        clearInterval(radarRefreshTimerRef.current);
      }
      
      radarRefreshTimerRef.current = setInterval(() => {
        if (radarVisible && mapReady && sendMapMessageRef.current) {
          // Create a new radar layer with updated timestamp
          const newTimestamp = new Date().getTime();
          const updatedRadarLayer = {
            ...radarLayer,
            url: `https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?_ts=${newTimestamp}`
          };
          
          // Send a message to update just this layer
          sendMapMessageRef.current({
            type: 'UPDATE_LAYER',
            layerName: 'Radar',
            layer: updatedRadarLayer
          });
        }
      }, 60000);
    };
    
    if (mapReady) {
      startRadarRefresh();
    }
    
    return () => {
      if (radarRefreshTimerRef.current) {
        clearInterval(radarRefreshTimerRef.current);
      }
    };
  }, [mapReady, radarVisible, radarLayer]);

  // Process alert highlight logic in a separate function for reuse
  const processAlertHighlight = useCallback((alertId: string, shouldZoom: boolean = false) => {
    // Find the alert to highlight
    const alertToHighlight = alerts.find(a => a.properties.id === alertId);
    if (!alertToHighlight) {
      console.log('Android Map: Alert not found:', alertId);
      return;
    }
    
    console.log('Android Map: Processing highlight for alert:', alertId, 'shouldZoom:', shouldZoom);
    
    // Store the highlighted alert ID
    setHighlightedAlert(alertId);
    
    // Calculate the center and bounds of the polygon
    if (alertToHighlight.geometry && alertToHighlight.geometry.coordinates && 
        alertToHighlight.geometry.coordinates[0]) {
      const coords = alertToHighlight.geometry.coordinates[0];
      
      // Calculate the bounds of the polygon
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      coords.forEach(coord => {
        const [lng, lat] = coord;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
      
      // Calculate center using LatLng
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const newCenter: LatLng = { lat: centerLat, lng: centerLng };
      
      if (shouldZoom) {
        console.log('Android Map: Should zoom is TRUE, centering and setting zoom level');
        setMapCenter(newCenter);
        // changed code: use a fixed zoom level of 12 similar to web
        setTimeout(() => {
          setZoom(12);
        }, 100);
      } else {
        // Just update the center if we shouldn't zoom
        setMapCenter(newCenter);
      }
      
      // Select the alert to show its popup (after a delay to ensure map has updated)
      setTimeout(() => {
        console.log('Android Map: Selecting alert to show popup');
        onAlertSelected(alertToHighlight);
      }, shouldZoom ? 800 : 100); // Shorter delay than before
    }
  }, [alerts, onAlertSelected]);

  // Handle map messages
  const handleMapMessage = useCallback((message: WebviewLeafletMessage) => {
    if (!message.event) return;
    
    // When map is ready, store the sendMessage function
    if (message.event === WebViewLeafletEvents.MAP_COMPONENT_MOUNTED) {
      console.log('Android Map: Map component mounted');
    }
    
    // Handle map ready event
    if (message.event === WebViewLeafletEvents.MAP_READY) {
      console.log('Android Map: Map ready event received');
      // Capture the sendMessage function if available from the event
      if (message.payload && (message.payload as any).sendMessage) {
        sendMapMessageRef.current = (message.payload as any).sendMessage;
        console.log('Android Map: Captured sendMessage function');
      } else {
        console.error('Android Map: sendMessage function not found in payload');
      }
      setMapReady(true);
      
      // If we have a pending alert highlight, process it now
      if (pendingAlertHighlightRef.current) {
        const { alertId, shouldZoom } = pendingAlertHighlightRef.current;
        console.log('Android Map: Processing pending highlight for alert:', alertId);
        pendingAlertHighlightRef.current = null;
        // Delay processing to ensure map is fully initialized
        setTimeout(() => {
          processAlertHighlight(alertId, shouldZoom);
        }, 500);
      }
    }
    
    // Handle map click events - check if clicked inside a polygon
    if (message.event === WebViewLeafletEvents.ON_MAP_TOUCHED && message.payload) {
      try {
        const payload = message.payload as any;
        if (payload.touchLatLng) {
          const { lat, lng } = payload.touchLatLng;
          const clickedPoint: [number, number] = [lat, lng];
          
          let foundAlert = false;
          
          // Check each alert polygon to see if the click was inside it
          for (const alert of alerts) {
            if (alert.geometry && alert.geometry.coordinates && alert.geometry.coordinates[0]) {
              // Convert GeoJSON coordinates to Leaflet format for checking
              const polygonCoords = alert.geometry.coordinates[0].map(
                coord => [coord[1], coord[0]] as [number, number]
              );
              
              if (isPointInPolygon(clickedPoint, polygonCoords)) {
                // Set highlighted alert when clicking polygon
                setHighlightedAlert(alert.properties.id);
                
                onAlertSelected(alert);
                foundAlert = true;
                break; // Stop after finding the first matching alert
              }
            }
          }
          
          // If no alert was found, clear the selection
          if (!foundAlert) {
            setHighlightedAlert(null);
            onAlertSelected(null);
          }
        }
      } catch (e) {
        console.error('Error checking if point in polygon', e);
      }
    }
    
    // Handle map moved events - simplified to avoid zoom conflicts
    if (message.event === WebViewLeafletEvents.ON_MOVE_END && message.payload && !isHandlingUserActionRef.current) {
      try {
        const mapState = message.payload as any;
        if (mapState.center) {
          setMapCenter(mapState.center);
        }
        // Don't update zoom here to avoid conflicts
      } catch (e) {
        console.error('Error handling map move event', e);
      }
    }
  }, [alerts, onAlertSelected, processAlertHighlight]);

  // Clear effect that runs when zoom/mapCenter changes to ensure LeafletView updates
  useEffect(() => {
    if (mapReady && sendMapMessageRef.current) {
      console.log('Android Map: Props changed, zoom:', zoom, 'center:', mapCenter);
    }
  }, [zoom, mapCenter, mapReady]);

  // Update our imperative handle to expose functionality
  React.useImperativeHandle(ref, () => ({
    postMessage: (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Android Map: Received message:', data.type);
        
        if (data.type === 'TOGGLE_RADAR') {
          const newVisibility = data.visible !== undefined ? data.visible : !radarVisible;
          console.log("Android Map: Toggling radar visibility to", newVisibility);
          setRadarVisible(newVisibility);
        }
        else if (data.type === 'HIGHLIGHT_ALERT') {
          console.log('Android Map: Received highlight command for alert', data.alertId);
          
          const shouldZoom = data.urlNavigation === true;
          console.log('Android Map: Should zoom:', shouldZoom);
          
          // Process immediately instead of checking map ready state
          const alertToHighlight = alerts.find(a => a.properties.id === data.alertId);
          if (alertToHighlight) {
            // Highlight the alert right away
            setHighlightedAlert(data.alertId);
            
            // Calculate center
            if (alertToHighlight.geometry && alertToHighlight.geometry.coordinates && 
                alertToHighlight.geometry.coordinates[0]) {
              const coords = alertToHighlight.geometry.coordinates[0];
              
              // Calculate bounds
              let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
              coords.forEach(coord => {
                const [lng, lat] = coord;
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
                minLng = Math.min(minLng, lng);
                maxLng = Math.max(maxLng, lng);
              });
              
              // Set center first
              const centerLat = (minLat + maxLat) / 2;
              const centerLng = (minLng + maxLng) / 2;
              setMapCenter({ lat: centerLat, lng: centerLng });
              
              // Then set zoom if needed
              if (shouldZoom) {
                setTimeout(() => {
                  setZoom(10);
                }, 100);
              }
              
              // Select the alert to show its popup
              onAlertSelected(alertToHighlight);
            }
          }
        }
        else if (data.type === 'ZOOM_IN') {
          // Flag that we're handling a user action
          isHandlingUserActionRef.current = true;
          
          // Simple zoom in - just increment zoom level
          const newZoom = Math.min(zoom + 1, 18);
          console.log('Android Map: Zooming in to', newZoom);
          setZoom(newZoom);
          
          // Reset the flag after a delay
          setTimeout(() => {
            isHandlingUserActionRef.current = false;
          }, 500);
        }
        else if (data.type === 'ZOOM_OUT') {
          // Flag that we're handling a user action
          isHandlingUserActionRef.current = true;
          
          // Simple zoom out - just decrement zoom level
          const newZoom = Math.max(zoom - 1, 3);
          console.log('Android Map: Zooming out to', newZoom);
          setZoom(newZoom);
          
          // Reset the flag after a delay
          setTimeout(() => {
            isHandlingUserActionRef.current = false;
          }, 500);
        }
      } catch (e) {
        console.error('Error parsing message in Android Map:', e);
      }
    }
  }), [radarVisible, zoom, alerts, onAlertSelected]);

  // Get window dimensions to properly size the map
  const windowDimensions = Dimensions.get('window');
  const [mapDimensions, setMapDimensions] = useState({
    width: windowDimensions.width,
    height: windowDimensions.height
  });
  
  // Listen for dimension changes
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', ({ window }) => {
      setMapDimensions({ width: window.width, height: window.height });
    });
    
    return () => {
      dimensionsHandler.remove();
    };
  }, []);

  return (
    <View 
      style={styles.container}
      onLayout={(event) => {
        // Get layout dimensions directly from the container
        const { width, height } = event.nativeEvent.layout;
        console.log('Android Map: Container dimensions:', width, height);
        setMapDimensions({ width, height });
      }}
    >
      <LeafletView
        mapLayers={mapLayers}
        mapShapes={mapShapes}
        mapCenterPosition={mapCenter}
        zoom={zoom}
        onMessageReceived={handleMapMessage}
      />
      
      {/* Show radar legend only when radar is visible */}
      {radarVisible && <RadarLegend />}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    // Ensure the container doesn't get clipped
    overflow: 'hidden',
    // Ensure the container fills available space
    width: '100%',
    height: '100%',
  },
  // Add radar legend styles
  radarLegend: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    zIndex: 1000,
  },
  radarLegendTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  radarLegendScale: {
    flexDirection: 'row',
    height: 10,
    width: 120,
    marginBottom: 4,
  },
  colorBlock: {
    flex: 1,
    height: '100%',
  },
  radarLegendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
  },
  radarLegendLabel: {
    fontSize: 8,
    color: '#333',
  },
});

export default NativeAlertMap;
