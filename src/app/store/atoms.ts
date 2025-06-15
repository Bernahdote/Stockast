import { atom } from 'recoil';

export interface PodcastState {
  inputText: string;
  selectedVoice: string;
  summary: string;
  audioUrl: string | null;
}

export const podcastState = atom<PodcastState>({
  key: 'podcastState',
  default: {
    inputText: '',
    selectedVoice: '',
    summary: '',
    audioUrl: null,
  },
}); 