import { Alert, AlertEvent, AlertsResponse } from '@/types/alerts';
import { FILTERED_ALERT_TYPES } from '@/constants/alerts';

/**
 * Fetches active alerts from the NWS API
 * @returns Promise resolving to an array of Alert objects
 */
export const fetchAlerts = async (): Promise<Alert[]> => {
  try {
    console.log('Fetching alerts from NWS API...');
    
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // Fetch alerts from NWS API
      const response = await fetch('https://api.weather.gov/alerts/active', {
        headers: {
          'User-Agent': '(NadoBeep Weather Alert App)',
        },
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Error fetching alerts: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json() as AlertsResponse;
      console.log(`Received ${data.features?.length || 0} alerts from NWS API`);
      
      // Process and filter alerts
      const processedAlerts = processAlerts(data.features || []);
      return processedAlerts;
    } catch (fetchError) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};

/**
 * Process raw alerts from the API and filter for relevant ones
 * @param alerts Raw alert data from API
 * @returns Filtered and processed Alert objects
 */
const processAlerts = (alerts: Alert[]): Alert[] => {
  // Filter for important alerts with polygons
  return alerts.filter((alert) => {
    // Check that it's a type we care about and has polygon geometry
    return FILTERED_ALERT_TYPES.includes(alert.properties.event as AlertEvent) && 
           alert.geometry && 
           alert.geometry.type === 'Polygon';
  });
};

/**
 * Fetches a specific alert by ID
 * @param id The alert ID to fetch
 * @returns Promise resolving to the Alert object or null if not found
 */
export const fetchAlertById = async (id: string): Promise<Alert | null> => {
  try {
    const response = await fetch(`https://api.weather.gov/alerts/${id}`, {
      headers: {
        'User-Agent': '(NadoBeep Weather Alert App)',
      },
    });
    
    if (!response.ok) {
      // If 404, just return null
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching alert: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching alert with ID ${id}:`, error);
    throw error;
  }
};
