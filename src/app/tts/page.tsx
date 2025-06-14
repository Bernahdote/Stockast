'use client';

import { useState } from 'react';

export default function TTSPage() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarity_boost: 0.75
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          ...voiceSettings
        }),
      });

      if (!response.ok) {
        throw new Error('TTS conversion failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to convert text to speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceSettingChange = (setting: 'stability' | 'similarity_boost', value: number) => {
    setVoiceSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Text to Speech with Voice Adjustment</h1>
        
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Voice Stability: <span className="text-blue-600 font-semibold">{voiceSettings.stability}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceSettings.stability}
                onChange={(e) => handleVoiceSettingChange('stability', parseFloat(e.target.value))}
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Voice Similarity: <span className="text-blue-600 font-semibold">{voiceSettings.similarity_boost}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceSettings.similarity_boost}
                onChange={(e) => handleVoiceSettingChange('similarity_boost', parseFloat(e.target.value))}
                className="w-full"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-lg font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Converting...' : 'Convert to Speech'}
          </button>
        </form>

        {audioUrl && (
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-2 text-gray-800">Generated Audio</h2>
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-700 space-y-1">
          <p className="font-medium">• Voice Stability: Value between 0-1, higher values result in more stable voice</p>
          <p className="font-medium">• Voice Similarity: Value between 0-1, higher values make the voice more similar to the original</p>
          <p className="font-medium">• The converted audio will be played directly in the browser</p>
        </div>
      </div>
    </main>
  );
} 