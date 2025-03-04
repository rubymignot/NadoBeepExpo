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
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/alarm.mp3'),
          { 
            isLooping: false, // Change to false
            shouldPlay: false,
            volume: 1.0
          }
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
      if (!soundRef.current || !isLoaded) {
        await loadSound();
      }
      
      if (soundRef.current && !isPlaying) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.setIsLoopingAsync(false); // Ensure no looping
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [isLoaded, isPlaying]);

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
