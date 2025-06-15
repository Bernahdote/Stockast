'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, TrendingUp, MessageSquare, Mic, BarChart3, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSetRecoilState } from 'recoil';
import { podcastState } from './store/atoms';

// Mock stock data for carousel display (icons, tickers, prices, change rates)
const MOCK_TOP = [
  { symbol: 'AAPL', price: 175.04, change: 0.86, logo: 'https://logo.clearbit.com/apple.com' },
  { symbol: 'MSFT', price: 415.32, change: 1.12, logo: 'https://logo.clearbit.com/microsoft.com' },
  { symbol: 'GOOGL', price: 142.56, change: -0.45, logo: 'https://logo.clearbit.com/google.com' },
  { symbol: 'AMZN', price: 178.75, change: 0.92, logo: 'https://logo.clearbit.com/amazon.com' },
  { symbol: 'NVDA', price: 903.56, change: 2.34, logo: 'https://logo.clearbit.com/nvidia.com' },
];
const MOCK_BOTTOM = [
  { symbol: 'META', price: 485.58, change: 1.23, logo: 'https://logo.clearbit.com/meta.com' },
  { symbol: 'TSLA', price: 177.77, change: -1.45, logo: 'https://logo.clearbit.com/tesla.com' },
  { symbol: 'AVGO', price: 1284.50, change: 0.78, logo: 'https://logo.clearbit.com/broadcom.com' },
  { symbol: 'COST', price: 725.56, change: 0.45, logo: 'https://logo.clearbit.com/costco.com' },
  { symbol: 'CSCO', price: 48.76, change: -0.23, logo: 'https://logo.clearbit.com/cisco.com' },
];

// Example questions for quick input
const EXAMPLE_QUESTIONS = [
  "AAPL earnings analysis",
  "Bitcoin market trend", 
  "Tech stocks outlook",
  "Fed rate impact"
];

// Voice 타입 정의
interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  description: string;
}

export default function Home() {
  const router = useRouter();
  const setPodcast = useSetRecoilState(podcastState);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  const [offsetTop, setOffsetTop] = useState(0);
  const [offsetBottom, setOffsetBottom] = useState(0);

  // Infinite rolling carousel - triple the arrays for seamless loop
  const topList = [...MOCK_TOP, ...MOCK_TOP, ...MOCK_TOP];
  const bottomList = [...MOCK_BOTTOM, ...MOCK_BOTTOM, ...MOCK_BOTTOM];

  // Card sizing constants (min/max width settings)
  const CARD_MIN = 176; 
  const CARD_GAP = 16; 
  const topCardCount = MOCK_TOP.length;
  const bottomCardCount = MOCK_BOTTOM.length;

  // Calculate full loop width (original n cards)
  const [topLoopWidth, setTopLoopWidth] = useState(CARD_MIN * topCardCount + CARD_GAP * topCardCount);
  const [bottomLoopWidth, setBottomLoopWidth] = useState(CARD_MIN * bottomCardCount + CARD_GAP * bottomCardCount);

  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Measure actual DOM elements for precise loop width calculation
    if (topRowRef.current) {
      const cards = topRowRef.current.querySelectorAll('.rolling-card');
      let sum = 0;
      for (let i = 0; i < topCardCount; i++) {
        sum += (cards[i] as HTMLElement).offsetWidth + CARD_GAP;
      }
      setTopLoopWidth(sum);
    }
    if (bottomRowRef.current) {
      const cards = bottomRowRef.current.querySelectorAll('.rolling-card');
      let sum = 0;
      for (let i = 0; i < bottomCardCount; i++) {
        sum += (cards[i] as HTMLElement).offsetWidth + CARD_GAP;
      }
      setBottomLoopWidth(sum);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffsetTop((prev) => {
        if (prev >= topLoopWidth) return 0;
        return prev + 1;
      });
      setOffsetBottom((prev) => {
        if (prev >= bottomLoopWidth) return 0;
        return prev + 1;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [topLoopWidth, bottomLoopWidth]);

  const MODES = [
    { id: 'text', label: 'Text' },
    { id: 'video', label: 'Video' },
    { id: 'voice', label: 'Voice' },
  ];
  const [mode, setMode] = useState<'voice' | 'text'>('voice');

  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);


  useEffect(() => {
    // voices API 호출
    const fetchVoices = async () => {
      try {
        const res = await fetch('/api/voices');
        const data = await res.json();
        setVoices(data);
        if (data.length > 0) setSelectedVoice(data[0].voice_id);
      } catch {}
    };
    fetchVoices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'text') {
        const response = await fetch('/api/process-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: inputText }),
        });

        if (!response.ok) {
          throw new Error('Failed to process text');
        }

        setPodcast(prev => ({
          ...prev,
          inputText,
          selectedVoice
        }));
        router.push('/thread');
      } else {
        setPodcast(prev => ({
          ...prev,
          inputText,
          selectedVoice
        }));
        router.push('/tts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputPlaceholder = () => {
    return mode === 'voice' 
      ? 'Enter text to convert to podcast...' 
      : 'Enter stock tickers (e.g., AAPL, MSFT, GOOGL)';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Updated Header */}
      <header className="w-full px-6 py-4  mx-auto sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center max-w-[1200px] mx-auto">
        <div className="text-2xl font-bold text-blue-600">Stockast</div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Get Started
        </button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <div className="mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Market Data into <span className="text-blue-600">Viral Content</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI-powered content creation for stock market creators. From analysis to engaging posts in seconds.
            </p>

            {/* Example question buttons */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              {EXAMPLE_QUESTIONS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(ex)}
                  className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200 hover:bg-blue-100 transition-colors text-base shadow-sm"
                >
                  {ex}
                </button>
              ))}
            </div>

            {/* Updated Search Input with Mode Buttons Inside */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <div className="w-full bg-white rounded-2xl border-2 border-blue-400 shadow-lg p-6">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={getInputPlaceholder()}
                  className="w-full px-4 py-4 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-xl font-bold text-blue-900 bg-transparent placeholder-blue-400 placeholder:font-bold placeholder:text-lg"
                  style={{ letterSpacing: '0.01em' }}
                />

                <div className="flex items-center gap-3 mt-4">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as 'voice' | 'text')}
                      className={`px-4 py-1.5 rounded-full border font-semibold transition-colors text-sm
                        ${mode === m.id ? 'bg-blue-600 text-white border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                  
                  {mode === 'voice' && (
                    <div className="relative">
                      <button
                        onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full border font-semibold bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                      >
                        <span className="font-medium text-gray-900">
                          {selectedVoice
                            ? voices.find((v: Voice) => v.voice_id === selectedVoice)?.name || 'Select Voice'
                            : 'Select Voice'}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      
                      {isVoiceDropdownOpen && (
                        <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                          {voices.map((voice) => (
                            <button
                              key={voice.voice_id}
                              onClick={() => {
                                setSelectedVoice(voice.voice_id);
                                setIsVoiceDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-4 px-6 py-4 text-left rounded-lg transition-all
                                text-xl font-semibold
                                border-2
                                ${selectedVoice === voice.voice_id ? 'border-blue-600 bg-blue-50 font-bold text-blue-900 shadow-md' : 'border-transparent hover:border-blue-400 hover:bg-blue-50'}
                              `}
                              style={{ minHeight: '3.5rem' }}
                            >
                              <div className={`w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold ${selectedVoice === voice.voice_id ? 'text-blue-900' : 'text-gray-800'}`}>
                                {voice.gender === 'Male' ? 'M' : 'F'}
                              </div>
                              <div>
                                <div className={`${selectedVoice === voice.voice_id ? 'font-bold text-blue-900' : 'font-semibold text-gray-800'} text-lg`}>{voice.name} <span className="text-base text-gray-500">({voice.gender})</span></div>
                                <div className="text-base text-gray-500">{voice.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    className="ml-auto px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all flex items-center justify-center"
                    style={{ minWidth: 56, minHeight: 56 }}
                  >
                    <ChevronUp className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center gap-8 text-base text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                No signup required
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Free to try
              </div>
            </div>
          </div>
        </section>

        {/* Rolling Stock Carousel */}
        <section className="py-12">
          <div className="w-full flex flex-col gap-6">
            {/* Top row: Left to Right */}
            <div className="overflow-hidden w-full h-20 relative">
              <div
                ref={topRowRef}
                className="flex items-center h-20 absolute left-0 top-0"
                style={{
                  transform: `translateX(-${offsetTop}px)`,
                  width: 'max-content',
                }}
              >
                {topList.map((stock, idx) => (
                  <div
                    key={stock.symbol + idx}
                    className="rolling-card flex items-center min-w-[11rem] px-4 py-3 bg-white/80 backdrop-blur rounded-xl shadow-sm border border-gray-200 mr-4 hover:shadow-md transition-all duration-200"
                  >
                    <img src={stock.logo} alt={stock.symbol} className="w-10 h-10 rounded-full mr-3 bg-gray-100 object-contain flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{stock.symbol}</div>
                      <div className="text-sm text-gray-600 truncate">
                        ${stock.price.toFixed(2)}
                        <span className={stock.change >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bottom row: Right to Left */}
            <div className="overflow-hidden w-full h-20 relative">
              <div
                ref={bottomRowRef}
                className="flex items-center h-20 absolute right-0 top-0"
                style={{
                  transform: `translateX(${offsetBottom}px)`,
                  width: 'max-content',
                }}
              >
                {bottomList.map((stock, idx) => (
                  <div
                    key={stock.symbol + idx}
                    className="rolling-card flex items-center min-w-[11rem] px-4 py-3 bg-white/80 backdrop-blur rounded-xl shadow-sm border border-gray-200 ml-4 hover:shadow-md transition-all duration-200"
                  >
                    <img src={stock.logo} alt={stock.symbol} className="w-10 h-10 rounded-full mr-3 bg-gray-100 object-contain flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{stock.symbol}</div>
                      <div className="text-sm text-gray-600 truncate">
                        ${stock.price.toFixed(2)}
                        <span className={stock.change >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to create engaging content
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From market analysis to publish-ready content. All powered by AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Market Analysis</h3>
              <p className="text-gray-600">Real-time market data analysis and trend identification powered by AI.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Social Posts</h3>
              <p className="text-gray-600">Generate Twitter threads, LinkedIn posts, and Instagram content instantly.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                <Mic className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Voice Content</h3>
              <p className="text-gray-600">Create scripts and voiceovers for YouTube, TikTok, and podcast content.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics</h3>
              <p className="text-gray-600">Track performance and optimize your content strategy with detailed insights.</p>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-7xl mx-auto">
          <div className="max-w-5xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                From idea to content in 3 simple steps
              </h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Choose Your Topic</h3>
                <p className="text-gray-600">Enter a stock symbol, market trend, or any financial topic you want to create content about.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Select Format</h3>
                <p className="text-gray-600">Choose from Twitter threads, YouTube scripts, blog posts, or any other content format.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Publish & Share</h3>
                <p className="text-gray-600">Get your polished, publish-ready content with optional voice narration and visuals.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Ready to transform your content creation?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of creators who are already using Stockast to grow their audience.
            </p>
            <button className="px-12 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all text-lg shadow-lg">
              Start Creating for Free
            </button>
            <p className="text-sm text-gray-500 mt-4">No credit card required • Free 7-day trial</p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
            <div className="text-2xl font-bold text-blue-400 mb-4 md:mb-0">Stockast</div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2025 Stockast. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}