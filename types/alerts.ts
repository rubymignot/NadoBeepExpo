export enum AlertSeverity {
  Extreme = 'extreme',
  Severe = 'severe',
  Moderate = 'moderate',
  Minor = 'minor',
  Unknown = 'unknown',
}

export enum AlertEvent {
  TornadoWarning = 'Tornado Warning',
  FlashFloodWarning = 'Flash Flood Warning',
  SevereThunderstormWarning = 'Severe Thunderstorm Warning',
  TestTornadoWarning = 'Test Tornado Warning' // Add this line
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
}

export interface Alert {
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
