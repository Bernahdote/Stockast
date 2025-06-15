'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecoilValue } from 'recoil';
import { podcastState } from '../store/atoms';
import TextAudioProcessor from '../components/TextAudioProcessor';
import Link from 'next/link';
import Header from '../components/Header';

interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  description: string;
}

export default function TTSPage() {
  const router = useRouter();
  const podcast = useRecoilValue(podcastState);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!podcast.inputText) {
      router.push('/');
      return;
    }

    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voices');
        if (!response.ok) {
          throw new Error('Failed to fetch voices');
        }
        const data = await response.json();
        setVoices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoices();
  }, [podcast.inputText, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-[1200px] mx-auto px-4 py">
        <h1 className="text-3xl font-bold text-gray-900">
          Generate Podcast
        </h1>
        <TextAudioProcessor voices={voices} />
      </div>
    </main>
  );
} 