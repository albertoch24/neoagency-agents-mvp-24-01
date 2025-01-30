export class AudioManager {
  private audio: HTMLAudioElement | null = null;

  async play(text: string, voiceId: string): Promise<HTMLAudioElement> {
    try {
      // Create audio element
      const audio = new Audio();
      
      // Store the audio element
      this.audio = audio;
      
      // Return the audio element
      return audio;
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
}