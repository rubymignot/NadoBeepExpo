import { AlertEvent, AlertSeverity } from '../types/alerts';

export const FILTERED_ALERT_TYPES = Object.values(AlertEvent);

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  [AlertSeverity.Extreme]: '#7b241c',
  [AlertSeverity.Severe]: '#c0392b',
  [AlertSeverity.Moderate]: '#e67e22',
  [AlertSeverity.Minor]: '#f1c40f',
  [AlertSeverity.Unknown]: '#7f8c8d',
};

export const EVENT_COLORS: Record<AlertEvent | 'default', string> = {
    [AlertEvent.TornadoWarning]: '#7b241c',
    [AlertEvent.FlashFloodWarning]: '#1a5276',
    [AlertEvent.SevereThunderstormWarning]: '#6c3483',
    default: '#2c3e50',
    [AlertEvent.TestTornadoWarning]: ''
};
