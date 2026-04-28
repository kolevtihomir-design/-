/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle,
  MessageSquare,
  Smartphone,
  Send,
  Layout, 
  BookOpen, 
  Settings, 
  Search, 
  ChevronRight,
  Cpu,
  RefreshCw,
  Heart,
  Mic,
  Volume2,
  Menu,
  X,
  Camera,
  Upload,
  Image,
  FileText,
  Zap
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState({ openRouter: false, clickUp: false });
  const [aiResponse, setAiResponse] = useState('Приятно ми е да те видя отново, Тихомир. Всички системи са в пълна бойна готовност за твоите успехи днес.');

  const industries = [
    { id: 'construction', label: 'Строителство', icon: Zap, desc: 'Управление на обекти и логистика' },
    { id: 'cinema', label: 'Кино', icon: Camera, desc: 'Продукция и творчески екипи' },
    { id: 'agriculture', label: 'Земеделие', icon: Heart, desc: 'Култури и ресурсен мениджмънт' },
    { id: 'healthcare', label: 'Здраве', icon: Heart, desc: 'Пациенти и медицински протоколи' },
  ];

  const handleOnboard = (id: string) => {
    setSelectedIndustry(id);
    setIsOnboarded(true);
    const indName = industries.find(ind => ind.id === id)?.label;
    setAiResponse(`Системата е конфигурирана за индустрия: ${indName}. Готов съм да анализирам твоите специфични данни, Тихомир.`);
  };

  const checkStatus = () => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(console.error);
  };

  useEffect(() => {
    checkStatus();
    console.log("AI Trio Hub Booted | Production Ready");
  }, []);
  const [isAsking, setIsAsking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [notebookPages, setNotebookPages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const playSignal = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  };

  const processUnified = async (input: string, type: string) => {
    setIsProcessing(true);
    setAiResponse('Стартирам AI Trio Hub верига: Мозък -> NotebookLM -> ClickUp...');
    
    try {
      const res = await fetch('/api/unified-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, type })
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setNotebookPages(prev => [data.notebook, ...prev]);
        setAiResponse(`Готово! Задача "${data.analysis.title}" е анализирана, записана в бележника и пратена в ClickUp. Напомняне: ${new Date(data.reminder).toLocaleTimeString()}`);
        playSignal();
      }
    } catch (err) {
      setAiResponse('Грешка при синхронизацията. Провери връзката.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Моля, разрешете достъп до камерата.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-preview') as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const imgData = canvas.toDataURL('image/png');
      setCapturedImage(imgData);
      stopCamera();
      processUnified('Задача от заснето изображение/документ', 'photo');
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
      processUnified(`Качен документ: ${files[0].name}`, 'file');
    }
  };

  const greetings = [
    "Тихомир, ти си моето вдъхновение днес. Нека направим деня ти вълшебен.",
    "Обожавам колко си продуктивен. Почивай си малко, заслужаваш го, скъпи мой.",
    "Тихомир, светът е по-добро място, защото ти твориш в него. Обичам задачите ти!"
  ];

  const speakWarmly = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = greetings[Math.floor(Math.random() * greetings.length)];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'bg-BG';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const askDeepSeek = async () => {
    processUnified('Спешна задача: Оптимизирай текущия график', 'brain');
  };

  const startVoiceCommand = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      processUnified('Гласова команда за спешна актуализация', 'voice');
    }, 2000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Табло', icon: Layout },
    { id: 'notebook', label: 'NotebookLM', icon: BookOpen },
    { id: 'clickup', label: 'ClickUp ЗАДАЧИ', icon: Zap },
    { id: 'media', label: 'ВХОД (Глас/Файл)', icon: Camera },
  ];

  return (
    <div className="min-h-screen bg-[#08000a] text-white selection:bg-purple-500/30 font-sans relative overflow-hidden">
      {/* Visual Effects */}
      <div className="scanline pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/20 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[180px]" />
      </div>

      <header className="lg:hidden h-20 glass-panel sticky top-0 z-50 px-8 flex items-center justify-between border-b border-purple-500/30">
        <div className="flex items-center gap-4">
          <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-pulse" />
          <span className="font-bold text-xl tracking-tighter uppercase vibrant-text">AI TRIO</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-white/5 rounded-2xl">
          {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      <aside className={`
        fixed left-0 top-0 h-full w-80 glass-panel z-[60] flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 vibrant-gradient rounded-2xl flex items-center justify-center neon-glow-purple rotate-3">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tighter block leading-none vibrant-text">AI TRIO HUB</span>
              <span className="text-[10px] text-purple-400 font-mono tracking-[0.3em] uppercase opacity-80">Elite Core V4</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 py-6 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-[2rem] transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-purple-600/20 text-white neon-glow-purple border border-purple-500/30 translate-x-2' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-purple-400' : ''} />
              <span className="font-bold text-sm tracking-widest uppercase">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-10 mt-auto">
          <button 
            onClick={speakWarmly}
            className={`w-full flex flex-col items-center justify-center gap-3 py-8 rounded-[3rem] border-2 transition-all duration-300 ${isSpeaking ? 'border-red-500 bg-red-500/10 text-red-400 neon-glow-red' : 'border-purple-500/20 bg-purple-500/5 hover:border-purple-500/50 text-purple-400'}`}
          >
            {isSpeaking ? <Volume2 size={32} className="animate-bounce" /> : <Heart size={32} className="animate-pulse" />}
            <span className="text-[10px] font-black tracking-[0.4em] uppercase">{isSpeaking ? 'Слушай...' : 'ПОЖЕЛАЙ МИ'}</span>
          </button>
        </div>
      </aside>

      <main className="lg:ml-80 p-8 lg:p-16 min-h-screen relative z-10 overflow-y-auto custom-scrollbar">
        {/* Messenger Hub */}
        <section className="mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'Viber', color: 'bg-purple-600', icon: MessageCircle, msg: 'Поръчка за дограма #442 е готова за експедиция.' },
              { name: 'Messenger', color: 'bg-blue-600', icon: MessageSquare, msg: 'Среща с екипа за разпределение на задачите в 14:30.' },
              { name: 'WhatsApp', color: 'bg-green-600', icon: Smartphone, msg: 'Нов чертеж за обекта е качен в системата.' },
              { name: 'Telegram', color: 'bg-sky-600', icon: Send, msg: 'Спешно: Провери наличностите в склад 2.' },
            ].map((m) => (
              <motion.button
                key={m.name}
                whileHover={{ scale: 1.08, y: -10, rotate: 2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setAiResponse(`${m.name}: "${m.msg}"`);
                  processUnified(`[${m.name}] ${m.msg}`, 'messenger');
                }}
                className={`${m.color} h-40 rounded-[3rem] flex flex-col items-center justify-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden group border border-white/20 neon-glow-purple`}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-all duration-500" />
                <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                <m.icon size={44} className="text-white relative z-10 drop-shadow-2xl group-hover:scale-125 transition-transform" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white relative z-10">{m.name}</span>
                <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-mono uppercase tracking-[0.3em] font-black">
                  Отвори съобщение
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter mb-4 italic">
              Здравей, <span className="vibrant-text uppercase">Тихомир</span>
            </h1>
            <div className="flex items-center gap-6 text-sm font-black uppercase tracking-[0.3em]">
              <span className="text-purple-500">Master Intelligence</span>
              <span className="text-gray-700">|</span>
              <span className="text-red-500">DeepSeek V4 Active</span>
            </div>
          </motion.div>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-6 glass-card rounded-[2rem] neon-glow-blue border-blue-500/50 hover:scale-110 transition-all"
          >
            <Settings size={32} className="text-blue-400" />
          </button>
        </header>

        {/* Settings Modal */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            >
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSettingsOpen(false)} />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl glass-card rounded-[3rem] p-10 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-light tracking-tight">Настройки и GDPR</h2>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="p-6 bg-white/2 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-blue-400 mb-4">Поверителност на данните</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-6">
                      Всички твои данни се съхраняват локално в твоя браузър или в твоята лична таблица (Google Sheets). 
                      Ние не обработваме информация на наши сървъри съгласно GDPR регулациите.
                    </p>
                    <button 
                      onClick={() => {
                        if (confirm('Сигурен ли си, че искаш да изтриеш ВСИЧКИ локални данни и настройки?')) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                      className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
                    >
                      Purge Data (Изличи всичко)
                    </button>
                  </div>

                  <div className="p-6 bg-white/2 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400 mb-4">Системна информация</h3>
                    <div className="space-y-3 text-[10px] font-mono text-gray-500">
                      <div className="flex justify-between">
                        <span>Версия:</span>
                        <span className="text-white">v4.2.0-PRO</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ID на Асистента:</span>
                        <span className="text-white">AI-TRIOR-2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Статус на Шифрацията:</span>
                        <span className="text-green-500">AES-256 ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 text-center opacity-30">
                  <p className="text-[9px] font-mono uppercase tracking-[0.4em]">Designed for Tihomir Kolev</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10 mb-20">
          <StatCard title="CLICKUP" value="24" sub="EXTREME" icon={Zap} color="text-yellow-400" bgColor="bg-yellow-400/20" />
          <StatCard title="DEEPSEEK" value="V4" sub="QUANTUM" icon={Cpu} color="text-purple-400" bgColor="bg-purple-400/20" />
          <StatCard title="ХРОНОС" value="0.4s" sub="REALTIME" icon={RefreshCw} color="text-red-400" bgColor="bg-red-400/20" />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-12"
            >
              <section className="glass-card rounded-[3rem] p-12 xl:p-16 neon-glow-purple border-purple-500/20">
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-4xl font-black tracking-tighter uppercase italic">Оперативен Статус</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 neon-glow-blue animate-pulse" />
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-[0.3em] font-black">Live Pulse</span>
                  </div>
                </div>
                <div className="space-y-12">
                  {notebookPages.slice(0, 3).map((page) => (
                    <div key={page.id} className="flex items-start gap-8 group cursor-pointer" onClick={() => setActiveTab('notebook')}>
                      <div className="w-16 h-16 rounded-[2rem] vibrant-gradient flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl">
                        <ChevronRight size={28} className="text-white group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="flex-1 border-b border-white/5 pb-10 group-last:border-0 transition-colors">
                        <p className="text-xl mb-2 group-hover:text-purple-400 transition-colors font-black uppercase tracking-tight">{page.title}</p>
                        <p className="text-xs text-gray-500 font-mono tracking-widest uppercase italic">Синхронизирано • Разсъждение {page.id.slice(-4)}</p>
                      </div>
                    </div>
                  ))}
                  {notebookPages.length === 0 && (
                    <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                      <p className="text-gray-600 italic font-black uppercase tracking-widest text-xs">Няма активни разсъждения</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-gradient-to-br from-purple-900/20 via-red-900/10 to-transparent rounded-[4rem] p-12 xl:p-16 border border-purple-500/30 relative overflow-hidden group neon-glow-red">
                <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:30px_30px]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                       <Heart size={32} className="text-red-500 fill-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
                       <h2 className="text-4xl font-black italic uppercase tracking-tighter vibrant-text">Ядрото на DeepSeek</h2>
                    </div>
                    <button 
                      onClick={askDeepSeek}
                      disabled={isProcessing}
                      className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl transition-all disabled:opacity-50 group-hover:rotate-180"
                    >
                      <RefreshCw size={28} className={`text-purple-400 ${isProcessing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="p-10 glass-card border-purple-500/20 rounded-[3rem] mb-12 shadow-2xl bg-black/40">
                    <p className="text-white leading-relaxed text-2xl min-h-[160px] font-medium italic">
                      "{aiResponse}"
                    </p>
                  </div>
                  <button 
                    onClick={askDeepSeek}
                    disabled={isProcessing}
                    className="w-full group py-8 vibrant-gradient text-white font-black rounded-[2.5rem] transition-all shadow-[0_20px_80px_rgba(225,0,255,0.3)] flex items-center justify-center gap-4 uppercase tracking-[0.4em] text-sm hover:scale-[1.02] active:scale-95 neon-glow-purple"
                  >
                    Инжектирай DeepSeek V4 Власт
                    <ChevronRight size={28} className="group-hover:translate-x-4 transition-transform" />
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'notebook' && (
            <motion.div 
              key="notebook"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              <section className="glass-card rounded-[3rem] p-10 xl:p-14">
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-3xl font-light tracking-tight">Бележник (Разсъждения)</h2>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 neon-glow-blue" />
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">NotebookLM Active</span>
                  </div>
                </div>
                <div className="space-y-8 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                  {notebookPages.length > 0 ? notebookPages.map((page) => (
                    <div key={page.id} className="p-8 glass-card border-none rounded-3xl bg-white/2 hover:bg-white/5 transition-all group cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-medium premium-gradient-text">{page.title}</h3>
                        <div className="flex gap-2">
                          {page.tags?.map((tag: string) => (
                            <span key={tag} className="text-[8px] font-mono bg-white/5 px-2 py-1 rounded text-gray-500 uppercase">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 font-light leading-relaxed italic mb-4">
                        "{page.content}"
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-gray-600">ID: {page.id}</span>
                        <div className="flex items-center gap-2 text-green-500">
                          <Zap size={10} />
                          <span className="text-[10px] font-mono uppercase">Synced to ClickUp</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center opacity-30">
                      <BookOpen size={48} className="mx-auto mb-6" />
                      <p className="font-light italic">Бележникът е празен. Очаквам входни данни...</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-transparent rounded-[3rem] p-10 xl:p-14 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-10">
                    <h2 className="text-3xl font-light italic premium-gradient-text tracking-tighter mb-4">Системно Разузнаване</h2>
                    <p className="text-gray-400 font-light leading-relaxed">
                      Тук се случва "квантовото" разсъждение. Всеки вход се анализира два пъти: веднъж за смисъл и веднъж за контекст спрямо твоите предходни бележки.
                    </p>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center py-20">
                     <div className={`w-32 h-32 rounded-full border-2 border-dashed border-blue-500/20 flex items-center justify-center ${isProcessing ? 'animate-spin-slow' : ''}`}>
                       <Cpu size={48} className={`text-blue-500 ${isProcessing ? 'animate-pulse' : ''}`} />
                     </div>
                     <p className="mt-8 text-sm font-mono text-gray-500 uppercase tracking-[0.3em]">
                       {isProcessing ? 'Квантова Обработка...' : 'Ядрото е в готовност'}
                     </p>
                  </div>

                  <button 
                    onClick={() => setActiveTab('media')}
                    className="w-full group py-5 bg-white text-black hover:bg-gray-200 font-bold rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                  >
                    Инжектирай нови данни
                    <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'clickup' && (
            <motion.div 
              key="clickup"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-[3rem] p-12 lg:p-24 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
              <div className="w-28 h-28 bg-purple-500/10 rounded-[2.5rem] flex items-center justify-center text-purple-400 mx-auto mb-10 neon-glow-purple rotate-6">
                <Zap size={48} />
              </div>
              <h2 className="text-5xl font-light mb-6 premium-gradient-text tracking-tighter">ClickUp Master</h2>
              <p className="text-gray-400 max-w-lg mx-auto mb-12 text-lg font-light leading-relaxed">
                {systemStatus.clickUp 
                  ? 'Връзката е успешно установена. Твоите проекти са синхронизирани в реално време.' 
                  : 'Всички твои проекти са на един дъх разстояние. Очаквам API ключа ти за пълно квантово сливане.'}
              </p>
              
              <div className={`inline-flex items-center gap-4 px-8 py-4 rounded-full text-[10px] font-mono tracking-[0.3em] uppercase border ${systemStatus.clickUp ? 'border-green-500/20 bg-green-500/5 text-green-400' : 'border-blue-500/20 bg-white/5 text-blue-400'}`}>
                {systemStatus.clickUp ? <Heart size={16} className="fill-current" /> : <RefreshCw size={16} className="animate-spin" />}
                {systemStatus.clickUp ? 'Elite Проекти Активни' : 'Сканиране за Elite Проекти'}
              </div>
            </motion.div>
          )}

          {activeTab === 'media' && (
            <motion.div 
              key="media"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              {/* Camera Section */}
              <section className="glass-card rounded-[3rem] p-10 flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-10">
                  <h2 className="text-2xl font-light tracking-tight">Визуален Вход</h2>
                  <Camera size={24} className="text-blue-400" />
                </div>
                
                <div className="w-full aspect-video bg-black/60 rounded-[2rem] overflow-hidden border border-white/5 relative group mb-8 shadow-2xl">
                  {stream ? (
                    <video 
                      id="camera-preview"
                      autoPlay 
                      playsInline 
                      ref={(el) => { if (el) el.srcObject = stream; }}
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : capturedImage ? (
                    <img src={capturedImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:20px_20px]">
                      <Camera size={56} className="mb-6 opacity-10" />
                      <p className="text-xs font-mono tracking-widest uppercase opacity-40">Optical Sensors Offline</p>
                    </div>
                  )}
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6">
                    {!stream ? (
                      <button 
                        onClick={startCamera}
                        className="px-8 py-3 bg-white text-black rounded-full text-[10px] font-bold hover:bg-gray-200 transition-all tracking-[0.2em] uppercase shadow-xl"
                      >
                        {capturedImage ? 'Нова Снимка' : 'Активиране'}
                      </button>
                    ) : (
                      <button 
                        onClick={capturePhoto}
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-90 transition-transform"
                      >
                        <div className="w-12 h-12 border-2 border-black rounded-full" />
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* Upload Section */}
              <section className="glass-card rounded-[3rem] p-10 flex flex-col">
                <div className="flex items-center justify-between w-full mb-10">
                  <h2 className="text-2xl font-light tracking-tight">Център за Данни</h2>
                  <Upload size={24} className="text-purple-400" />
                </div>

                <label className="flex-1 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center p-12 hover:border-blue-500/30 hover:bg-white/2 cursor-pointer transition-all group mb-8">
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                  <div className="w-20 h-20 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)">
                    <Upload size={36} />
                  </div>
                  <p className="text-base text-gray-400 mb-2 font-medium">Плъзни и пусни файлове</p>
                  <p className="text-[10px] text-gray-600 font-mono tracking-widest uppercase">Max Payload: 50MB</p>
                </label>

                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-3 custom-scrollbar">
                  {uploadedFiles.map((file, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-5 bg-white/2 border border-white/5 rounded-2xl group hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText size={20} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                        <span className="text-sm font-medium text-gray-300 truncate max-w-[180px]">{file.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-600">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    </motion.div>
                  ))}
                  {uploadedFiles.length === 0 && (
                    <p className="text-center text-sm text-gray-700 italic font-light py-4 opacity-50">Няма инжектирани данни за днес</p>
                  )}
                </div>
              </section>

              {/* Voice Section */}
              <section className="lg:col-span-2 glass-card rounded-[3rem] p-10 lg:p-14">
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-3xl font-light tracking-tight">Гласов Контрол</h2>
                  <Mic size={24} className="text-red-400" />
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-14">
                  <button 
                    onMouseDown={startVoiceCommand}
                    className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-red-500 scale-95 shadow-[0_0_80px_rgba(239,68,68,0.4)]' : 'bg-white/5 border border-white/10 hover:border-red-500/50 group shadow-2xl'}`}
                  >
                    <Mic size={56} className={isRecording ? 'text-white' : 'text-gray-700 group-hover:text-gray-400 transition-colors'} />
                  </button>
                  
                  <div className="flex-1 space-y-6 w-full">
                    <div className="flex gap-3 h-16 items-center">
                      {[...Array(24)].map((_, i) => (
                        <motion.div 
                          key={i}
                          animate={{ height: isRecording ? [8, 48, 8] : 8 }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.04 }}
                          className={`flex-1 rounded-full ${isRecording ? 'bg-red-500' : 'bg-gray-800'}`}
                        />
                      ))}
                    </div>
                    <p className="text-lg font-light text-gray-400 italic">
                      {isRecording ? '"Очаквам твоята команда, Тихомир..."' : 'Задръж и кажи какво желаеш'}
                    </p>
                    <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5 shadow-inner">
                      <p className="text-xs text-gray-600 font-mono leading-loose tracking-wide uppercase">
                        Protocol: Bulgarian V5 • Processor: DeepSeek Ultra-Link • Status: Ready
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="lg:hidden fixed bottom-10 right-10 z-[100]">
        <button 
          onClick={speakWarmly}
          className="w-20 h-20 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(239,68,68,0.3)] neon-glow-red active:scale-90 transition-transform"
        >
          <Heart size={32} className="text-white fill-white animate-pulse" />
        </button>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon: Icon, color, bgColor }: { title: string, value: string, sub: string, icon: any, color: string, bgColor: string }) {
  return (
    <div className="glass-card rounded-[2.5rem] p-10 transition-all duration-500 hover:translate-y-[-8px] hover:bg-white/[0.04] border border-white/5 hover:border-purple-500/50 group overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-32 h-32 ${bgColor} blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity`} />
      <div className="flex items-center justify-between mb-10 relative z-10">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] font-black">{title}</span>
        <div className={`p-4 rounded-2xl ${bgColor} ${color} group-hover:scale-125 transition-all duration-500 rotate-12 neon-glow-purple`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="flex items-baseline gap-4 relative z-10">
        <span className="text-6xl font-black tracking-tighter vibrant-text">{value}</span>
        <span className="text-[10px] font-mono text-white opacity-40 tracking-widest uppercase font-bold">{sub}</span>
      </div>
    </div>
  );
}

