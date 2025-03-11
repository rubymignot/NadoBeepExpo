import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LeafletView, WebviewLeafletMessage } from 'react-native-leaflet-view';

import { Alert } from '../types/alerts';
import { EVENT_COLORS } from '@/constants/alerts';

interface NativeAlertMapProps {
  alerts: Alert[];
  onAlertSelected: (alert: Alert | null) => void;
  initialCenter?: { lat: number; lng: number };
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

const NativeAlertMap: React.FC<NativeAlertMapProps> = ({
  alerts,
  onAlertSelected,
  initialCenter = { lat: 39.8283, lng: -98.5795 }, // US center
  initialZoom = 4,
  mapLayer = 'standard'
}) => {
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(initialZoom);
  const [mapReady, setMapReady] = useState(false);

  // Convert alert polygons to map shapes with improved styling
  const mapShapes: MapShape[] = alerts.map(alert => {
    const { id, event, headline, expires } = alert.properties;
    const eventColor = EVENT_COLORS[event as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
    
    // Convert GeoJSON coordinates to Leaflet format
    const coordinates = alert.geometry.coordinates[0].map(coord => [coord[1], coord[0]] as [number, number]);
    
    return {
      id,
      shapeType: MapShapeType.POLYGON,
      color: eventColor,
      fillColor: eventColor,
      fillOpacity: 0.35,
      weight: 2,
      opacity: 0.8,
      positions: [coordinates],
      properties: {
        alertId: id,
        event: event,
        headline: headline,
        expires: expires
      }
    };
  });

  // Create map layers with better styling
  const mapLayers: MapLayer[] = [
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

  // Handle map messages
  const handleMapMessage = useCallback((message: WebviewLeafletMessage) => {
    if (!message.event) return;
    
    // Handle map ready event
    if (message.event === WebViewLeafletEvents.MAP_READY) {
      setMapReady(true);
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
                onAlertSelected(alert);
                foundAlert = true;
                break; // Stop after finding the first matching alert
              }
            }
          }
          
          // If no alert was found, clear the selection
          if (!foundAlert) {
            onAlertSelected(null);
          }
        }
      } catch (e) {
        console.error('Error checking if point in polygon', e);
      }
    }
    
    // Handle map moved events
    if (message.event === WebViewLeafletEvents.ON_MOVE_END && message.payload) {
      try {
        const mapState = message.payload as any;
        if (mapState.center) {
          setMapCenter(mapState.center);
        }
        if (mapState.zoom) {
          setZoom(mapState.zoom);
        }
      } catch (e) {
        console.error('Error handling map move event', e);
      }
    }
  }, [alerts, onAlertSelected]);

  // This effect is crucial - it updates the zoom level when props change
  useEffect(() => {
    if (initialZoom !== zoom) {
      setZoom(initialZoom);
    }
  }, [initialZoom]);

  return (
    <View style={styles.container}>
      <LeafletView
        mapLayers={mapLayers}
        mapShapes={mapShapes}
        mapCenterPosition={mapCenter}
        zoom={zoom}
        doDebug={false}
        onMessageReceived={handleMapMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default NativeAlertMap;
