import Sound from 'react-native-sound';

Sound.setCategory('Playback');

const successSound = new Sound('success.mp3', Sound.MAIN_BUNDLE);
const errorSound = new Sound('error.mp3', Sound.MAIN_BUNDLE);

export function playSuccess() {
  successSound.play();
}

export function playError() {
  errorSound.play();
}
