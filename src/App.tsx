import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, Eraser, Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { processLyrics, LyricSegment } from './services/api';

export default function App() {
  const [input, setInput] = useState('');
  const [segments, setSegments] = useState<LyricSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await processLyrics(input);
      setSegments(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing lyrics.');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setInput('');
    setSegments([]);
    setError(null);
  };

  const copyToClipboard = () => {
    const text = segments.map(s => {
      if (s.isKanji) {
        return `${s.text}(${s.reading || ''})`;
      }
      return s.text;
    }).join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3D3A35] font-sans selection:bg-[#EBE6DE]">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#8A9A5B] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#5A5A40] blur-[120px]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EBE6DE] shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8A9A5B] rounded-xl flex items-center justify-center text-white shadow-sm">
              <Languages size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-[#2D2A26]">Kana<span className="text-[#8A9A5B] font-normal">sing</span></h1>
              <p className="text-[10px] text-[#9A9287] uppercase tracking-widest font-bold">Japanese Lyrics Helper</p>
            </div>
          </div>
          
          {segments.length > 0 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={clearAll}
                className="p-2 hover:bg-[#F2EDE4] rounded-lg transition-colors text-[#5A5A40]"
                title="Clear all"
              >
                <Eraser size={20} />
              </button>
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-6 py-2 bg-[#5A5A40] text-white rounded-full hover:bg-[#4A4A35] transition-all text-sm font-medium shadow-md"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Export Lyrics'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24 h-full relative">
        <AnimatePresence mode="wait">
          {!segments.length && !loading ? (
            /* Step 1: Paste Panel */
            <motion.div 
              key="input-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-serif text-[#2D2A26] leading-tight">
                  Refine your <span className="text-[#8A9A5B] italic">pronunciation</span> of Japanese lyrics
                </h2>
                <p className="text-[#7C766D] text-lg max-w-xl mx-auto leading-relaxed">
                  Paste your lyrics below to automatically identify Kanji and add Hiragana readings.
                </p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#8A9A5B]/10 to-[#5A5A40]/10 rounded-[30px] opacity-50 blur-sm"></div>
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="夏の日の午後は、公園の木陰で..."
                    className="w-full h-[400px] p-10 pb-24 bg-white border border-[#EBE6DE] rounded-[30px] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#8A9A5B]/5 focus:border-[#8A9A5B]/30 transition-all resize-none text-xl leading-relaxed text-[#5C574F] font-serif placeholder:text-[#9A9287]/30"
                  />
                  <div className="absolute bottom-8 right-8 flex items-center gap-4">
                    <button
                      disabled={loading || !input.trim()}
                      onClick={handleProcess}
                      className="px-10 py-4 bg-[#8A9A5B] text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#7A8A4B] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#8A9A5B]/20 transition-all active:scale-95"
                    >
                      <Sparkles size={18} />
                      Annotate Lyrics
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-5 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100/50 shadow-sm text-center">
                  {error}
                </div>
              )}
            </motion.div>
          ) : loading ? (
            /* Loading State */
            <motion.div 
              key="loading-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[400px] space-y-6"
            >
              <div className="relative">
                <div className="w-20 h-20 border-4 border-[#8A9A5B]/10 border-t-[#8A9A5B] rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto text-[#8A9A5B] animate-pulse" size={24} />
              </div>
              <p className="text-xs text-[#9A9287] font-bold uppercase tracking-[0.2em]">Analyzing Kanji Context...</p>
            </motion.div>
          ) : (
            /* Step 2: Visualization Panel */
            <motion.div 
              key="result-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-[#EBE6DE] shadow-sm">
                <button 
                  onClick={() => setSegments([])}
                  className="flex items-center gap-2 px-4 py-2 text-[#9A9287] hover:text-[#5A5A40] text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  <Eraser size={16} />
                  New Song
                </button>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-[#F2EDE4] rounded-lg transition-colors text-[#5A5A40]"
                    title="Copy result"
                  >
                    {copied ? <Check size={20} className="text-[#8A9A5B]" /> : <Copy size={20} />}
                  </button>
                  <span className="px-3 py-1 bg-[#E8EEDC] text-[#5A6A3B] text-[10px] rounded-full font-bold uppercase tracking-tighter shadow-sm">Analysis Meta</span>
                </div>
              </div>

              {/* Fixed Frame for Lyrics */}
              <div className="bg-white rounded-[40px] border border-[#EBE6DE] shadow-xl overflow-hidden flex flex-col h-[650px]">
                <div className="p-8 md:p-12 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-16 leading-[4.5rem] text-center font-serif py-20 px-4">
                    {segments.map((segment, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        {segment.isKanji ? (
                          <ruby className="ruby-container group relative">
                            <span className="text-4xl md:text-5xl text-[#2D2A26] transition-all group-hover:text-[#8A9A5B] group-hover:scale-110 inline-block">{segment.text}</span>
                            <rt className="ruby-text text-sm md:text-base font-sans text-[#8A9A5B] font-bold uppercase tracking-tight opacity-80 transition-opacity group-hover:opacity-100">
                              {segment.reading}
                            </rt>
                          </ruby>
                        ) : (
                          <span className="text-4xl md:text-5xl text-[#5C574F]/90 whitespace-pre-wrap">{segment.text}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Visual indicator of scrolling */}
                <div className="px-8 py-6 bg-[#FDFBF7] border-t border-[#EBE6DE] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-1 h-8 rounded-full bg-[#EBE6DE] relative overflow-hidden">
                      <motion.div 
                        animate={{ y: [0, 16, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-1/2 bg-[#8A9A5B] rounded-full absolute top-0"
                      />
                    </div>
                    <p className="text-[10px] text-[#9A9287] font-bold uppercase tracking-[0.2em]">Scroll to Explore</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-[#F5F2ED] border-t border-[#EBE6DE]">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-[#9A9287] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-4">
            <span>Mode: Lyric Furigana Annotation</span>
            <span className="opacity-30">•</span>
            <span>Gemini 1.5 Engine</span>
          </div>
        </div>
      </footer>

      <style>{`
        ruby {
          ruby-position: over;
          ruby-align: center;
          margin: 0 0.2em;
        }
        rt {
          padding-bottom: 8px;
          transform: translateY(-4px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #EBE6DE;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8A9A5B;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #EBE6DE transparent;
        }
      `}</style>
    </div>
  );

}
