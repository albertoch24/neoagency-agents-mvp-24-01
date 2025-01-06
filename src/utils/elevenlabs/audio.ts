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