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
      margin-top: 80px !important; /* Add space below header */
      margin-left: 10px !important;
    }
    
    .leaflet-control-zoom a {
      border-radius: 50% !important;
      color: #2980b9 !important;
      background: white !important;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
      width: 32px !important;
      height: 32px !important;
      line-height: 32px !important;
      font-weight: bold !important;
      text-align: center !important;
      transition: all 0.2s ease-in-out !important;
    }
    
    .leaflet-control-zoom a:hover {
      background: #f8f9fa !important;
      color: #3498db !important;
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
  </style>
</head>
<body>
  <!-- Loading indicator -->
  <div class="map-loading" id="loading">
    <div class="loading-spinner"></div>
    <span>Loading map...</span>
  </div>

  <div id="map"></div>
  
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
      zoomControl: false, // Default to false, will be controlled through message
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

    // Add the standard layer to map
    standard.addTo(map);
    
    // Don't add layer control since we're handling it in React
    
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
            
            // Remove these popup and hover behaviors
            // const popupContent = createPopupContent(properties);
            // polygon.bindPopup(popupContent);
            
            // Remove hover effect handlers
            // polygon.on('mouseover', function() { ... });
            // polygon.on('mouseout', function() { ... });
            
            // Keep only the click handler
            polygon.on('click', function(e) {
              // Set flag to prevent map click from triggering
              clickedInsidePolygon = true;
              
              // Close any open popups
              map.closePopup();
              
              // Send message to React Native or parent
              (window.ReactNativeWebView || window.parent).postMessage(JSON.stringify({
                type: 'ALERT_SELECTED',
                alertId: properties.id
              }));
              
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
      setTimeout(() => {
        if (!clickedInsidePolygon) {
          map.closePopup();
          (window.ReactNativeWebView || window.parent).postMessage(JSON.stringify({
            type: 'CLICK_OUTSIDE'
          }));
        }
        clickedInsidePolygon = false;
      }, 10);
    });
    
    // Hide loading indicator when map is ready
    map.on('load', function() {
      console.log('Map loaded successfully!');
      document.getElementById('loading').style.display = 'none';
      
      // Wait a short time then notify parent we're ready
      setTimeout(() => {
        console.log('Sending MAP_READY message');
        (window.ReactNativeWebView || window.parent).postMessage(JSON.stringify({
          type: 'MAP_READY'
        }), '*');  // Add origin for web
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
            
            // Configure zoom control based on parameter
            if (map.zoomControl) {
              if (data.zoomControl === false) {
                map.zoomControl.remove();
              }
            } else if (data.zoomControl === true) {
              L.control.zoom().addTo(map);
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
            // Find and highlight the specific alert
            alertsData.forEach(function(alert) {
              if (alert.properties.id === data.alertId) {
                // Find the corresponding layer
                map.eachLayer(function(layer) {
                  if (layer instanceof L.Polygon && layer.options && layer.options.alertId === data.alertId) {
                    // Zoom to the alert
                    map.fitBounds(layer.getBounds(), { padding: [50, 50] });
                    
                    // Highlight the alert
                    layer.setStyle({
                      weight: 4,
                      opacity: 1.0,
                      fillOpacity: 0.6
                    });
                    
                    // Remove this line that opens a Leaflet popup
                    // layer.openPopup();
                  }
                });
              }
            });
            break;

          case 'ZOOM_IN':
            // Get current zoom and increment by 1, max of 18
            const currentZoomIn = map.getZoom();
            const newZoomIn = Math.min(currentZoomIn + 1, 18);
            map.setZoom(newZoomIn);
            break;
            
          case 'ZOOM_OUT':
            // Get current zoom and decrement by 1, min of 3
            const currentZoomOut = map.getZoom();
            const newZoomOut = Math.max(currentZoomOut - 1, 3);
            map.setZoom(newZoomOut);
            break;
        }
      } catch (e) {
        console.error('Error handling message:', e);
      }
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
