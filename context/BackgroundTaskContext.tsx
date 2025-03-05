import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import * as Device from 'expo-device';
import { 
  registerBackgroundFetchTask, 
  unregisterBackgroundFetchTask,
  checkBackgroundFetchStatus 
} from '../utils/backgroundTasks';

interface BackgroundTaskContextType {
  isTaskRegistered: boolean;
  taskStatus: string | null;
  registerTask: () => Promise<void>;
  unregisterTask: () => Promise<void>;
}

const BackgroundTaskContext = createContext<BackgroundTaskContextType>({
  isTaskRegistered: false,
  taskStatus: null,
  registerTask: async () => {},
  unregisterTask: async () => {},
});

export const useBackgroundTask = () => useContext(BackgroundTaskContext);

export const BackgroundTaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTaskRegistered, setIsTaskRegistered] = useState(false);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  
  // Function to check the status of background tasks
  const checkStatus = async () => {
    if (Platform.OS !== 'web') {
      const { status, isRegistered } = await checkBackgroundFetchStatus();
      setTaskStatus(status);
      setIsTaskRegistered(isRegistered);
    }
  };
  
  // Register the background task
  const registerTask = async () => {
    if (Platform.OS !== 'web' && Device.isDevice) {
      await registerBackgroundFetchTask();
      await checkStatus();
    }
  };
  
  // Unregister the background task
  const unregisterTask = async () => {
    if (Platform.OS !== 'web') {
      await unregisterBackgroundFetchTask();
      await checkStatus();
    }
  };
  
  // Initialize on component mount
  useEffect(() => {
    // Register task when the component mounts
    registerTask();
    
    // Check status when app returns to foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkStatus();
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  return (
    <BackgroundTaskContext.Provider
      value={{
        isTaskRegistered,
        taskStatus,
        registerTask,
        unregisterTask,
      }}
    >
      {children}
    </BackgroundTaskContext.Provider>
  );
};
