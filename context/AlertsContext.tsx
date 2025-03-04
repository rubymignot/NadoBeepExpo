import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert } from '../types/alerts';

interface AlertsContextType {
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  addTemporaryAlert: (alert: Alert, duration: number) => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addTemporaryAlert = useCallback((alert: Alert, duration: number) => {
    setAlerts(current => {
      // Remove any existing test alerts
      const filtered = current.filter(a => !a.properties.id.startsWith('TEST-'));
      return [...filtered, alert];
    });
    
    setTimeout(() => {
      setAlerts(current => current.filter(a => a.properties.id !== alert.properties.id));
    }, duration);
  }, []);

  return (
    <AlertsContext.Provider value={{ alerts, setAlerts, addTemporaryAlert }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
}
