'use client';

import { useState, useEffect } from 'react';

interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  description: string;
}

export default function TTSPage() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voices');
        if (!response.ok) {
          throw new Error('Failed to fetch voices');
        }
        const data = await response.json();
        setVoices(data);
        if (data.length > 0) {
          setSelectedVoice(data[0].voice_id);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        setError('Failed to load voice models');
      }
    };

    fetchVoices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading || !selectedVoice) return;

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
          voice_id: selectedVoice
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

  const selectedVoiceInfo = voices.find(voice => voice.voice_id === selectedVoice);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Text to Speech</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="voice" className="block text-sm font-medium text-gray-800 mb-2">
              Select Voice
            </label>
            <select
              id="voice"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              disabled={isLoading}
            >
              {voices.map((voice) => (
                <option key={voice.voice_id} value={voice.voice_id}>
                  {voice.name} ({voice.gender})
                </option>
              ))}
            </select>
            {selectedVoiceInfo && (
              <p className="mt-2 text-sm text-gray-600">
                {selectedVoiceInfo.description}
              </p>
            )}
          </div>

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

          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-lg font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !selectedVoice}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
              isLoading || !selectedVoice
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
      </div>
    </main>
  );
} 