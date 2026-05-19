import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, Eraser, Sparkles, Loader2, Copy, Check, Plus, Library, ArrowLeft, Save, Trash2, ChevronRight } from 'lucide-react';
import { processLyrics, LyricSegment } from './services/api';

type View = 'home' | 'paste' | 'visualization' | 'saved';

interface SavedSong {
  id: string;
  title: string;
  segments: LyricSegment[];
  originalLyrics: string;
  savedAt: number;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [input, setInput] = useState('');
  const [segments, setSegments] = useState<LyricSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [songNameInput, setSongNameInput] = useState('');
  const [fontSizeIndex, setFontSizeIndex] = useState(2); // Medium default
  const [isFromCollection, setIsFromCollection] = useState(false);

  const fontSizes = [
    { label: 'XS', class: 'text-xl md:text-2xl', leading: 'leading-[2.5rem]', gap: 'gap-y-10' },
    { label: 'S', class: 'text-2xl md:text-3xl', leading: 'leading-[3.2rem]', gap: 'gap-y-12' },
    { label: 'M', class: 'text-4xl md:text-5xl', leading: 'leading-[4.5rem]', gap: 'gap-y-16' },
    { label: 'L', class: 'text-5xl md:text-6xl', leading: 'leading-[5.5rem]', gap: 'gap-y-20' },
    { label: 'XL', class: 'text-6xl md:text-7xl', leading: 'leading-[6.5rem]', gap: 'gap-y-24' },
  ];

  // Load saved songs on mount
  useEffect(() => {
    const stored = localStorage.getItem('kanasing_saved_songs');
    if (stored) {
      try {
        setSavedSongs(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved songs", e);
      }
    }
  }, []);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await processLyrics(input);
      setSegments(result);
      setIsFromCollection(false);
      setCurrentView('visualization');
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

  const handleSaveSong = () => {
    if (!songNameInput.trim()) return;

    setIsSaving(true);
    const newSong: SavedSong = {
      id: Math.random().toString(36).substring(2, 11),
      title: songNameInput.trim(),
      segments: segments,
      originalLyrics: input,
      savedAt: Date.now()
    };

    const updated = [newSong, ...savedSongs];
    setSavedSongs(updated);
    localStorage.setItem('kanasing_saved_songs', JSON.stringify(updated));
    
    setSaveComplete(true);
    setShowSaveDialog(false);
    setSongNameInput('');
    setTimeout(() => {
      setSaveComplete(false);
      setIsSaving(false);
    }, 2000);
  };

  const deleteSavedSong = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this song?")) return;
    const updated = savedSongs.filter(s => s.id !== id);
    setSavedSongs(updated);
    localStorage.setItem('kanasing_saved_songs', JSON.stringify(updated));
  };

  const openSavedSong = (song: SavedSong) => {
    setSegments(song.segments);
    setInput(song.originalLyrics);
    setIsFromCollection(true);
    setCurrentView('visualization');
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
          <button 
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-[#8A9A5B] rounded-xl flex items-center justify-center text-white shadow-sm">
              <Languages size={22} />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-lg tracking-tight text-[#2D2A26]">Kana<span className="text-[#8A9A5B] font-normal">sing</span></h1>
              <p className="text-[10px] text-[#9A9287] uppercase tracking-widest font-bold">Japanese Lyrics Helper</p>
            </div>
          </button>
          
          <div className="flex items-center gap-4">
            {currentView !== 'home' && (
              <button 
                onClick={() => setCurrentView('home')}
                className="text-xs font-bold uppercase tracking-widest text-[#9A9287] hover:text-[#5A5A40] transition-colors"
              >
                Home
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24 h-full relative">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            /* Home Panel */
            <motion.div 
              key="home-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-12 py-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-serif text-[#2D2A26] leading-tight">
                  Refine your <span className="text-[#8A9A5B] italic">pronunciation</span> of Japanese lyrics
                </h2>
                <p className="text-[#7C766D] text-lg max-w-xl mx-auto leading-relaxed">
                  Automatically identify Kanji and unveil Hiragana readings for a deeper connection to your music.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => { clearAll(); setCurrentView('paste'); }}
                  className="group p-10 bg-white border border-[#EBE6DE] rounded-[40px] shadow-sm hover:shadow-xl hover:border-[#8A9A5B]/30 transition-all text-left flex flex-col gap-6"
                >
                  <div className="w-14 h-14 bg-[#8A9A5B]/10 rounded-2xl flex items-center justify-center text-[#8A9A5B] group-hover:bg-[#8A9A5B] group-hover:text-white transition-all">
                    <Plus size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#2D2A26]">New Song Analysis</h3>
                    <p className="text-sm text-[#7C766D] mt-2 leading-relaxed">Prepare a new set of lyrics for analysis and pronunciation assistance.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-xs font-bold text-[#8A9A5B] uppercase tracking-widest">
                    Start Now <ChevronRight size={14} />
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('saved')}
                  className="group p-10 bg-[#5A5A40] rounded-[40px] shadow-sm hover:shadow-xl transition-all text-left flex flex-col gap-6"
                >
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white/80 group-hover:bg-white group-hover:text-[#5A5A40] transition-all">
                    <Library size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Your Collection</h3>
                    <p className="text-sm text-white/60 mt-2 leading-relaxed">Access your previously annotated lyrics without needing to re-paste.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-xs font-bold text-white/40 group-hover:text-white uppercase tracking-widest">
                    Browse History <ChevronRight size={14} />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {currentView === 'paste' && (
            /* Step 1: Paste Panel */
            <motion.div 
              key="paste-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto space-y-10"
            >
              <button 
                onClick={() => setCurrentView('home')}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#9A9287] hover:text-[#5A5A40] transition-all"
              >
                <ArrowLeft size={14} />
                Cancel
              </button>

              <div className="text-center space-y-4">
                <h2 className="text-4xl font-serif text-[#2D2A26]">Paste Your Lyrics</h2>
                <p className="text-[#7C766D] text-lg max-w-xl mx-auto leading-relaxed">
                  Enter the Japanese text you'd like to annotate with Furigana.
                </p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#8A9A5B]/10 to-[#5A5A40]/10 rounded-[30px] opacity-50 blur-sm"></div>
                <div className="relative">
                  <textarea
                    autoFocus
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
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                      {loading ? 'Analyzing...' : 'Annotate Lyrics'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'visualization' && (
            /* Step 2: Visualization Panel */
            <motion.div 
              key="result-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="flex flex-col gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-[#EBE6DE] shadow-sm">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setCurrentView('paste')}
                    className="flex items-center gap-2 px-4 py-2 text-[#9A9287] hover:text-[#5A5A40] text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Edit Lyrics
                  </button>
                  
                  <div className="flex items-center gap-6">
                    {/* Font Size Control */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F2EDE4] rounded-xl border border-[#EBE6DE]">
                      <button
                        onClick={() => setFontSizeIndex(Math.min(fontSizes.length - 1, fontSizeIndex + 1))}
                        disabled={fontSizeIndex === fontSizes.length - 1}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-all disabled:opacity-30 text-[#5A5A40]"
                        title="Enlarge font size"
                      >
                        <span className="text-base font-bold">A+</span>
                      </button>
                      <div className="w-px h-4 bg-[#EBE6DE]" />
                      <button
                        onClick={() => setFontSizeIndex(Math.max(0, fontSizeIndex - 1))}
                        disabled={fontSizeIndex === 0}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-all disabled:opacity-30 text-[#5A5A40]"
                        title="Reduce font size"
                      >
                        <span className="text-base font-bold">A-</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={copyToClipboard}
                        className="p-2.5 hover:bg-[#F2EDE4] rounded-xl transition-colors text-[#5A5A40]"
                        title="Copy result"
                      >
                        {copied ? <Check size={20} className="text-[#8A9A5B]" /> : <Copy size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Frame for Lyrics */}
              <div className="bg-white rounded-[40px] border border-[#EBE6DE] shadow-xl overflow-hidden flex flex-col h-[700px]">
                <div className="p-8 md:p-12 overflow-y-auto flex-1 custom-scrollbar">
                  <div className={`flex flex-wrap items-baseline justify-center gap-x-2 ${fontSizes[fontSizeIndex].gap} ${fontSizes[fontSizeIndex].leading} text-center font-serif py-20 px-4`}>
                    {segments.map((segment, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        {segment.isKanji ? (
                          <ruby className="ruby-container group relative">
                            <span className={`${fontSizes[fontSizeIndex].class} text-[#2D2A26] transition-all group-hover:text-[#8A9A5B] group-hover:scale-110 inline-block`}>{segment.text}</span>
                            <rt className={`${fontSizeIndex < 2 ? 'text-[10px]' : fontSizeIndex < 4 ? 'text-xs md:text-sm' : 'text-base md:text-lg'} font-sans text-[#8A9A5B] font-bold uppercase tracking-tight opacity-80 transition-opacity group-hover:opacity-100`}>
                              {segment.reading}
                            </rt>
                          </ruby>
                        ) : (
                          <span className={`${fontSizes[fontSizeIndex].class} text-[#5C574F]/90 whitespace-pre-wrap`}>{segment.text}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Visual indicator and Save functionality at the bottom */}
                <div className="px-8 py-8 bg-[#FDFBF7] border-t border-[#EBE6DE] flex flex-col items-center gap-6">
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

                  {/* Relocated Save Area */}
                  <div className="w-full max-w-sm">
                    {!isFromCollection && (
                      <>
                        {!showSaveDialog && !saveComplete ? (
                          <button 
                            onClick={() => setShowSaveDialog(true)}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#5A5A40] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#4A4A35] transition-all shadow-md hover:translate-y-[-1px] active:translate-y-0"
                          >
                            <Save size={16} />
                            Add to Collection
                          </button>
                        ) : saveComplete ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full px-6 py-3 bg-[#8A9A5B] text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <Check size={16} />
                            Successfully Saved!
                          </motion.div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full space-y-3"
                          >
                            <div className="flex flex-col gap-2">
                              <label className="text-[9px] font-bold uppercase tracking-widest text-[#9A9287] text-center">Save As</label>
                              <div className="flex gap-2">
                                <input 
                                  autoFocus
                                  type="text"
                                  placeholder="Song Title..."
                                  value={songNameInput}
                                  onChange={(e) => setSongNameInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSong()}
                                  className="flex-1 px-4 py-2 bg-white border border-[#EBE6DE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20"
                                />
                                <button 
                                  onClick={handleSaveSong}
                                  disabled={!songNameInput.trim() || isSaving}
                                  className="px-4 py-2 bg-[#8A9A5B] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 whitespace-nowrap"
                                >
                                  Confirm
                                </button>
                              </div>
                              <button 
                                onClick={() => setShowSaveDialog(false)}
                                className="text-[9px] font-bold uppercase tracking-widest text-[#9A9287] hover:text-[#5A5A40]"
                              >
                                Cancel
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'saved' && (
            /* Saved Collection Panel */
            <motion.div 
              key="saved-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto space-y-8 h-full"
            >
               <div className="flex items-center justify-between">
                <button 
                  onClick={() => setCurrentView('home')}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#9A9287] hover:text-[#5A5A40] transition-all"
                >
                  <ArrowLeft size={14} />
                  Home
                </button>
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#9A9287]">Saved Archives</h2>
              </div>

              <div className="text-center space-y-2 pb-6">
                <h2 className="text-4xl font-serif text-[#2D2A26]">Your Collection</h2>
                <p className="text-[#7C766D]">Revisit your annotated lyrics instantly.</p>
              </div>

              <div className="space-y-4">
                {savedSongs.length === 0 ? (
                  <div className="p-20 text-center bg-white rounded-[40px] border border-[#EBE6DE] border-dashed">
                    <Library className="mx-auto text-[#EBE6DE] mb-4" size={48} />
                    <p className="text-[#9A9287] font-medium">Your collection is empty.</p>
                    <button 
                      onClick={() => setCurrentView('paste')}
                      className="mt-6 text-[#8A9A5B] font-bold text-xs uppercase tracking-widest hover:underline"
                    >
                      Annotate your first song
                    </button>
                  </div>
                ) : (
                  savedSongs.map((song) => (
                    <motion.div
                      layout
                      key={song.id}
                      onClick={() => openSavedSong(song)}
                      className="group p-6 bg-white border border-[#EBE6DE] rounded-3xl shadow-sm hover:shadow-lg hover:border-[#8A9A5B]/20 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F2EDE4] rounded-2xl flex items-center justify-center text-[#8A9A5B] group-hover:bg-[#8A9A5B] group-hover:text-white transition-all">
                          <Languages size={22} />
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-[#2D2A26] group-hover:text-[#8A9A5B] transition-colors">{song.title}</h4>
                          <p className="text-[10px] text-[#9A9287] uppercase tracking-widest mt-1">
                            {new Date(song.savedAt).toLocaleDateString()} • {song.segments.filter(s => s.isKanji).length} Kanji
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => deleteSavedSong(song.id, e)}
                          className="p-3 text-[#9A9287] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                        <ChevronRight className="text-[#EBE6DE] group-hover:text-[#8A9A5B] transition-colors" size={20} />
                      </div>
                    </motion.div>
                  ))
                )}
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
            <span>Gemini 1.5 Pro Engine</span>
          </div>
          <div className="flex gap-4">
            <span>Kanasing Lab v1.2</span>
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
