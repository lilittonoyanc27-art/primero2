import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Layers,
  Search,
  ArrowRight,
  ArrowLeft,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  HelpCircle,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';
import { DIALOGS_DATA, CATEGORIES, DialogItem, CategoryInfo } from './data.ts';

type ViewMode = 'list' | 'flashcard';
type StudyDirection = 'arm_to_esp' | 'esp_to_arm' | 'show_all';

export default function App() {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [studyDirection, setStudyDirection] = useState<StudyDirection>('arm_to_esp');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track open/revealed state for items
  // An item can be revealed either partially or fully.
  // When clicked, both the Spanish question translation and the answers are revealed.
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  
  // Track completed/mastered items
  const [masteredIds, setMasteredIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('es_hy_mastered');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Audio speech rate
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Flashcard state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);

  // Save mastered to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('es_hy_mastered', JSON.stringify(masteredIds));
    } catch (e) {
      console.error(e);
    }
  }, [masteredIds]);

  // Filtered dialog items
  const filteredItems = useMemo(() => {
    return DIALOGS_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        item.questionEs.toLowerCase().includes(q) ||
        item.questionHy.toLowerCase().includes(q) ||
        item.answerEs.toLowerCase().includes(q) ||
        item.answerHy.toLowerCase().includes(q) ||
        (item.timeContext && item.timeContext.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  // Reset flashcard index when filtered items change
  useEffect(() => {
    setFlashcardIndex(0);
    setFlashcardRevealed(false);
  }, [selectedCategory, searchQuery]);

  // Audio pronunciation using Web Speech API
  const speakSpanish = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Ձեր բրաուզերը չի աջակցում ձայնային արտասանություն:');
      return;
    }

    window.speechSynthesis.cancel();

    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = speechRate;

    // Try finding a Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const esVoice =
      voices.find((v) => v.lang === 'es-ES') ||
      voices.find((v) => v.lang.startsWith('es'));
    if (esVoice) {
      utterance.voice = esVoice;
    }

    setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const revealAll = () => {
    const allRevealed: Record<string, boolean> = {};
    filteredItems.forEach((item) => {
      allRevealed[item.id] = true;
    });
    setRevealedIds(allRevealed);
  };

  const hideAll = () => {
    setRevealedIds({});
  };

  const toggleMastered = (id: string) => {
    setMasteredIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const masteredCount = useMemo(() => {
    return Object.values(masteredIds).filter(Boolean).length;
  }, [masteredIds]);

  const currentCategoryInfo = useMemo(() => {
    return (
      CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0]
    );
  }, [selectedCategory]);

  // Flashcard controls
  const handleNextFlashcard = () => {
    if (filteredItems.length === 0) return;
    setFlashcardRevealed(false);
    setFlashcardIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const handlePrevFlashcard = () => {
    if (filteredItems.length === 0) return;
    setFlashcardRevealed(false);
    setFlashcardIndex(
      (prev) => (prev - 1 + filteredItems.length) % filteredItems.length
    );
  };

  const handleShuffle = () => {
    if (filteredItems.length <= 1) return;
    setFlashcardRevealed(false);
    const randomIndex = Math.floor(Math.random() * filteredItems.length);
    setFlashcardIndex(randomIndex);
  };

  const currentFlashcard = filteredItems[flashcardIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-amber-500/20">
                🇪🇸
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    Español <span className="text-amber-600">⇄</span> Հայերեն
                  </h1>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Խոսակցական
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-armenian">
                  Գործնական հարց ու պատասխաններ բոլոր ժամանակներով
                </p>
              </div>
            </div>

            {/* Mode & Action Controls */}
            <div className="flex items-center flex-wrap gap-2">
              {/* View Switcher: List vs Flashcards */}
              <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Ցուցակ</span>
                </button>
                <button
                  onClick={() => setViewMode('flashcard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    viewMode === 'flashcard'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Քարտերով</span>
                </button>
              </div>

              {/* Progress counter */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {masteredCount} / {DIALOGS_DATA.length} սովորված
                </span>
              </div>

              {/* Speech rate toggle */}
              <button
                onClick={() =>
                  setSpeechRate((prev) => (prev === 0.9 ? 0.75 : 0.9))
                }
                title="Փոխել ձայնի արագությունը"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs text-slate-700 border border-slate-200 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-mono">{speechRate === 0.9 ? '1x' : '0.8x'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-5 flex-1 w-full space-y-5">
        {/* Category Pills Slider / Tense Selector */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-armenian">
              Ընտրեք Ժամանակաձևը
            </span>
            <span className="text-xs text-slate-500 font-armenian">
              Գտնվել է՝ {filteredItems.length} հարց
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                >
                  <span className="font-bold">{cat.titleEs}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-slate-800 text-amber-300'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Category Banner Info */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500 text-white font-bold text-xs rounded-md uppercase tracking-wide">
                  {currentCategoryInfo.titleEs}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-armenian">
                  {currentCategoryInfo.titleHy}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-armenian">
                {currentCategoryInfo.description}
              </p>
            </div>

            {/* Instruction tooltip reminder */}
            <div className="bg-white/80 backdrop-blur-xs rounded-xl px-3 py-2 border border-amber-200 text-xs text-slate-700 flex items-center gap-2">
              <span className="text-base">💡</span>
              <span className="font-armenian">
                <strong>Հուշում:</strong> Սեղմեք քարտին՝ իսպաներեն թարգմանությունն ու պատասխանը բացելու համար:
              </span>
            </div>
          </div>
        </section>

        {/* Study Mode Selector & Search Filter */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Study Direction / Format Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs font-bold text-slate-500 font-armenian flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Ուսուցման ռեժիմ՝
              </span>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setStudyDirection('arm_to_esp')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    studyDirection === 'arm_to_esp'
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🇦🇲 ➔ 🇪🇸</span>
                  <span className="font-armenian">Հայերենից Իսպաներեն</span>
                </button>
                <button
                  onClick={() => setStudyDirection('esp_to_arm')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    studyDirection === 'esp_to_arm'
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🇪🇸 ➔ 🇦🇲</span>
                  <span className="font-armenian">Իսպաներենից Հայերեն</span>
                </button>
                <button
                  onClick={() => setStudyDirection('show_all')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    studyDirection === 'show_all'
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📖</span>
                  <span className="font-armenian">Բոլորը բաց</span>
                </button>
              </div>
            </div>

            {/* Quick Actions: Reveal All / Hide All */}
            {viewMode === 'list' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={revealAll}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors font-armenian"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>Բացել բոլորը</span>
                </button>
                <button
                  onClick={hideAll}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors font-armenian"
                >
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Փակել բոլորը</span>
                </button>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Որոնել բառերով (օրինակ՝ դպրոց, fútbol, ayer, նախաճաշ, mañana)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-armenian transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {/* VIEW 1: LIST / DIALOG VIEW */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center text-xl">
                  🔍
                </div>
                <h3 className="font-bold text-slate-800 text-base font-armenian">
                  Ոչ մի հարց չգտնվեց
                </h3>
                <p className="text-xs text-slate-500 font-armenian max-w-sm mx-auto">
                  Փորձեք փոխել որոնման բառը կամ ընտրել «Բոլոր ժամանակները»
                  կատեգորիան:
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Մաքրել ֆիլտրերը
                </button>
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isRevealed =
                  studyDirection === 'show_all' || !!revealedIds[item.id];
                const isMastered = !!masteredIds[item.id];
                const isPlaying = speakingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`group bg-white rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md ${
                      isMastered
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : isRevealed
                        ? 'border-amber-200 ring-1 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Card Header / Prompt Section */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        {/* Number & Tense Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold flex items-center justify-center border border-slate-200">
                            {item.number}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {item.tenseTag}
                          </span>
                          {item.timeContext && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              🕒 {item.timeContext}
                            </span>
                          )}
                        </div>

                        {/* Top action buttons */}
                        <div className="flex items-center gap-1.5">
                          {/* Audio button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakSpanish(
                                `${item.questionEs}. ${item.answerEs}`,
                                item.id
                              );
                            }}
                            title="Լսել իսպաներեն արտասանությունը"
                            className={`p-2 rounded-xl text-xs transition-colors flex items-center gap-1 ${
                              isPlaying
                                ? 'bg-amber-500 text-white animate-pulse'
                                : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800'
                            }`}
                          >
                            <Volume2 className="w-4 h-4" />
                            <span className="text-[10px] hidden sm:inline font-medium">
                              Լսել
                            </span>
                          </button>

                          {/* Mastered toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMastered(item.id);
                            }}
                            title={
                              isMastered
                                ? 'Նշված է որպես սովորված'
                                : 'Նշել որպես սովորված'
                            }
                            className={`p-2 rounded-xl text-xs transition-colors ${
                              isMastered
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {isMastered ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Main Interactive Question Box */}
                      <div
                        onClick={() => toggleReveal(item.id)}
                        className="mt-3 cursor-pointer select-none"
                      >
                        {/* If Arm to Esp mode: Prominent Armenian Question */}
                        {studyDirection === 'arm_to_esp' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🇦🇲</span>
                              <p className="text-base sm:text-lg font-bold text-slate-900 font-armenian">
                                {item.questionHy}
                              </p>
                            </div>

                            {/* Spanish Question: Either shown or prompt to reveal */}
                            {isRevealed ? (
                              <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 animate-fadeIn">
                                <span className="text-base shrink-0">🇪🇸</span>
                                <div className="flex-1">
                                  <p className="text-base sm:text-lg font-bold text-amber-950 font-serif">
                                    {item.questionEs}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakSpanish(item.questionEs, `q-${item.id}`);
                                  }}
                                  className="text-amber-700 hover:text-amber-900 p-1"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl hover:bg-amber-50/50 hover:border-amber-300 transition-colors">
                                <span className="text-xs text-slate-500 font-medium font-armenian flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  Սեղմեք այստեղ՝ <strong>իսպաներեն հարցն ու պատասխանները</strong> բացելու համար
                                </span>
                                <span className="text-xs font-bold text-amber-600 bg-amber-100/80 px-2 py-1 rounded-md">
                                  Բացել 🇪🇸
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Esp to Arm or Show All mode: Prominent Spanish Question */
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🇪🇸</span>
                                <p className="text-base sm:text-lg font-bold text-slate-900">
                                  {item.questionEs}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakSpanish(item.questionEs, `q-${item.id}`);
                                }}
                                className="text-slate-400 hover:text-amber-600 p-1"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Armenian Translation & Answers */}
                            {isRevealed ? (
                              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 animate-fadeIn">
                                <span className="text-base">🇦🇲</span>
                                <p className="text-sm sm:text-base font-semibold text-slate-800 font-armenian">
                                  {item.questionHy}
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl hover:bg-slate-100 transition-colors">
                                <span className="text-xs text-slate-500 font-medium font-armenian flex items-center gap-1.5">
                                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                                  Սեղմեք՝ <strong>հայերեն թարգմանությունն ու պատասխանները</strong> տեսնելու համար
                                </span>
                                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-md">
                                  Բացել 🇦🇲
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expandable Answers Section */}
                      {isRevealed && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-fadeIn">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-armenian flex items-center gap-1">
                            <span>Խոսակցական Պատասխան</span>
                          </div>

                          {/* Spanish Answer Box */}
                          <div className="bg-slate-900 text-white rounded-xl p-3.5 sm:p-4 flex items-start justify-between gap-3 shadow-inner">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">🇪🇸</span>
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                                  Respuesta en español:
                                </span>
                              </div>
                              <p className="text-base sm:text-lg font-medium text-slate-100 pl-6">
                                {item.answerEs}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speakSpanish(item.answerEs, `a-${item.id}`);
                              }}
                              title="Լսել պատասխանը"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg shrink-0 transition-colors"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Armenian Answer Box */}
                          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 sm:p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🇦🇲</span>
                              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide font-armenian">
                                Պատասխանի թարգմանություն՝
                              </span>
                            </div>
                            <p className="text-sm sm:text-base font-semibold text-emerald-950 pl-6 mt-1 font-armenian">
                              {item.answerHy}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Card Footer toggle indicator */}
                      <div
                        onClick={() => toggleReveal(item.id)}
                        className="mt-3 pt-2 flex items-center justify-end text-xs text-slate-400 hover:text-slate-600 cursor-pointer select-none font-armenian"
                      >
                        <span className="flex items-center gap-1">
                          {isRevealed ? (
                            <>
                              <span>Ծալել</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <span>Մանրամասն</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* VIEW 2: FLASHCARD / INTERACTIVE TRAINER VIEW */}
        {viewMode === 'flashcard' && currentFlashcard && (
          <div className="max-w-2xl mx-auto space-y-4 py-4">
            {/* Flashcard Card Top Info */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-armenian font-semibold">
                Քարտ {flashcardIndex + 1} / {filteredItems.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                  {currentFlashcard.tenseTag}
                </span>
                {currentFlashcard.timeContext && (
                  <span className="text-slate-500">
                    🕒 {currentFlashcard.timeContext}
                  </span>
                )}
              </div>
            </div>

            {/* The Flashcard Body */}
            <div
              onClick={() => setFlashcardRevealed(!flashcardRevealed)}
              className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 sm:p-8 cursor-pointer select-none min-h-[340px] flex flex-col justify-between transition-all duration-300 hover:border-amber-400"
            >
              {/* Question Side */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-armenian">
                    {studyDirection === 'arm_to_esp'
                      ? '🇦🇲 Հարցը հայերենով (Ասեք իսպաներեն)'
                      : '🇪🇸 Հարցը իսպաներենով'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMastered(currentFlashcard.id);
                    }}
                    className={`p-1.5 rounded-lg ${
                      masteredIds[currentFlashcard.id]
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {masteredIds[currentFlashcard.id] ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Question Text */}
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug font-armenian">
                  {studyDirection === 'arm_to_esp'
                    ? currentFlashcard.questionHy
                    : currentFlashcard.questionEs}
                </h3>

                {/* If already revealed in flashcard */}
                {flashcardRevealed ? (
                  <div className="space-y-4 pt-4 border-t border-slate-100 animate-fadeIn">
                    {/* Spanish Question Confirmation */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-amber-700 uppercase">
                          🇪🇸 Իսպաներեն հարցը՝
                        </span>
                        <p className="text-lg font-bold text-slate-900 mt-1 font-serif">
                          {currentFlashcard.questionEs}
                        </p>
                        {studyDirection === 'esp_to_arm' && (
                          <p className="text-sm text-slate-600 font-armenian mt-1">
                            🇦🇲 {currentFlashcard.questionHy}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakSpanish(
                            currentFlashcard.questionEs,
                            `fc-q-${currentFlashcard.id}`
                          );
                        }}
                        className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Spanish & Armenian Answers */}
                    <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase">
                          🇪🇸 Պատասխանը իսպաներենով՝
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSpanish(
                              currentFlashcard.answerEs,
                              `fc-a-${currentFlashcard.id}`
                            );
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-lg font-medium text-slate-100">
                        {currentFlashcard.answerEs}
                      </p>
                      <p className="text-sm text-emerald-300 font-armenian pt-2 border-t border-slate-800">
                        🇦🇲 {currentFlashcard.answerHy}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-400 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-500">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-sm font-armenian font-medium text-slate-500">
                      Սեղմեք քարտին՝ իսպաներեն թարգմանությունն ու պատասխանը բացելու համար
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom hint */}
              <div className="text-center text-xs text-slate-400 font-armenian pt-4 border-t border-slate-100">
                {flashcardRevealed ? 'Սեղմեք՝ քարտը փակելու համար' : '💡 Փորձեք նախ ինքնուրույն բարձրաձայն ասել'}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handlePrevFlashcard}
                className="flex-1 py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center gap-2 transition-colors font-armenian text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Նախորդը</span>
              </button>

              <button
                onClick={handleShuffle}
                title="Խառնել քարտերը"
                className="py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextFlashcard}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors font-armenian text-sm"
              >
                <span>Հաջորդը</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tense Comparison Quick Reference Box (⚡ Для быстрой тренировки окончаний) */}
        <section className="bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-violet-800/80 text-amber-300">
                  <Flame className="w-4 h-4" />
                </span>
                <h3 className="text-base sm:text-lg font-bold">
                  ⚡ Արագ մարզում՝ Նույն հարցը տարբեր ժամանակներով
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200 font-armenian">
                Ուշադրություն դարձրեք բայի վերջավորություններին՝ <strong>Hoy</strong> (ներկա), <strong>Ayer</strong> (անցյալ) և <strong>Mañana</strong> (ապառնի):
              </p>
            </div>

            <button
              onClick={() => setSelectedCategory('drill')}
              className="px-3.5 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-xs font-bold transition-colors font-armenian shrink-0 shadow-xs"
            >
              Բացել այս բաժինը
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {/* Presente */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 space-y-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                1. PRESENTE (Hoy)
              </span>
              <p className="text-sm font-bold text-white font-serif">
                ¿Qué haces hoy?
              </p>
              <p className="text-xs text-indigo-200 font-armenian">
                Ի՞նչ ես անում այսօր։
              </p>
              <div className="pt-2 border-t border-white/10 text-xs text-amber-300 font-medium">
                → Hoy <strong>estudio</strong> y <strong>juego</strong>.
              </div>
            </div>

            {/* Indefinido */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 space-y-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                2. INDEFINIDO (Ayer)
              </span>
              <p className="text-sm font-bold text-white font-serif">
                ¿Qué hiciste ayer?
              </p>
              <p className="text-xs text-indigo-200 font-armenian">
                Ի՞նչ արեցիր երեկ։
              </p>
              <div className="pt-2 border-t border-white/10 text-xs text-amber-300 font-medium">
                → Ayer <strong>estudié</strong> y <strong>jugué</strong>.
              </div>
            </div>

            {/* Futuro */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 space-y-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                3. FUTURO (Mañana)
              </span>
              <p className="text-sm font-bold text-white font-serif">
                ¿Qué harás mañana?
              </p>
              <p className="text-xs text-indigo-200 font-armenian">
                Ի՞նչ կանես վաղը։
              </p>
              <div className="pt-2 border-t border-white/10 text-xs text-amber-300 font-medium">
                → Mañana <strong>estudiaré</strong> y <strong>jugaré</strong>.
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 space-y-2 font-armenian">
        <div className="max-w-6xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            Իսպաներեն Խոսակցական Ուսուցման Հավելված (Español ⇄ Armenio)
          </p>
          <p className="text-slate-400 mt-1">
            Ներկա (Presente), Վերջերս կատարված անցյալ (Pretérito Perfecto),
            Ավարտված անցյալ (Indefinido), Սովորական անցյալ (Imperfecto), Ապառնի (Futuro).
          </p>
        </div>
      </footer>
    </div>
  );
}
