'use client';

import { useRouter } from 'next/navigation';
import { useRecoilValue } from 'recoil';
import { podcastState } from '../store/atoms';

export default function ThreadPage() {
  const router = useRouter();
  const podcast = useRecoilValue(podcastState);

  if (!podcast.inputText || !podcast.summary) {
    router.push('/');
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Generated Script
          </h1>
          <button
            onClick={() => router.push('/tts')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            Generate Podcast
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Input</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{podcast.inputText}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Script</h2>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{podcast.summary}</p>
          </div>
        </div>
      </div>
    </main>
  );
} 