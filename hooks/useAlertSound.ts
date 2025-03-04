import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { AlertEvent } from '../types/alerts';

export function useAlertSound() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load sound on mount
  useEffect(() => {
    loadSound();
    return () => {
      unloadSound();
    };
  }, []);

  const loadSound = async () => {
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/alarm.mp3'),
          { isLooping: true }
        );
        soundRef.current = sound;
        setIsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const unloadSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsLoaded(false);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error unloading sound:', error);
    }
  };

  const playAlarmSound = useCallback(async (type: AlertEvent) => {
    try {
      if (!isLoaded) {
        await loadSound();
      }
      
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [isLoaded]);

  const stopAlarmSound = useCallback(async () => {
    try {
      if (soundRef.current && isLoaded) {
        await soundRef.current.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  }, [isLoaded]);

  return {
    playAlarmSound,
    stopAlarmSound,
    isPlaying,
    isLoaded
  };
}
