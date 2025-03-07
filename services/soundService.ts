import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';

// Hold reference to the sound object
let soundObject: Audio.Sound | null = null;
let isPlaying = false;
let webAudio: HTMLAudioElement | null = null;

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
              // Most browsers will only allow audio to play after user interaction
              console.log('Audio playback requires user interaction on this browser');
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
