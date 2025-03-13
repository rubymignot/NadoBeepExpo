export const leafletMapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  
  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" />
  
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    #map {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
    }
    
    /* Custom map styles */
    .leaflet-container {
      background-color: #f2f6f9;
    }
    
    .leaflet-popup-content-wrapper {
      border-radius: 8px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.2);
      overflow: hidden;
      padding: 0;
    }
    
    .leaflet-popup-content {
      margin: 0;
      width: 250px !important;
      padding: 0;
    }
    
    .leaflet-popup-tip {
      box-shadow: 0 3px 12px rgba(0,0,0,0.2);
    }
    
    /* Mini popup styling */
    .mini-popup .leaflet-popup-content-wrapper {
      background: transparent;
      box-shadow: none;
    }
    
    .mini-popup .leaflet-popup-content {
      margin: 0;
      padding: 0;
    }
    
    .mini-popup .leaflet-popup-tip-container {
      display: none;
    }
    
    /* Popup content styling */
    .popup-header {
      padding: 8px 10px;
      color: white;
      font-weight: bold;
    }
    
    .popup-content {
      padding: 10px;
      background: white;
    }
    
    .popup-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .alert-badge {
      display: inline-block;
      padding: 2px 6px;
      color: white;
      font-size: 10px;
      font-weight: bold;
      border-radius: 3px;
      margin-bottom: 5px;
    }
    
    .popup-desc {
      font-size: 12px;
      color: #333;
      margin-bottom: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* Map Attribution styling */
    .leaflet-control-attribution {
      background: rgba(255,255,255,0.8) !important;
      font-size: 10px !important;
      padding: 3px 5px !important;
    }
    
    /* Zoom control styling */
    .leaflet-control-zoom {
      margin-top: 20px !important; /* Add space below header */
      margin-left: 10px !important;
    }
    
    /* Loading indicator */
    .map-loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255,255,255,0.9);
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }
    
    .loading-spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
      margin-right: 10px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Layer control styling */
    .leaflet-control-layers {
      border-radius: 6px !important;
      box-shadow: 0 1px 5px rgba(0,0,0,0.2) !important;
      margin-top: 80px !important; /* Add space below header */
    }
    
    .leaflet-control-layers-toggle {
      background-size: 20px 20px !important;
      width: 36px !important;
      height: 36px !important;
    }
    
    .leaflet-touch .leaflet-control-layers-toggle {
      width: 40px !important;
      height: 40px !important;
    }
    
    /* Smart popup positioning - corrects popup position when near edges */
    .leaflet-popup {
      margin-bottom: 30px !important; /* Add space below popup */
    }

    /* Radar legend */
    .radar-legend {
      position: absolute;
      bottom: 20px;
      right: 10px;
      background: white;
      border-radius: 4px;
      padding: 6px 10px;
      box-shadow: 0 1px 5px rgba(0,0,0,0.2);
      z-index: 1000;
      font-size: 10px;
      display: block; /* Visible by default */
    }
    
    .radar-legend-title {
      font-weight: bold;
      margin-bottom: 4px;
      text-align: center;
    }
    
    .radar-legend-scale {
      display: flex;
      height: 10px;
      width: 120px;
      margin-bottom: 4px;
    }
    
    .radar-legend-scale div {
      flex: 1;
      height: 100%;
    }
    
    .radar-legend-labels {
      display: flex;
      justify-content: space-between;
      width: 120px;
      font-size: 8px;
    }
    }
  </style>
</head>
<body>
  <!-- Loading indicator -->
  <div class="map-loading" id="loading">
    <div class="loading-spinner"></div>
    <span>Loading map...</span>
  </div>

  <div id="map"></div>
  
  <!-- Add radar legend - always visible -->
  <div class="radar-legend" id="radar-legend">
    <div class="radar-legend-title">Radar Reflectivity (dBZ)</div>
    <div class="radar-legend-scale">
      <div style="background-color: #00FFFF;"></div>
      <div style="background-color: #00C8FF;"></div>
      <div style="background-color: #0096FF;"></div>
      <div style="background-color: #0064FF;"></div>
      <div style="background-color: #00FF00;"></div>
      <div style="background-color: #00C800;"></div>
      <div style="background-color: #009600;"></div>
      <div style="background-color: #FFFF00;"></div>
      <div style="background-color: #E6E600;"></div>
      <div style="background-color: #FF9600;"></div>
      <div style="background-color: #FF0000;"></div>
      <div style="background-color: #D60000;"></div>
    </div>
    <div class="radar-legend-labels">
      <span>5</span>
      <span>20</span>
      <span>35</span>
      <span>50</span>
      <span>65+</span>
    </div>
  </div>
  
  <!-- Leaflet JS -->
  <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
  
  <script>
    // Global variable to track if click was inside a polygon
    let clickedInsidePolygon = false;
    
    // Initialize map
    const map = L.map('map', {
      center: [39.8283, -98.5795], // Default center: US
      zoom: 4,
      attributionControl: true,
      zoomControl: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      dragging: true,
      zoomAnimation: true
    });

    // Define base layers with better styling
    const standard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      maxNativeZoom: 18
    });
    
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
      maxNativeZoom: 18
    });
    
    const dark = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
      maxZoom: 19,
      maxNativeZoom: 18
    });

    // Add radar reflectivity layer with improved settings
    let radarLayer = L.tileLayer.wms("https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows", {
      layers: 'conus_bref_qcd',
      format: 'image/png',
      transparent: true,
      opacity: 0.7,
      version: '1.3.0',
      attribution: '© NOAA',
      zIndex: 50, // Ensure radar stays above base map
      updateWhenIdle: false, // Continue updating when moving
      updateInterval: 200, // Throttle to prevent too many requests
      crossOrigin: true // Better caching
    });
    
    // Add the standard layer to map
    standard.addTo(map);
    
    // Add radar layer by default
    radarLayer.addTo(map);
    
    // Remove all previous radar refresh interval and refresh functions
    // Start a simple radar refresh interval similar to Android's logic
// Start a simple radar refresh interval similar to Android's logic
setInterval(function() {
  if (map.hasLayer(radarLayer)) {
    const newTimestamp = new Date().getTime();
    // Create new URL with timestamp to prevent caching
    const newUrl = "https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?_ts=" + newTimestamp;
    
    // Remove the existing radar layer
    map.removeLayer(radarLayer);
    
    // Create a fresh radar layer with the updated URL
    radarLayer = L.tileLayer.wms(newUrl, {
      layers: 'conus_bref_qcd',
      format: 'image/png',
      transparent: true,
      opacity: 0.7,
      version: '1.3.0',
      attribution: '© NOAA',
      zIndex: 50,
      updateWhenIdle: false,
      updateInterval: 200,
      crossOrigin: true
    });
    
    // Add the fresh layer to the map
    radarLayer.addTo(map);
  }
}, 60000); // 60 seconds

    
    // Initialize alerts data
    let alertsData = [];
    
    // Function to create a custom popup content
    function createPopupContent(properties) {
      const color = properties.color || '#e74c3c';
      const title = properties.headline || 'Alert';
      const description = properties.areaDesc || '';
      const severity = properties.severity || 'Unknown';
      
      return \`
        <div>
          <div class="popup-header" style="background-color: \${color}">
            \${properties.event}
          </div>
          <div class="popup-content">
            <div class="popup-title">\${title}</div>
            <span class="alert-badge" style="background-color: \${color}">\${severity}</span>
            <div class="popup-desc">\${description}</div>
          </div>
        </div>
      \`;
    }
    
    // Function to add alerts to the map
    function addAlertsToMap(alerts) {
      // Store alerts data for reference
      alertsData = alerts;
      
      // Clear existing alerts
      map.eachLayer(function(layer) {
        if (layer instanceof L.Polygon) {
          map.removeLayer(layer);
        }
      });
      
      // Add each alert to the map
      alerts.forEach(function(alert) {
        try {
          if (alert.geometry && alert.geometry.type === 'Polygon') {
            const coordinates = alert.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            const properties = alert.properties;
            const color = properties.color || '#e74c3c';
            
            const polygon = L.polygon(coordinates, {
              color: color,
              weight: 2,
              opacity: 0.8,
              fillColor: color,
              fillOpacity: 0.35,
              alertId: properties.id
            }).addTo(map);
            
            // Keep only the click handler
            polygon.on('click', function(e) {
              // Set flag to prevent map click from triggering
              clickedInsidePolygon = true;
              
              // Close any open popups
              map.closePopup();
              
              // Send message to React Native or parent - ensure it's a string
              const message = JSON.stringify({
                type: 'ALERT_SELECTED',
                alertId: properties.id,
                fromMapClick: true // Add flag to indicate this came from map click
              });
              
              // Send as string to ensure consistent format
              (window.ReactNativeWebView || window.parent).postMessage(message, '*');
              
              // Prevent propagation to avoid triggering map click
              L.DomEvent.stopPropagation(e);
            });
          }
        } catch (e) {
          console.error('Error adding alert to map:', e);
        }
      });
    }
    
    // Function to change the base map layer
    function changeMapLayer(layerName) {
      // Remove all current base layers
      if (map.hasLayer(standard)) map.removeLayer(standard);
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (map.hasLayer(dark)) map.removeLayer(dark);
      
      // Add the selected layer
      if (layerName === 'standard') {
        map.addLayer(standard);
      } else if (layerName === 'satellite') {
        map.addLayer(satellite);
      } else if (layerName === 'dark') {
        map.addLayer(dark);
      }
    }
    
    // Handle map click to close popups when clicking outside polygons
    map.on('click', function(e) {
      // Reset the flag immediately to avoid race conditions
      const wasClickedInsidePolygon = clickedInsidePolygon;
      clickedInsidePolygon = false;
      
      // If we didn't click inside a polygon, send a message to clear selection
      if (!wasClickedInsidePolygon) {
        // Close any open popups
        map.closePopup();
        
        // Clear all polygon highlights when clicking outside
        map.eachLayer(function(layer) {
          if (layer instanceof L.Polygon) {
            layer.setStyle({
              weight: 2,
              opacity: 0.8, 
              fillOpacity: 0.35
            });
          }
        });
        
        // Send message to React Native to clear selection
        console.log("Map: Clicked outside polygons, clearing selection");
        const message = JSON.stringify({
          type: 'CLICK_OUTSIDE',
          clearSelection: true
        });
        (window.ReactNativeWebView || window.parent).postMessage(message, '*');
      }
    });
    
    // Hide loading indicator when map is ready
    map.on('load', function() {
      console.log('Map loaded successfully!');
      document.getElementById('loading').style.display = 'none';
      
      // Wait a short time then notify parent we're ready
      setTimeout(() => {
        console.log('Sending MAP_READY message');
        const message = JSON.stringify({
          type: 'MAP_READY'
        });
        (window.ReactNativeWebView || window.parent).postMessage(message, '*');  // Add origin for web
      }, 500);
    });
    
    // Add additional debugging 
    window.addEventListener('message', function(event) {
      console.log('Map received message:', event.data);
      handleMessage(event);
    });

    // Notify React Native when map is ready - changed to use the map load event instead
    window.onload = function() {
      console.log('Window loaded');
      // Already sending message in the map load event
    };
    
    // Handle messages from React Native
    function handleMessage(message) {
      try {
        const data = JSON.parse(message.data);
        
        switch (data.type) {
          case 'INITIALIZE_MAP':
            addAlertsToMap(data.alerts);
            
            // Check if we need to change the layer
            if (data.layer && data.layer !== 'standard') {
              changeMapLayer(data.layer);
            }
            
            // Hide loading indicator if still visible
            document.getElementById('loading').style.display = 'none';
            break;
            
          case 'CHANGE_LAYER':
            changeMapLayer(data.layer);
            break;
            
          case 'SET_CENTER':
            map.setView([data.lat, data.lng], data.zoom || map.getZoom());
            break;
          
          case 'HIGHLIGHT_ALERT':
            // Use the enhanced highlight function
            highlightAlert(data.alertId, data.urlNavigation === true);
            break;

          // Remove ZOOM_IN and ZOOM_OUT cases as we'll use native controls
          // case 'ZOOM_IN':
          //   const currentZoomIn = map.getZoom();
          //   const newZoomIn = Math.min(currentZoomIn + 1, 18);
          //   map.setZoom(newZoomIn);
          //   break;
            
          // case 'ZOOM_OUT':
          //   const currentZoomOut = map.getZoom();
          //   const newZoomOut = Math.max(currentZoomOut - 1, 3);
          //   map.setZoom(newZoomOut);
          //   break;

          case 'TOGGLE_RADAR':
            // Toggle radar visibility
            const shouldShow = data.visible !== undefined ? data.visible : !map.hasLayer(radarLayer);
            if (shouldShow && !map.hasLayer(radarLayer)) {
              radarLayer.addTo(map);
              document.getElementById('radar-legend').style.display = 'block';
            } else if (!shouldShow && map.hasLayer(radarLayer)) {
              map.removeLayer(radarLayer);
              document.getElementById('radar-legend').style.display = 'none';
            }
            break;
        }
      } catch (e) {
        console.error('Error handling message:', e);
      }
    }

    // Enhanced highlight alert handler with smoother transitions
    function highlightAlert(alertId, shouldZoom) {
      // Reset all polygons first
      map.eachLayer(function(layer) {
        if (layer instanceof L.Polygon) {
          layer.setStyle({
            weight: 2,
            opacity: 0.8, 
            fillOpacity: 0.35
          });
        }
      });
      
      // Find and highlight the specific alert
      alertsData.forEach(function(alert) {
        if (alert.properties.id === alertId) {
          // Find the corresponding layer
          map.eachLayer(function(layer) {
            if (layer instanceof L.Polygon && layer.options && layer.options.alertId === alertId) {
              // Apply highlight style
              layer.setStyle({
                weight: 4,
                opacity: 1.0,
                fillOpacity: 0.6
              });
              
              // Only zoom if explicitly requested
              if (shouldZoom) {
                console.log("Zooming to alert with enhanced padding");
                // Use better padding for mobile view
                const isMobile = window.innerWidth < 768;
                const padding = isMobile ? [60, 60] : [100, 100];
                map.fitBounds(layer.getBounds(), { 
                  padding: padding,
                  maxZoom: 10,  // Limit max zoom to avoid zooming too far
                  animate: true, // Smooth animation
                  duration: 0.5  // Animation duration in seconds
                });
              }
            }
          });
        }
      });
    }
    
    // Set up message listener
    window.addEventListener('message', handleMessage);
    
    // Notify React Native when map is ready
    window.onload = function() {
      (window.ReactNativeWebView || window.parent).postMessage(JSON.stringify({
        type: 'MAP_READY'
      }));
    };
  </script>
</body>
</html>
`;
