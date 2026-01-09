/**
 * Singleton AudioContext for audio feedback
 * Prevents repeated AudioContext creation and manages audio resources efficiently
 */

let audioContext: AudioContext | null = null;

/**
 * Gets or creates the singleton AudioContext instance
 * Handles browser autoplay policies by resuming suspended context
 */
export const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
};

/**
 * Plays a success sound (high-pitched double beep)
 */
export const playSuccessSound = (): void => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
    
    // Second beep
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.1);
      } catch {
        // Ignore audio errors
      }
    }, 150);
  } catch {
    // Ignore audio errors - feedback is non-critical
  }
};

/**
 * Plays an error sound (low buzz)
 */
export const playErrorSound = (): void => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';
    gainNode.gain.value = 0.2;
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore audio errors - feedback is non-critical
  }
};

/**
 * Triggers haptic feedback if available
 */
export const triggerHapticFeedback = (pattern: number | number[] = 100): void => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

/**
 * Combined success feedback (sound + haptic)
 */
export const successFeedback = (): void => {
  playSuccessSound();
  triggerHapticFeedback([50, 50, 50]);
};

/**
 * Combined error feedback (sound + haptic)
 */
export const errorFeedback = (): void => {
  playErrorSound();
  triggerHapticFeedback(200);
};
