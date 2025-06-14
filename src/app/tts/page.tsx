'use client';

import { useState, useEffect, useRef } from 'react';
import TextAudioProcessor from '../components/TextAudioProcessor';

interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  description: string;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function TTSPage() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const words = text.split(/\s+/);

  // Cleanup audio URL when component unmounts or new audio is created
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voices');
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || 'Failed to fetch voices');
        }
        const data = await response.json();
        setVoices(data);
        if (data.length > 0) {
          setSelectedVoice(data[0].voice_id);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        setError(error instanceof Error ? error.message : 'Failed to load voice models');
      }
    };

    fetchVoices();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading || !selectedVoice) return;

    setIsLoading(true);
    setError(null);
    
    // Cleanup previous audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackSpeed(1);
    setCurrentWordIndex(-1);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: selectedVoice
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'TTS conversion failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to convert text to speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // const formatTime = (time: number) => {
  //   const minutes = Math.floor(time / 60);
  //   const seconds = Math.floor(time % 60);
  //   return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  // };

  // const handlePlayPause = () => {
  //   if (audioRef.current) {
  //     if (isPlaying) {
  //       audioRef.current.pause();
  //     } else {
  //       audioRef.current.play().catch(error => {
  //         console.error('Error playing audio:', error);
  //         setError('Failed to play audio. Please try again.');
  //       });
  //     }
  //     setIsPlaying(!isPlaying);
  //   }
  // };

  // const handleTimeUpdate = () => {
  //   if (audioRef.current) {
  //     const currentTime = audioRef.current.currentTime;
  //     setCurrentTime(currentTime);
      
  //     // Improved word timing calculation
  //     const progress = currentTime / duration;
  //     const newIndex = Math.floor(progress * words.length);
  //     setCurrentWordIndex(Math.min(newIndex, words.length - 1));
  //   }
  // };

  // const handleLoadedMetadata = () => {
  //   if (audioRef.current) {
  //     setDuration(audioRef.current.duration);
  //   }
  // };

  // const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const time = parseFloat(e.target.value);
  //   if (audioRef.current) {
  //     audioRef.current.currentTime = time;
  //     setCurrentTime(time);
  //   }
  // };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      
      <TextAudioProcessor voices={voices} />
    </main>
  );
} 