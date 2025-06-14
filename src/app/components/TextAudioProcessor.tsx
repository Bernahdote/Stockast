'use client';

import { useState, useRef, useEffect } from 'react';

interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  description: string;
}

interface Props {
  voices: Voice[];
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function TextAudioProcessor({ voices }: Props) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(voices[0]?.voice_id || '');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    setAudioUrl(null);

    try {
      const response = await fetch('/api/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice_id: selectedVoice }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to process text';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      // 오디오 blob으로 받기
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process text');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-800 mb-2">
            Enter Text
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            rows={4}
            placeholder="Type or paste your text here..."
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Select Voice
          </label>
          <div className="grid grid-cols-2 gap-4">
            {voices.map((voice) => (
              <button
                key={voice.voice_id}
                type="button"
                onClick={() => setSelectedVoice(voice.voice_id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedVoice === voice.voice_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{voice.name}</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    voice.gender === 'Female' 
                      ? 'bg-pink-100 text-pink-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {voice.gender}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{voice.description}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !selectedVoice}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium text-lg ${
            isLoading || !selectedVoice
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Converting...' : 'Convert to Speech'}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-lg font-medium mt-4">
          {error}
        </div>
      )}

      {audioUrl && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-medium mb-4 text-gray-800">Generated Audio</h2>
          <audio ref={audioRef} controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}