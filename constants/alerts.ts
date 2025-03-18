import { AlertEvent as ImportedAlertEvent, AlertSeverity } from '../types/alerts';

export enum AlertEvent {
  TestTornadoWarning = 'Test Tornado Warning',
  TornadoWarning = 'Tornado Warning',
  FlashFloodWarning = 'Flash Flood Warning',
  FlashFloodStatement = 'Flash Flood Statement',
  FloodWarning = 'Flood Warning',
  FloodStatement = 'Flood Statement',
  SevereThunderstormWarning = 'Severe Thunderstorm Warning',
  SpecialMarineWarning = 'Special Marine Warning',
  SevereWeatherStatement = 'Severe Weather Statement',
  SnowSquallWarning = 'Snow Squall Warning',
  DustStormWarning = 'Dust Storm Warning',
  DustStormAdvisory = 'Dust Storm Advisory',
  ExtremeWindWarning = 'Extreme Wind Warning',
}

// Alert severities and their corresponding colors
export const SEVERITY_COLORS = {
  extreme: '#d63031', // Deep red
  severe: '#e67e22',  // Orange
  moderate: '#f39c12', // Yellow-orange
  minor: '#27ae60',   // Green
  unknown: '#7f8c8d', // Gray
};

// Update alert event types with colors from weather.gov
export const EVENT_COLORS = {
  'Tornado Warning': '#FF0000',        // Red (priority 2)
  'Flash Flood Warning': '#8B0000',    // Darkred (priority 5)
  'Flash Flood Statement': '#8B0000',  // Darkred (priority 6)
  'Severe Thunderstorm Warning': '#FFA500', // Orange (priority 4)
  'Flood Warning': '#00FF00',          // Green (priority 43)
  'Flood Statement': '#00FF00',        // Green (priority 44)
  'Special Marine Warning': '#FFA500', // Orange (priority 21)
  'Severe Weather Statement': '#00FFFF', // Aqua (priority 7)
  'Snow Squall Warning': '#C71585',    // Mediumvioletred (priority 23)
  'Dust Storm Warning': '#FFE4C4',     // Bisque (priority 28)
  'Extreme Wind Warning': '#FF8C00',   // Darkorange (priority 3)
  'Test Tornado Warning': '#F0FFFF',   // Azure (using Test color, priority 109)
  'Dust Storm Advisory': '#BDB76B',    // Darkkhaki (priority 73)
  default: '#95a5a6',                  // Default gray
};

// Alert types that should be shown in the app (priority alerts)
export const FILTERED_ALERT_TYPES = [
  'Tornado Warning',
  'Flash Flood Warning',
  'Flash Flood Statement',
  'Severe Thunderstorm Warning',
  'Flood Warning',
  'Flood Statement',
  'Special Marine Warning',
  'Severe Weather Statement',
  'Snow Squall Warning',
  'Dust Storm Warning',
  'Extreme Wind Warning',
  'Test Tornado Warning',
];

// Alert refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  FOREGROUND: 60000,  // 1 minute when app is in foreground
  BACKGROUND: 300000, // 5 minutes when app is in background
  ERROR: 15000,       // 15 seconds after an error
};

// Map settings
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 39.8283, lng: -98.5795 }, // US center
  DEFAULT_ZOOM: 4,
  MAX_ZOOM: 18,
  MIN_ZOOM: 3,
};

// Alert popup display options
export const ALERT_POPUP_OPTIONS = {
  MAX_HEADLINE_LENGTH: 80, // Maximum characters to show in popup headline
  TRUNCATE_SUFFIX: '...',  // Suffix to add when truncating text
};
