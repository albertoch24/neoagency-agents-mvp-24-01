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
    console.log('Audio resources cleaned up');
  }

  async playAudio(audioBlob: Blob): Promise<HTMLAudioElement> {
    this.cleanup();
    
    this.audioUrl = URL.createObjectURL(audioBlob);
    this.audio = new Audio(this.audioUrl);
    
    return this.audio;
  }

  isPlaying(): boolean {
    return this.audio !== null;
  }
}