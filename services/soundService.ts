import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';

// Hold reference to the sound object
let soundObject: Audio.Sound | null = null;
let isPlaying = false;
let webAudio: HTMLAudioElement | null = null;

// New variables to handle autoplay restrictions
let userInteractionOccurred = false;
let pendingWebPlayRequest: { volume: number; resolve: (audio: HTMLAudioElement | null) => void; reject: (error: Error) => void } | null = null;

// Add event system for audio state changes
type AudioStateListener = (enabled: boolean) => void;
const audioStateListeners: AudioStateListener[] = [];

// Add a way to check if audio has been enabled
export const isAudioEnabled = () => userInteractionOccurred;

// Subscribe to audio state changes
export const subscribeToAudioState = (listener: AudioStateListener): (() => void) => {
  audioStateListeners.push(listener);
  // Return unsubscribe function
  return () => {
    const index = audioStateListeners.indexOf(listener);
    if (index !== -1) {
      audioStateListeners.splice(index, 1);
    }
  };
};

// Notify listeners when audio state changes
const notifyAudioStateChange = (enabled: boolean) => {
  audioStateListeners.forEach(listener => listener(enabled));
};

// Initialize audio system
export const initializeAudio = async () => {
  try {
    if (Platform.OS === 'web') {
      // Web uses HTML5 Audio API
      if (typeof window !== 'undefined' && 'Audio' in window) {
        // For web, use a direct relative path that works with the web bundler
        webAudio = new window.Audio(require('../assets/sounds/alarm.mp3'));
        
        // Preload the audio
        if (webAudio) {
          webAudio.preload = 'auto';
          // Just load it without playing
          try {
            webAudio.load();
            console.log("Web audio loaded successfully");
          } catch (e) {
            console.error("Failed to load web audio:", e);
          }
        }
      }
      return;
    }

    // Native platforms use Expo AV
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('Failed to initialize audio system:', error);
  }
};

// Enable audio after user interaction
export const enableAudioPlayback = () => {
  const wasEnabled = userInteractionOccurred;
  
  if (Platform.OS === 'web') {
    userInteractionOccurred = true;
    
    // If there's a pending play request, execute it now
    if (pendingWebPlayRequest && webAudio) {
      const { volume, resolve, reject } = pendingWebPlayRequest;
      
      webAudio.volume = volume;
      webAudio.currentTime = 0;
      
      const playPromise = webAudio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaying = true;
            console.log('Web audio started playing after user interaction');
            resolve(webAudio);
            
            // Auto-stop after 30 seconds
            setTimeout(() => {
              if (isPlaying && webAudio) {
                webAudio.pause();
                webAudio.currentTime = 0;
                isPlaying = false;
              }
            }, 30000);
          })
          .catch(err => {
            console.error('Web audio playback failed even after user interaction:', err);
            reject(err);
          });
      }
      
      pendingWebPlayRequest = null;
    }
    
    // Notify listeners if state changed
    if (!wasEnabled) {
      notifyAudioStateChange(true);
    }
  }
  
  return userInteractionOccurred;
};

// Play the alarm sound
export const playAlarmSound = async (volume = 0.8) => {
  if (isPlaying) {
    console.log('Sound is already playing');
    return;
  }

  try {
    // For web
    if (Platform.OS === 'web') {
      if (!webAudio) {
        // If webAudio wasn't initialized yet, create it now
        webAudio = new window.Audio(require('../assets/sounds/alarm.mp3'));
      }
      
      if (webAudio) {
        // If user hasn't interacted with the page yet, queue the request
        if (!userInteractionOccurred) {
          console.warn('Audio playback requires user interaction on this browser. Call enableAudioPlayback() after a user interaction (tap/click).');
          
          // Return a Promise that will be resolved when the user interacts
          return new Promise((resolve, reject) => {
            pendingWebPlayRequest = { volume, resolve, reject };
          });
        }
        
        webAudio.volume = volume;
        webAudio.currentTime = 0;
        
        // Play with user interaction handling for browsers that require it
        const playPromise = webAudio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              isPlaying = true;
              console.log('Web audio started playing');
            })
            .catch(err => {
              console.error('Web audio playback failed:', err);
              console.warn('Audio playback requires user interaction. Use enableAudioPlayback() after a user event.');
              
              // Queue the request for when user interaction occurs
              return new Promise((resolve, reject) => {
                pendingWebPlayRequest = { volume, resolve, reject };
              });
            });
        }

        // Auto-stop after 30 seconds
        setTimeout(() => {
          if (isPlaying && webAudio) {
            webAudio.pause();
            webAudio.currentTime = 0;
            isPlaying = false;
          }
        }, 30000);

        return webAudio;
      }
      return null;
    }

    // Native platforms
    // Initialize the audio system if needed
    await initializeAudio();

    // Create and load the sound
    soundObject = new Audio.Sound();
    await soundObject.loadAsync(require('../assets/sounds/alarm.mp3'));
    
    // Set the volume
    await soundObject.setVolumeAsync(volume);
    
    // Play the sound
    await soundObject.playAsync();
    isPlaying = true;
    
    // Listen for playback status updates
    soundObject.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        // Sound finished playing
        isPlaying = false;
        unloadSound();
      }
    });
    
    // For safety, unload after a maximum duration (e.g., 30 seconds)
    setTimeout(() => {
      if (isPlaying) {
        stopAlarmSound();
      }
    }, 30000);
    
    return soundObject;
  } catch (error) {
    console.error('Error playing alarm sound:', error);
    isPlaying = false;
    return null;
  }
};

// Stop the alarm sound
export const stopAlarmSound = async () => {
  // Web audio
  if (Platform.OS === 'web') {
    if (webAudio && isPlaying) {
      webAudio.pause();
      webAudio.currentTime = 0;
      isPlaying = false;
    }
    return;
  }

  // Native platforms
  if (!soundObject) return;
  
  try {
    await soundObject.stopAsync();
    isPlaying = false;
    await unloadSound();
  } catch (error) {
    console.error('Error stopping alarm sound:', error);
  }
};

// Unload the sound to free resources
const unloadSound = async () => {
  if (Platform.OS === 'web') {
    // Nothing to do for web
    return;
  }

  if (soundObject) {
    try {
      await soundObject.unloadAsync();
      soundObject = null;
    } catch (error) {
      console.error('Error unloading sound:', error);
    }
  }
};
