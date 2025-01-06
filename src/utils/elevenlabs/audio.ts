export class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;

  cleanup() {
    if (this.audio) {
      console.log('Cleaning up audio element', {
        currentTime: this.audio.currentTime,
        paused: this.audio.paused,
        ended: this.audio.ended
      });
      this.audio.pause();
      this.audio = null;
    }
    if (this.audioUrl) {
      console.log('Revoking audio URL');
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    console.log('Audio resources cleaned up');
  }

  async play(text: string, voiceId: string): Promise<HTMLAudioElement> {
    console.log('Starting audio playback', { text, voiceId });
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVEN_LABS_API_KEY || ''
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate speech: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      return this.playAudio(audioBlob);
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  async playAudio(audioBlob: Blob): Promise<HTMLAudioElement> {
    console.log('Creating new audio element');
    this.cleanup();
    
    this.audioUrl = URL.createObjectURL(audioBlob);
    console.log('Created audio URL:', this.audioUrl);
    
    this.audio = new Audio(this.audioUrl);
    this.audio.volume = 1.0;
    this.audio.muted = false;
    
    console.log('Audio element initialized', {
      volume: this.audio.volume,
      muted: this.audio.muted,
      src: this.audio.src
    });
    
    return this.audio;
  }

  isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }
}