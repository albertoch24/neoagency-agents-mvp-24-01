export class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;

  cleanup() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
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
    this.cleanup();
    
    this.audioUrl = URL.createObjectURL(audioBlob);
    this.audio = new Audio(this.audioUrl);
    this.audio.volume = 1.0;
    this.audio.muted = false;
    
    return this.audio;
  }

  isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }
}