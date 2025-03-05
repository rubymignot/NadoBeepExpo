import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { AlertEvent } from '../types/alerts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOLUME_STORAGE_KEY = '@nado-beep/alarm-volume';

export function useAlertSound() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load sound and volume on mount
  useEffect(() => {
    loadSound();
    loadVolume();
    return () => {
      unloadSound();
    };
  }, []);

  const loadVolume = async () => {
    try {
      const savedVolume = await AsyncStorage.getItem(VOLUME_STORAGE_KEY);
      if (savedVolume !== null) {
        setVolume(parseFloat(savedVolume));
      }
    } catch (error) {
      console.error('Error loading volume:', error);
    }
  };

  const saveVolume = async (newVolume: number) => {
    try {
      await AsyncStorage.setItem(VOLUME_STORAGE_KEY, newVolume.toString());
      setVolume(newVolume);
      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(newVolume);
      }
    } catch (error) {
      console.error('Error saving volume:', error);
    }
  };

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
        await soundRef.current.setVolumeAsync(volume);
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.setIsLoopingAsync(false); // Ensure no looping
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [isLoaded, isPlaying, volume]);

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
    isLoaded,
    volume,
    setVolume: saveVolume
  };
}
