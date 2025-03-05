import { AlertEvent as ImportedAlertEvent, AlertSeverity } from '../types/alerts';

export enum AlertEvent {
  TestTornadoWarning = 'Test Tornado Warning',
  TornadoWarning = 'Tornado Warning',
  FlashFloodWarning = 'Flash Flood Warning',
  SevereThunderstormWarning = 'Severe Thunderstorm Warning',
  SpecialMarineWarning = 'Special Marine Warning',
}

export const FILTERED_ALERT_TYPES = [
  AlertEvent.TornadoWarning,
  AlertEvent.FlashFloodWarning,
  AlertEvent.SevereThunderstormWarning,
  AlertEvent.SpecialMarineWarning,
];

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  [AlertSeverity.Extreme]: '#7b241c',
  [AlertSeverity.Severe]: '#c0392b',
  [AlertSeverity.Moderate]: '#e67e22',
  [AlertSeverity.Minor]: '#f1c40f',
  [AlertSeverity.Unknown]: '#7f8c8d',
};

export const EVENT_COLORS: Record<ImportedAlertEvent | 'default', string> = {
  [ImportedAlertEvent.TornadoWarning]: '#7b241c',
  [ImportedAlertEvent.FlashFloodWarning]: '#1a5276',
  [ImportedAlertEvent.SevereThunderstormWarning]: '#6c3483',
  [ImportedAlertEvent.SpecialMarineWarning]: '#2980b9',
  default: '#2c3e50',
  [ImportedAlertEvent.TestTornadoWarning]: ''
};
