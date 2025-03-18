import React, { useState, useEffect, useCallback, useRef } from 'react';
// Remove ZoomIn and ZoomOut from import
import { View, Text, Platform, ActivityIndicator, Image, TouchableOpacity, Dimensions, StyleSheet, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, RefreshCw, X, ExternalLink, MapPin, Layers, CloudRain } from 'lucide-react-native';

// Import types
import { Alert } from '@/types/alerts';

// Import the alerts service
import { fetchAlerts } from '@/services/alertsService';

// Import theme
import { useTheme } from '@/context/ThemeContext';
import { SEVERITY_COLORS, EVENT_COLORS } from '@/constants/alerts';
import { getRelativeTime } from '@/utils/dateUtils';

const APP_ICON = require('../../assets/images/android/mipmap-xxxhdpi/ic_launcher_foreground.png');
const windowWidth = Dimensions.get('window').width;

// Add this unified import:
import MapComponent from '@/components/Map';

export default function MapScreen() {
  const router = useRouter();
  const { isDarkMode, colors } = useTheme();
  const isWeb = Platform.OS === 'web';
  // Get URL parameters
  const { alert: focusAlertId, zoom: shouldZoom } = useLocalSearchParams();

  // Initial map settings
  const initialCenter = { lat: 39.8283, lng: -98.5795 }; // US center
  const initialZoom = 4;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showLayerControl, setShowLayerControl] = useState(false);
  const [mapLayer, setMapLayer] = useState('standard');
  // Remove currentZoom state that was used for custom zoom controls
  // const [currentZoom, setCurrentZoom] = useState(initialZoom);
  // Add state for radar visibility
  const [radarVisible, setRadarVisible] = useState(true);

  // Create a ref for the map component
  const mapRef = React.useRef<any>(null);

  // Load alerts when component mounts
  const loadAlerts = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const alertsData = await fetchAlerts();
      setAlerts(alertsData);
      setLastUpdate(new Date());
      setError(null);
      
      // We'll let the useEffect handle the focus instead of calling a separate function
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial load and refresh timer
  useEffect(() => {
    loadAlerts();
    
    // Set up polling interval to refresh alerts
    const intervalId = setInterval(async () => {
      try {
        console.log('Refreshing alerts...');
        const alertsData = await fetchAlerts();
        setAlerts(alertsData);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error refreshing alerts:', err);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, []);
  
  // Clean reset function for when navigating away and back
  useEffect(() => {
    // Reset state when coming back to the map screen
    return () => {
      setSelectedAlert(null);
    };
  }, []);

  // Effect to handle URL parameter changes
  useEffect(() => {
    // Only process when alerts are loaded and we have a focusAlertId
    if (alerts.length > 0 && focusAlertId && typeof focusAlertId === 'string') {
      // Avoid re-selecting the same alert if it's already selected
      if (!selectedAlert || selectedAlert.properties.id !== focusAlertId) {
        const alertToFocus = alerts.find(a => a.properties.id === focusAlertId);
        if (alertToFocus) {
          setSelectedAlert(alertToFocus);
          if (mapRef.current) {
            setTimeout(() => {
              // Check if zoom parameter was provided and is "true"
              const shouldZoomToAlert = shouldZoom === "true" || shouldZoom === "1";
              console.log(`Highlighting alert ${focusAlertId}, zoom: ${shouldZoomToAlert}`);
              
              // Explicitly set as boolean true/false for Android compatibility
              mapRef.current.postMessage(JSON.stringify({
                type: 'HIGHLIGHT_ALERT',
                alertId: focusAlertId,
                urlNavigation: shouldZoomToAlert ? true : false,
                platform: Platform.OS // Add platform info to help debugging
              }));
            }, 500); // Reduced delay for better responsiveness
          }
        }
      }
    } else if (!focusAlertId && selectedAlert) {
      // Clear selection when URL param is removed
      setSelectedAlert(null);
    }
  }, [focusAlertId, shouldZoom, alerts, selectedAlert]);
  
  // Handle alert selection from the map
  const handleAlertSelected = (alert: Alert | null) => {
    setSelectedAlert(alert);
    
    // Update URL if an alert was selected (not for clearing)
    if (alert) {
      router.setParams({ alert: alert.properties.id, zoom: 'false' });
    } else if (focusAlertId) {
      router.replace('/map');
    }
  };

  // Handle refresh when loading fails or manual refresh
  const handleRefresh = useCallback(() => {
    loadAlerts(true);
  }, []);

  // Toggle layer control dropdown
  const toggleLayerControl = () => {
    setShowLayerControl(prev => !prev);
  };

  // Change map layer
  const changeMapLayer = (layer: string) => {
    setMapLayer(layer);
    setShowLayerControl(false);
    
    // Send message to map components - use mapRef instead of webMapRef
    if (mapRef.current) {
      mapRef.current.postMessage(JSON.stringify({
        type: 'CHANGE_LAYER',
        layer: layer
      }));
    }
  };

  // Go to alert details
  const handleViewDetails = () => {
    if (selectedAlert) {
      router.push({
        pathname: '/alert-details',
        params: { alertId: selectedAlert.properties.id }
      });
    }
  };

  // Close popup and clear URL - improved to prevent refresh loops
  const handleClosePopup = useCallback(() => {
    // First check if we actually need to do anything
    if (!selectedAlert) return;
    
    // Clear the selected alert state
    setSelectedAlert(null);
    
    // Clear the URL parameter if needed
    if (focusAlertId) {
      router.replace('/map');
    }
  }, [focusAlertId, router, selectedAlert]);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    return SEVERITY_COLORS[severity.toLowerCase() as keyof typeof SEVERITY_COLORS] || 
      SEVERITY_COLORS.unknown;
  };

  // Get event color
  const getEventColor = (event: string) => {
    return EVENT_COLORS[event as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
  };

  // Create a ref only for WebView, not for native
  const webMapRef = React.useRef<any>(null);

  // Add toggle radar function
  const toggleRadar = useCallback(() => {
    // Toggle the radar state
    setRadarVisible(prev => {
      const newValue = !prev;
      console.log("Toggling radar to:", newValue);
      
      // Send message to map component
      if (mapRef.current) {
        console.log("Sending TOGGLE_RADAR message to map component");
        mapRef.current.postMessage(JSON.stringify({
          type: 'TOGGLE_RADAR',
          visible: newValue
        }));
      }
      
      return newValue;
    });
  }, []);

  // This function can be used elsewhere in your app to create links to the map
  // with specific alerts and zoom behavior
  const createMapLink = (alertId: string, shouldZoom: boolean = false) => {
    return `/map?alert=${alertId}${shouldZoom ? '&zoom=true' : ''}`;
  };

  return (
    <View style={mapStyles.container}>
      {/* Status bar with theme-appropriate styling */}
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent" 
        translucent={true} 
      />
      
      {/* Blue header with controls - FIXED HEIGHT */}
      <View style={mapStyles.header}>
        <View style={mapStyles.headerLeft}>
          <Image
            source={APP_ICON}
            style={mapStyles.headerLogo}
            defaultSource={APP_ICON}
          />
          <Text style={mapStyles.headerTitle}>Map</Text>
        </View>
        
        <View style={mapStyles.headerRight}>
          {/* Add Radar Toggle Button */}
          <TouchableOpacity 
            style={[mapStyles.iconButton, radarVisible && mapStyles.activeIconButton]} 
            onPress={toggleRadar}
            disabled={loading}
          >
            <CloudRain size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[mapStyles.iconButton, refreshing && mapStyles.refreshingButton]} 
            onPress={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw 
              size={20} 
              color="#fff" 
              style={refreshing ? mapStyles.spinningIcon : undefined}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={mapStyles.iconButton}
            onPress={toggleLayerControl}
          >
            <Layers size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Map View in its own container below the fixed header */}
      <View style={mapStyles.mapContainer}>
        {loading && !refreshing ? (
          <View style={mapStyles.centeredContainer}>
            <ActivityIndicator size="large" color="#2980b9" />
            <Text style={mapStyles.loadingText}>Loading map...</Text>
          </View>
        ) : error ? (
          <View style={mapStyles.centeredContainer}>
            <AlertTriangle size={50} color="#e74c3c" />
            <Text style={mapStyles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={mapStyles.retryButton}
              onPress={() => loadAlerts()}
            >
              <Text style={mapStyles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Map component fills entire container without position:absolute
          <View style={mapStyles.fullSize}>
            <MapComponent
              ref={mapRef}
              alerts={alerts}
              onAlertSelected={handleAlertSelected}
              initialCenter={initialCenter}
              initialZoom={Platform.OS === 'android' ? undefined : initialZoom} 
              mapLayer={mapLayer}
            />
          </View>
        )}
      </View>
      
      {/* Layer selection dropdown */}
      {showLayerControl && (
        <View style={mapStyles.layerDropdown}>
          <TouchableOpacity 
            style={[mapStyles.layerOption, mapLayer === 'standard' && mapStyles.activeLayer]} 
            onPress={() => changeMapLayer('standard')}
          >
            <Text style={mapStyles.layerText}>Standard</Text>
            {mapLayer === 'standard' && <View style={mapStyles.activeDot} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[mapStyles.layerOption, mapLayer === 'satellite' && mapStyles.activeLayer]} 
            onPress={() => changeMapLayer('satellite')}
          >
            <Text style={mapStyles.layerText}>Satellite</Text>
            {mapLayer === 'satellite' && <View style={mapStyles.activeDot} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[mapStyles.layerOption, mapLayer === 'dark' && mapStyles.activeLayer]} 
            onPress={() => changeMapLayer('dark')}
          >
            <Text style={mapStyles.layerText}>Dark Mode</Text>
            {mapLayer === 'dark' && <View style={mapStyles.activeDot} />}
          </TouchableOpacity>
        </View>
      )}
      
      {/* Small popup that appears on alert selection */}
      {selectedAlert && (
        <View style={mapStyles.alertPopupContainer} pointerEvents="box-none">
          <View style={mapStyles.alertPopup}>
            <View style={[
              mapStyles.colorAccent, 
              {backgroundColor: getEventColor(selectedAlert.properties.event)}
            ]} />
            <View style={mapStyles.popupContent}>
              <View style={mapStyles.popupTopRow}>
                <View style={mapStyles.eventInfoContainer}>
                  <View style={[
                    mapStyles.colorDot, 
                    {backgroundColor: getEventColor(selectedAlert.properties.event)}
                  ]} />
                  <Text style={[
                    mapStyles.popupEventType, 
                    {color: '#444'}
                  ]}>
                    {selectedAlert.properties.event}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={mapStyles.closeButton} 
                  onPress={handleClosePopup}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <X size={16} color="#888" />
                </TouchableOpacity>
              </View>
              
              <Text style={mapStyles.popupHeadline} numberOfLines={2}>
                {selectedAlert.properties.headline}
              </Text>
              
              <View style={mapStyles.locationRow}>
                <MapPin size={12} color="#7f8c8d" style={mapStyles.locationIcon} />
                <Text style={mapStyles.popupLocation} numberOfLines={1}>
                  {selectedAlert.properties.areaDesc}
                </Text>
              </View>
              
              <View style={mapStyles.timeRow}>
                <Text style={mapStyles.timeLabel}>Issued:</Text>
                <Text style={mapStyles.timeValue}>
                  {getRelativeTime(new Date(selectedAlert.properties.sent))}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  mapStyles.detailsButton, 
                  {
                    backgroundColor: '#f8f8f8',
                    borderWidth: 1,
                    borderColor: '#ddd'
                  }
                ]}
                onPress={handleViewDetails}
              >
                <Text style={[
                  mapStyles.detailsButtonText, 
                  {color: '#555'}
                ]}>
                  View Details
                </Text>
                <ExternalLink 
                  size={14} 
                  color="#555" 
                  style={mapStyles.detailsIcon} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Map-specific styles
const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Updated header style - NOT floating/absolute positioned
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : Platform.OS === 'android' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#34495e',
    height: Platform.OS === 'ios' ? 100 : Platform.OS === 'android' ? 100 : 70,
  },
  // Map container positioned below header, not overlapped
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  fullSize: {
    flex: 1,
  },
  // Remove floatingHeader style, which was causing overlap problems
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 80,
    height: 80,
    marginRight: -10
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: Platform.OS === 'ios' ? undefined : 'Inter-Bold',
  },
  iconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  refreshingButton: {
    opacity: 0.7,
  },
  spinningIcon: {
    opacity: 0.8,
    transform: [{ rotate: '45deg' }],
  },
  // Remove zoom control styles
  // zoomControls: { ... },
  // zoomButton: { ... },
  // Layer dropdown menu
  layerDropdown: {
    position: 'absolute',
    top: 10, // Position from the top of the map container
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 101,
    overflow: 'hidden',
    width: 150,
  },
  layerOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  layerText: {
    fontSize: 14,
    color: '#333',
  },
  activeLayer: {
    backgroundColor: '#e3f2fd',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2980b9',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // UPDATED: Better positioned and styled update info container
  updateInfoContainer: {
    position: 'absolute',
    top: 10, // Position from the top of the map container
    left: 16, // Use left position instead of right
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // Darker background for better contrast
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8, // Rounded corners
    zIndex: 50, // Same z-index as zoom controls
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  updateInfoText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? undefined : 'Inter-Medium',
  },
  alertPopupContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
    zIndex: 1000, // Higher than header
  },
  alertPopup: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
  },
  colorAccent: {
    width: 4,
  },
  popupContent: {
    padding: 16,
    flex: 1,
  },
  popupTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  popupEventType: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? undefined : 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  popupHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? undefined : 'Inter-SemiBold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  popupLocation: {
    fontSize: 12,
    color: '#7f8c8d',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? undefined : 'Inter-Regular',
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 10,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? undefined : 'Inter-Bold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? undefined : 'Inter-Medium',
  },
  timeValue: {
    fontSize: 12,
    color: '#2c3e50',
    fontFamily: Platform.OS === 'ios' ? undefined : 'Inter-Regular',
  },
  detailsButton: {
    backgroundColor: '#3498db',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? undefined : 'Inter-Medium',
  },
  detailsIcon: {
    marginLeft: 2,
  },
  // Add style for active icon button
  activeIconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // More visible background
    borderWidth: 1,
    borderColor: '#ffffff',
  },
});