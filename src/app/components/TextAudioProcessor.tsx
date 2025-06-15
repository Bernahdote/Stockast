'use client';

import { useState, useEffect, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { podcastState } from '../store/atoms';
import { ChevronDown, Play, Pause, Pencil, ChevronUp } from 'lucide-react';
import { FaUserTie, FaUserNurse } from 'react-icons/fa';

interface Voice {
  id: string;
  name: string;
  gender: string;
  description: string;
  voice_id: string;
  avatar: string;
}

interface TextAudioProcessorProps {
  voices: Voice[];
}

// Declare progressMessages outside the component
const PROGRESS_MESSAGES = [
  "Analyzing Market Trends...",
  "Gathering Financial Data...",
  "Generating Comprehensive Analysis...",
  "Structuring Podcast Content...",
  "Generating Podcast Script...",
  "Generating Podcast Audio..."
];

const COMPLETED_MESSAGES = [
  "Analyzing Market Trends Completed",
  "Gathering Financial Data Completed",
  "Generating Comprehensive Analysis Completed",
  "Structuring Podcast Content Completed",
  "Generating Podcast Script Completed",
  "Generating Podcast Audio Completed"
];

// Improved parsing function
function parsePodcastContent(content: string) {
  // 1. Extract status log (<think> ... </think>)
  let log = '';
  const thinkMatch = content.match(/<think[>\s]([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    log = thinkMatch[1].trim();
  }

  // 2. Extract final script ([Final Podcast Script] ... [End of Podcast Script])
  let script = '';
  const scriptMatch = content.match(/\[Final Podcast Script\]([\s\S]*?)\[End of Podcast Script\]/i);
  if (scriptMatch) {
    script = scriptMatch[1].trim();
  }

  return { log, script };
}

export default function TextAudioProcessor({ voices }: TextAudioProcessorProps) {
  const podcast = useRecoilValue(podcastState);
  const setPodcast = useSetRecoilState(podcastState);
  const [selectedVoiceState, setSelectedVoiceState] = useState<string>(voices[0]?.voice_id || '');
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string[]>([]);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const [thinkingLogs, setThinkingLogs] = useState<{ message: string, type: 'log' | 'error' }[]>([]);
  const [finalScript, setFinalScript] = useState<string>('');
  const [progressIndex, setProgressIndex] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const hasRun = useRef(false);
  const [wordTimings, setWordTimings] = useState<Array<{word: string, startTime: number, endTime: number}>>([]);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [audioFailed, setAudioFailed] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [visibleLogCount, setVisibleLogCount] = useState(4);
  const [inputTextArea, setInputTextArea] = useState<string>("");
  const [isEditingInput, setIsEditingInput] = useState(false);
  const [visibleScriptLines, setVisibleScriptLines] = useState<string[]>([]);
  const [currentHighlightedWord, setCurrentHighlightedWord] = useState<string>('');
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);

  // selectedVoice를 voice_id로 관리
  const selectedVoice = podcast.selectedVoice || selectedVoiceState;

  // Function to display logs sequentially
  const showLogsSequentially = (logs: string[]) => {
    setVisibleLogs([]);
    logs.forEach((log, index) => {
      setTimeout(() => {
        setVisibleLogs(prev => [...prev, log]);
      }, index * 1500); // Display logs at 1.5 second intervals
    });
  };

  // 스크립트 생성 및 상태 로그
  useEffect(() => {
    if (podcast.inputText && !hasRun.current) {
      hasRun.current = true;
      const handleGenerateScript = async () => {
        if (!podcast.inputText.trim()) {
          alert('Please enter some text');
          return;
        }

        setIsGeneratingScript(true);
        setGeneratedScript([]);
        setProcessingLogs([]);
        setFinalScript('');
        setProgressIndex(0);

        try {
          const response = await fetch('/api/generate-podcast-text', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: podcast.inputText,
              voice_id: selectedVoiceState
            })
          });

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('Failed to get response reader');
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'log') {
                  setProcessingLogs(prev => [...prev, data.message]);
                  if (!PROGRESS_MESSAGES.includes(data.message)) {
                    setThinkingLogs(prev => [...prev, { message: data.message, type: 'log' }]);
                  }
                  setProgressIndex(prev => prev + 1);
                } else if (data.type === 'script') {
                  const { log, script } = parsePodcastContent(data.content);
                  const filteredLog = log.split('\n').filter(line => line.trim() && !PROGRESS_MESSAGES.includes(line.trim()));
                  setThinkingLogs(filteredLog.map(line => ({ message: line, type: 'log' })));
                  setFinalScript(script);
                  setGeneratedScript(script.split('\n').filter(line => line.trim()));
                  setProgressIndex(5); // Script Generation Completed 표시
                  generateAudio(script);
                  setIsGeneratingScript(false);
                } else if (data.type === 'error') {
                  console.error('Error:', data.message);
                  setThinkingLogs(prev => [...prev, { message: data.message, type: 'error' }]);
                  setIsGeneratingScript(false);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error:', error);
          setThinkingLogs(prev => [...prev, { message: 'Failed to generate script. Please try again.', type: 'error' }]);
          setIsGeneratingScript(false);
        }
      };

      const generateAudio = async (script: string) => {
        setIsGeneratingAudio(true);
        try {
          const response = await fetch('/api/generate-audio', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: script,
              voice_id: selectedVoiceState,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate audio');
          }

          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          setAudioUrl(audioUrl);
          setIsGeneratingAudio(false);
          setProgressIndex(6); // Audio Generation Completed 표시
        } catch (error) {
          console.error('Error generating audio:', error);
          setIsGeneratingAudio(false);
          setThinkingLogs(prev => [...prev, { message: 'Failed to generate audio. Please try again.', type: 'error' }]);
        }
      };

      handleGenerateScript();
    }
  }, [podcast.inputText, selectedVoiceState]);

  const playbackRates = [1, 1.5, 2];

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoiceState(voiceId);
    setIsVoiceDropdownOpen(false);
    setPodcast(prev => ({
      ...prev,
      selectedVoice: voiceId
    }));
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Function to display script gradually
  useEffect(() => {
    if (finalScript && !isGeneratingScript) {
      const lines = finalScript.split('\n').filter(line => line.trim());
      let currentIndex = 0;

      const showNextLines = () => {
        if (currentIndex < lines.length) {
          const nextLines = lines.slice(currentIndex, currentIndex + 4);
          setVisibleScriptLines(prev => [...prev, ...nextLines]);
          currentIndex += 4;
          
          // Update progress index when script is fully displayed
          if (currentIndex >= lines.length) {
            setProgressIndex(5); // Script Generation Completed
          }
        }
      };

      // Start showing script immediately after script generation
      showNextLines();
      const interval = setInterval(() => {
        if (currentIndex >= lines.length) {
          clearInterval(interval);
        } else {
          showNextLines();
        }
      }, 2000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [finalScript, isGeneratingScript]);

  // Update highlighted word based on audio playback
  useEffect(() => {
    if (audioRef.current && wordTimings.length > 0) {
      const updateHighlight = () => {
        const currentTime = audioRef.current?.currentTime || 0;
        const currentWordIndex = wordTimings.findIndex(
          timing => currentTime >= timing.startTime && currentTime <= timing.endTime
        );
        
        if (currentWordIndex !== -1 && currentWordIndex !== highlightedWordIndex) {
          setHighlightedWordIndex(currentWordIndex);
          setCurrentHighlightedWord(wordTimings[currentWordIndex].word);
        }
      };

      const handleTimeUpdate = () => {
        requestAnimationFrame(updateHighlight);
      };

      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [wordTimings, highlightedWordIndex]);

  // Calculate word timings when script is generated
  useEffect(() => {
    if (finalScript) {
      const words = finalScript.split(/\s+/);
      const totalDuration = 180; // Assume 3 minutes
      const timePerWord = totalDuration / words.length;
      
      const timings = words.map((word, index) => ({
        word,
        startTime: index * timePerWord,
        endTime: (index + 1) * timePerWord
      }));
      
      setWordTimings(timings);
    }
  }, [finalScript]);

  // Render status log
  const renderStatusLog = () => {
    return (
      <div className="bg-white rounded-xl p-6 flex flex-col gap-3">
        {PROGRESS_MESSAGES.map((msg, idx) => {
          if (idx > progressIndex + 1) return null;
          let textClass = '';
          if (progressIndex > idx) {
            textClass = 'font-semibold text-lg text-gray-500'; // Success
          } else if (progressIndex === idx) {
            textClass = 'font-bold text-xl text-yellow-700'; // Current
          } else {
            textClass = 'font-normal text-base text-gray-400'; // Next
          }
          return (
            <div key={msg} className="flex items-center gap-4">
              <span className={`w-4 h-4 rounded-full ${
                progressIndex > idx ? 'bg-blue-500' : // Completed step
                progressIndex === idx ? 'bg-yellow-400 animate-pulse' : // Current step
                'bg-gray-200' // Next step
              } inline-block`}></span>
              <span className={textClass}>
                {progressIndex > idx ? COMPLETED_MESSAGES[idx] : msg}
              </span>
            </div>
          );
        })}
        {/* Display error messages */}
        {thinkingLogs.filter(log => log.type === 'error').length > 0 && (
          <div className="flex items-center gap-4">
            <span className="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
            <span className="font-bold text-lg text-red-600">
              {thinkingLogs.filter(log => log.type === 'error').map((log, i) => (
                <span key={i}>Error: {log.message}</span>
              ))}
            </span>
          </div>
        )}
      </div>
    );
  };

  // 오디오 URL이 바뀔 때마다 <audio>를 새로 로드
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      console.log('Loading new audio URL:', audioUrl);
      audioRef.current.load();
    }
  }, [audioUrl]);

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = 'podcast.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Auto-collapse Thinking Progress logic
  useEffect(() => {
    if (thinkingLogs.length > 0) {
      if (visibleLogCount < Math.min(thinkingLogs.length, 5)) {
        const timer = setTimeout(() => {
          setVisibleLogCount((prev) => Math.min(prev + 4, Math.min(thinkingLogs.length, 5)));
        }, 1000);
        return () => clearTimeout(timer);
      }
      if (thinkingLogs.length >= 5 && visibleLogCount >= 5) {
        setShowAllLogs(false);
      }
    }
  }, [thinkingLogs, visibleLogCount]);

  return (
    <div className="max-w-[1200px] mx-auto py-8">
      {/* 상단 Your Input + Voice 드롭다운 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex items-center gap-8">
        <div className="flex-1">
          <label className="block text-lg font-bold text-gray-900 mb-2">Your Input</label>
          <div className="relative group">
            <div className="bg-gray-50 rounded-xl p-4 text-gray-600 text-lg min-h-[80px] whitespace-pre-wrap">
              {podcast.inputText}
              <button
                className="absolute bottom-3 right-3 border border-blue-300 bg-white rounded-full p-1.5 shadow hover:border-blue-600 transition-colors"
                onClick={() => {
                  setInputTextArea(podcast.inputText);
                  setIsEditingInput(true);
                }}
                aria-label="Edit"
                style={{ zIndex: 2 }}
              >
                <Pencil size={20} className="text-blue-600" />
              </button>
            </div>
          </div>
          {isEditingInput && (
            <form
              className="relative"
              onSubmit={e => {
                e.preventDefault();
                setPodcast(prev => ({ ...prev, inputText: inputTextArea }));
                setIsEditingInput(false);
              }}
            >
              <textarea
                value={inputTextArea}
                onChange={e => setInputTextArea(e.target.value)}
                className="w-full min-h-[80px] bg-gray-50 rounded-xl p-4 text-gray-600 text-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12"
                placeholder="Enter your script or text here..."
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    setPodcast(prev => ({ ...prev, inputText: inputTextArea }));
                    setIsEditingInput(false);
                  }
                }}
              />
              <button
                type="submit"
                className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center"
                style={{ zIndex: 2 }}
                aria-label="Save"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
          <div className="relative">
            <button
              onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-xl hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={voices.find(v => v.voice_id === selectedVoice)?.avatar}
                    alt={voices.find(v => v.voice_id === selectedVoice)?.name}
                    className="w-8 h-8 object-cover"
                  />
                </div>
                <span className="font-medium text-gray-900">
                  {voices.find(v => v.voice_id === selectedVoice)?.name}
                </span>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
            
            {isVoiceDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                {voices.map((voice) => (
                  <button
                    key={voice.voice_id}
                    onClick={() => handleVoiceSelect(voice.voice_id)}
                    className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={voice.avatar}
                        alt={voice.name}
                        className="w-8 h-8 object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{voice.name}</div>
                      <div className="text-sm text-gray-500">{voice.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 상태 로그 */}
      <div className="mb-4">
        {renderStatusLog()}
      </div>

      {/* 처리 로그 영역 */}
      {visibleLogs.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Logs</h3>
          <div className="space-y-2">
            {visibleLogs.map((log, index) => (
              <div key={index} className="text-gray-600">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thinking Process (Thinking Logs) */}
      {thinkingLogs.length > 0 && (
        <div className="mt-4 p-4 bg-white rounded-2xl shadow-lg p-6 mb-8 relative">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Thinking Process</h3>
            {((finalScript || thinkingLogs.length > 5) && (
              <button
                className="ml-2 transition-transform duration-200"
                onClick={() => setShowAllLogs((prev) => !prev)}
                aria-label={showAllLogs ? '접기' : '펼치기'}
                style={{ transform: showAllLogs ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <ChevronDown size={20} color="#2563eb" />
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {(showAllLogs ? thinkingLogs : thinkingLogs.slice(0, visibleLogCount)).map((log, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-base ${log.type === 'error' ? 'text-red-600' : 'text-blue-600'}`} style={{ background: log.type === 'error' ? '#ffe0e0' : '#e0edff' }}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className={`p-2 rounded-lg shadow-sm ${log.type === 'error' ? 'bg-red-50' : 'bg-gray-50'}` }>
                    <p className={`text-base font-medium line-clamp-2 ${log.type === 'error' ? 'text-red-700' : 'text-gray-800'}`}>{log.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Script */}
      {finalScript && (
        <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg p-6 mb-8 relative">
          <h3 className="text-3xl font-extrabold mb-4 text-gray-900">Final Script</h3>
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <div className="space-y-2">
              {visibleScriptLines.map((line, lineIndex) => (
                <p key={lineIndex} className="text-lg text-gray-900 font-semibold whitespace-pre-wrap">
                  {line.split(/(\s+)/).map((word, wordIndex) => {
                    const isHighlighted = word === currentHighlightedWord;
                    return (
                      <span
                        key={`${lineIndex}-${wordIndex}`}
                        className={`transition-colors duration-200 ${
                          isHighlighted ? 'bg-blue-100 rounded px-1' : ''
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 오디오 플레이어 */}
      {!isGeneratingScript && !isGeneratingAudio && audioUrl && (
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 text-2xl"
            >
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {playbackRates.map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.playbackRate = rate;
                      setPlaybackRate(rate);
                    }
                  }}
                  className={`px-3 py-1 rounded font-semibold border transition-all ${playbackRate === rate ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                >
                  {rate}x
                </button>
              ))}
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-50 text-gray-700 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 border border-blue-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
            }}
            onError={(e) => console.error('Audio error:', e)}
          />
        </div>
      )}
    </div>
  );
}