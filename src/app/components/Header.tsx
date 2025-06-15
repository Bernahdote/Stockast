import Link from 'next/link';
import { X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <header className="w-full px-6 py-4 mx-auto sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center max-w-[1200px] mx-auto">
          <Link href="/" className="text-4xl font-bold text-blue-600 hover:no-underline hover:text-blue-700 cursor-pointer">Stockast</Link>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            onClick={() => setShowModal(true)}
          >
            Get Started For Free
          </button>
        </div>
      </header>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-12 min-w-[400px] min-h-[220px] flex flex-col items-center relative">
            <button
              className="absolute top-6 right-6 text-gray-400 hover:text-blue-600 transition-colors text-3xl"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              <X size={36} />
            </button>
            <h2 className="text-4xl font-extrabold mb-6 text-blue-700 tracking-tight">Thank you!</h2>
            <p className="text-2xl font-semibold text-gray-800">We appreciate your interest.</p>
          </div>
        </div>
      )}
    </>
  );
} 