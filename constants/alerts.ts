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

export const FILTERED_ALERT_TYPES = [
  AlertEvent.TornadoWarning,
  AlertEvent.FlashFloodWarning,
  AlertEvent.FlashFloodStatement,
  AlertEvent.FloodWarning,
  AlertEvent.FloodStatement,
  AlertEvent.SevereThunderstormWarning,
  AlertEvent.SpecialMarineWarning,
  AlertEvent.SevereWeatherStatement,
  AlertEvent.SnowSquallWarning,
  AlertEvent.DustStormWarning,
  AlertEvent.DustStormAdvisory,
  AlertEvent.ExtremeWindWarning,
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
  [ImportedAlertEvent.FlashFloodStatement]: '#2874a6',
  [ImportedAlertEvent.FloodWarning]: '#21618c',
  [ImportedAlertEvent.FloodStatement]: '#2e86c1',
  [ImportedAlertEvent.SevereThunderstormWarning]: '#6c3483',
  [ImportedAlertEvent.SpecialMarineWarning]: '#2980b9',
  [ImportedAlertEvent.SevereWeatherStatement]: '#8e44ad',
  [ImportedAlertEvent.SnowSquallWarning]: '#2c3e50',
  [ImportedAlertEvent.DustStormWarning]: '#d35400',
  [ImportedAlertEvent.DustStormAdvisory]: '#e67e22',
  [ImportedAlertEvent.ExtremeWindWarning]: '#c0392b',
  default: '#2c3e50',
  [ImportedAlertEvent.TestTornadoWarning]: ''
};
