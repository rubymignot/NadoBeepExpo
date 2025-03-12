export enum AlertSeverity {
  Extreme = 'extreme',
  Severe = 'severe',
  Moderate = 'moderate',
  Minor = 'minor',
  Unknown = 'unknown',
}

// Update the AlertEvent enum to include all county-based products
export enum AlertEvent {
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
  TestTornadoWarning = 'Test Tornado Warning',
}

export interface AlertProperties {
  id: string;
  areaDesc: string;
  headline: string;
  severity: string;
  urgency: string;
  event: string;
  sent: string;
  effective: string;
  expires: string;
  status: string;
  messageType: string;
  category: string;
  certainty: string;
  instruction: string | null;
  description: string;
  onset: string | null;
}

export interface AlertGeometry {
  type: 'Polygon';
  coordinates: Array<Array<[number, number]>>; // [longitude, latitude] pairs
}

export interface Alert {
  geometry: AlertGeometry;
  id: string;
  type: string;
  properties: AlertProperties;
}

export interface AlertsResponse {
  features: Alert[];
}

// Add type guard
export const isValidAlertEvent = (event: string): event is AlertEvent => {
  return Object.values(AlertEvent).includes(event as AlertEvent);
};
