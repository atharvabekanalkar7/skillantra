/**
 * Global alternating click sound handler
 */

let toggle = true;
let audio1: HTMLAudioElement | null = null;
let audio2: HTMLAudioElement | null = null;

if (typeof window !== "undefined") {
  audio1 = new Audio("/ps1.mp3");
  audio2 = new Audio("/ps2.mp3");
  
  // Set consistent low volume
  audio1.volume = 0.15;
  audio2.volume = 0.15;
}

export function playClickSound() {
  if (typeof window === "undefined") return;

  const audio = toggle ? audio1 : audio2;

  if (audio) {
    audio.currentTime = 0;
    audio.play().catch((err) => {
      // Browser likely blocked autoplay - will works after first interaction
      console.debug("Audio play blocked:", err);
    });
  }

  toggle = !toggle;
}
