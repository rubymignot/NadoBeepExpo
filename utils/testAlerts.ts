import { Alert, AlertEvent } from '../types/alerts';

export function createTestTornadoWarning(): Alert {
  const now = new Date();
  const expires = new Date(now.getTime() + 15000); // 15 seconds from now

  return {
    id: 'TEST-' + now.getTime(),
    type: 'Feature',
    properties: {
      id: 'TEST-' + now.getTime(),
      areaDesc: 'Test County, Test State',
      headline: 'TEST - Tornado Warning for Test County',
      severity: 'Extreme',
      urgency: 'Immediate',
      event: AlertEvent.TornadoWarning,
      sent: now.toISOString(),
      effective: now.toISOString(),
      expires: expires.toISOString(),
      status: 'Test',
      messageType: 'Alert',
      category: 'Met',
      certainty: 'Observed',
      instruction: 'TAKE SHELTER NOW - This is only a test.',
      description: 'This is a test tornado warning. No actual severe weather is occurring.'
    }
  };
}
