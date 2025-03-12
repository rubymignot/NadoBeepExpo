import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Platform, ActivityIndicator, Image, TouchableOpacity, Dimensions, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, RefreshCw, X, ExternalLink, MapPin, Layers, ZoomIn, ZoomOut } from 'lucide-react-native';

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
  const [currentZoom, setCurrentZoom] = useState(initialZoom);

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
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  // Handle alert selection from the map
  const handleAlertSelected = (alert: Alert | null) => {
    setSelectedAlert(alert);
    if (alert) {
      console.log('Selected alert:', alert.properties.headline);
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
    
    // Send message to map components
    if (isWeb && webMapRef.current) {
      webMapRef.current.postMessage(JSON.stringify({
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

  // Close popup
  const handleClosePopup = () => {
    setSelectedAlert(null);
  };

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

  // Add custom zoom controls that work for both platforms
  const handleZoomIn = () => {
    if (Platform.OS === 'web' && webMapRef.current) {
      webMapRef.current.postMessage(JSON.stringify({
        type: 'ZOOM_IN'
      }));
    } else {
      // For native, we'll just update the state and let the component re-render
      setCurrentZoom(prev => Math.min(prev + 1, 18)); // Max zoom 18
    }
  };

  const handleZoomOut = () => {
    if (Platform.OS === 'web' && webMapRef.current) {
      webMapRef.current.postMessage(JSON.stringify({
        type: 'ZOOM_OUT'
      }));
    } else {
      // For native, we'll just update the state and let the component re-render
      setCurrentZoom(prev => Math.max(prev - 1, 3)); // Min zoom 3
    }
  };

  return (
    <View style={mapStyles.container}>
      {/* Status bar with theme-appropriate styling */}
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent" 
        translucent={true} 
      />
      
      {/* Map View takes full screen */}
      <View style={mapStyles.mapContainer}>
        {loading && !refreshing ? (
          <View style={mapStyles.centeredContainer}>
            <ActivityIndicator size="large" color="#2980b9" />
            <Text style={mapStyles.loadingText}>Loading alerts...</Text>
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
          // Map component fills entire container
          <View style={mapStyles.fullSize}>
            <MapComponent
              ref={webMapRef}
              alerts={alerts}
              onAlertSelected={handleAlertSelected}
              initialCenter={initialCenter}
              initialZoom={currentZoom}
              mapLayer={mapLayer}
            />
          </View>
        )}
        
        {/* Blue header with controls - FIXED HEIGHT */}
        <View style={mapStyles.floatingHeader}>
          <View style={mapStyles.headerLeft}>
            <Image
              source={APP_ICON}
              style={mapStyles.headerLogo}
              defaultSource={APP_ICON}
            />
            <Text style={mapStyles.headerTitle}>Alert Map</Text>
          </View>
          
          <View style={mapStyles.headerRight}>
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
        
        {/* Custom zoom controls - UPDATED POSITION */}
        {!loading && !error && (
          <View style={mapStyles.zoomControls}>
            <TouchableOpacity 
              style={mapStyles.zoomButton} 
              onPress={handleZoomIn}
            >
              <ZoomIn size={20} color="#2980b9" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={mapStyles.zoomButton} 
              onPress={handleZoomOut}
            >
              <ZoomOut size={20} color="#2980b9" />
            </TouchableOpacity>
          </View>
        )}
        
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
        
        {/* Last update indicator */}
        {lastUpdate && !loading && (
          <View style={mapStyles.updateInfoContainer}>
            <Text style={mapStyles.updateInfoText}>
              Last updated {lastUpdate.toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>
      
      {/* Small popup that appears on alert selection */}
      {selectedAlert && (
        <View style={mapStyles.alertPopupContainer} pointerEvents="box-none">
          <View style={mapStyles.alertPopup}>
            <View style={[
              mapStyles.popupHeader, 
              {backgroundColor: getEventColor(selectedAlert.properties.event)}
            ]}>
              <Text style={mapStyles.popupEventType}>
                {selectedAlert.properties.event}
              </Text>
              <TouchableOpacity 
                style={mapStyles.closeButton} 
                onPress={handleClosePopup}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={mapStyles.popupContent}>
              <Text style={mapStyles.popupHeadline} numberOfLines={2}>
                {selectedAlert.properties.headline}
              </Text>
              
              <View style={mapStyles.locationRow}>
                <MapPin size={12} color="#7f8c8d" style={mapStyles.locationIcon} />
                <Text style={mapStyles.popupLocation} numberOfLines={1}>
                  {selectedAlert.properties.areaDesc}
                </Text>
              </View>
              
              <View style={[
                mapStyles.severityBadge,
                {backgroundColor: getSeverityColor(selectedAlert.properties.severity)}
              ]}>
                <Text style={mapStyles.severityText}>
                  {selectedAlert.properties.severity}
                </Text>
              </View>
              
              <View style={mapStyles.timeRow}>
                <Text style={mapStyles.timeLabel}>Issued:</Text>
                <Text style={mapStyles.timeValue}>
                  {getRelativeTime(new Date(selectedAlert.properties.sent))}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={mapStyles.detailsButton}
                onPress={handleViewDetails}
              >
                <Text style={mapStyles.detailsButtonText}>View Details</Text>
                <ExternalLink size={14} color="#fff" style={mapStyles.detailsIcon} />
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  fullSize: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : Platform.OS === 'android' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#2980b9', // Fixed blue color for header
    height: Platform.OS === 'ios' ? 100 : Platform.OS === 'android' ? 100 : 70, // Fixed height for header
    zIndex: 100, // Higher z-index to ensure it's above map controls
  },
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  // Add custom zoom controls that won't be covered by header
  zoomControls: {
    position: 'absolute',
    left: 16,
    top: Platform.OS === 'ios' ? 110 : Platform.OS === 'android' ? 110 : 80, // Position below header
    zIndex: 50, // Lower than layer dropdown but above map
  },
  zoomButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 8,
  },
  // Layer dropdown menu
  layerDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : Platform.OS === 'android' ? 95 : 80, // Position below header
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 101, // Above map but below header
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
    top: Platform.OS === 'ios' ? 110 : Platform.OS === 'android' ? 110 : 80, // Position below header
    right: 16, // Move to right side
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
  },
  popupHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popupEventType: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? undefined : 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  popupContent: {
    padding: 12,
  },
  popupHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
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
});