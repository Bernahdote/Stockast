import Image from "next/image";
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">
        AI Demo Project
      </h1>
      <div className="space-y-4">
        <Link 
          href="/chat" 
          className="block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center"
        >
          Start Chat with AI
        </Link>
        <Link 
          href="/tts" 
          className="block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-center"
        >
          Text to Speech
        </Link>
      </div>
    </main>
  );
}
