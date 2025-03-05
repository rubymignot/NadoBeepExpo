import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from '../types/alerts';

interface AlertsContextType {
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  addTemporaryAlert: (alert: Alert, durationMs: number) => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [temporaryAlerts, setTemporaryAlerts] = useState<Alert[]>([]);
  
  // Combine regular and temporary alerts
  const allAlerts = [...alerts, ...temporaryAlerts];
  
  // Function to add a temporary alert that auto-dismisses
  const addTemporaryAlert = (alert: Alert, durationMs: number) => {
    setTemporaryAlerts(prev => [...prev, alert]);
    
    // Set a timeout to remove the alert after the specified duration
    setTimeout(() => {
      setTemporaryAlerts(prev => prev.filter(a => a.properties.id !== alert.properties.id));
    }, durationMs);
  };
  
  const value = {
    alerts: allAlerts,
    setAlerts,
    addTemporaryAlert
  };
  
  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
}
