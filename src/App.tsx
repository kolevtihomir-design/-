import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MiniSearch from 'minisearch';
import {
  Search, TrendingDown, Truck, BarChart3, Brain, Zap,
  CheckCircle, ArrowRight, Star, Package, Globe,
  ShieldCheck, X, Loader2, MapPin, Clock,
  DollarSign, Settings, Plus, Pencil, Trash2, Save, Lock, RefreshCw,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────
interface Product {
  id: number; name: string; category: string; supplier: string;
  factory_price: number; negotiated_price: number; discount_pct: number;
  delivery_days: number; warehouse: string; moq: number; weight_kg: number;
  tags: string;
}

// ─── Embedded Catalog ────────────────────────────────────────
const CATALOG: Product[] = [
  { id:1,  name: 'Хидравлична помпа 380V 15kW',          category: 'Машини',        supplier: 'Guangzhou Industrial Co.',   factory_price: 2400,  negotiated_price: 1680, discount_pct: 30, delivery_days: 7,  warehouse: 'Шенджен, CN',  moq: 1,   weight_kg: 38,  tags: 'помпа хидравлика машини 380v индустриален' },
  { id:2,  name: 'CNC Рутер 3-осен 1300x2500mm',          category: 'Машини',        supplier: 'Jinan CNC Factory',          factory_price: 8500,  negotiated_price: 5950, discount_pct: 30, delivery_days: 14, warehouse: 'Джинан, CN',   moq: 1,   weight_kg: 850, tags: 'cnc рутер фреза дърводелство 1325' },
  { id:3,  name: 'Индустриален компресор 7.5kW 300L',      category: 'Компресори',    supplier: 'Shanghai Compressor Ltd',    factory_price: 1200,  negotiated_price: 840,  discount_pct: 30, delivery_days: 10, warehouse: 'Шанхай, CN',   moq: 1,   weight_kg: 120, tags: 'компресор въздух индустриален 7.5kw 300l' },
  { id:4,  name: 'Електрическа количка 2T',                category: 'Транспорт',     supplier: 'Hangzhou Forklift Co.',      factory_price: 12000, negotiated_price: 8400, discount_pct: 30, delivery_days: 21, warehouse: 'Ханджоу, CN',  moq: 1,   weight_kg: 3200,tags: 'количка електрическа 2т склад' },
  { id:5,  name: 'LED Прожектор Highbay 200W IP65',        category: 'Осветление',    supplier: 'Shenzhen LED Corp',          factory_price: 45,    negotiated_price: 28,   discount_pct: 38, delivery_days: 5,  warehouse: 'Шенджен, CN',  moq: 50,  weight_kg: 2.8, tags: 'led highbay прожектор 200w склад цех осветление' },
  { id:6,  name: 'VFD Честотен инвертор 7.5kW 380V',       category: 'Електроника',   supplier: 'Inovance Technology',        factory_price: 320,   negotiated_price: 220,  discount_pct: 31, delivery_days: 7,  warehouse: 'Шенджен, CN',  moq: 5,   weight_kg: 3.2, tags: 'vfd инвертор честотен 7.5kw честота двигател' },
  { id:7,  name: 'Заваръчен апарат MIG 350A 3-фазен',      category: 'Заваряване',    supplier: 'Jasic Welding Equipment',    factory_price: 890,   negotiated_price: 620,  discount_pct: 30, delivery_days: 8,  warehouse: 'Джуджоу, CN',  moq: 1,   weight_kg: 22,  tags: 'заваряване мig 350a сварка 3-фазен' },
  { id:8,  name: 'Електрически двигател IE3 11kW B3',       category: 'Двигатели',     supplier: 'NEMA Motors International', factory_price: 780,   negotiated_price: 540,  discount_pct: 31, delivery_days: 9,  warehouse: 'Тянджин, CN',  moq: 1,   weight_kg: 58,  tags: 'двигател електрически ie3 11kw асинхронен' },
  { id:9,  name: 'PLC Контролер S7-1200 Compatible',        category: 'Автоматизация', supplier: 'Compatible Automation Ltd', factory_price: 280,   negotiated_price: 190,  discount_pct: 32, delivery_days: 6,  warehouse: 'Шенджен, CN',  moq: 3,   weight_kg: 0.8, tags: 'plc контролер автоматизация siemens s7 1200' },
  { id:10, name: 'Термална камера -20/+550°C',              category: 'Измерване',     supplier: 'HikMicro Technology',       factory_price: 1800,  negotiated_price: 1250, discount_pct: 31, delivery_days: 10, warehouse: 'Ханджоу, CN',  moq: 1,   weight_kg: 0.5, tags: 'термална камера температура flir инфрачервена измерване' },
  { id:11, name: 'Пневматичен цилиндър 50x200mm 10бр',      category: 'Пневматика',    supplier: 'AirTAC International',      factory_price: 240,   negotiated_price: 165,  discount_pct: 31, delivery_days: 7,  warehouse: 'Нинго, CN',    moq: 1,   weight_kg: 6,   tags: 'пневматика цилиндър пневматичен airtac 50x200' },
  { id:12, name: 'UPS Промишлен 6kVA Online',               category: 'Електроника',   supplier: 'Huawei Power Ltd',          factory_price: 1400,  negotiated_price: 975,  discount_pct: 30, delivery_days: 8,  warehouse: 'Шенджен, CN',  moq: 1,   weight_kg: 35,  tags: 'ups промишлен непрекъснато 6kva online power' },
  { id:13, name: 'Хидравлично масло ISO VG 46, 200L',       category: 'Смазочни',      supplier: 'SinoPec Lubricants',        factory_price: 480,   negotiated_price: 330,  discount_pct: 31, delivery_days: 12, warehouse: 'Бейджин, CN',  moq: 1,   weight_kg: 185, tags: 'масло хидравлично iso vg46 200l смазка' },
  { id:14, name: 'Дебиломер DN50 Ултразвуков',              category: 'Измерване',     supplier: 'Sino Measurement Co.',      factory_price: 640,   negotiated_price: 440,  discount_pct: 31, delivery_days: 8,  warehouse: 'Шанхай, CN',   moq: 1,   weight_kg: 2.5, tags: 'дебиломер flowmeter dn50 ултразвуков digital измерване' },
  { id:15, name: 'Стоманена тръба 50x50x3mm 6m 100бр',      category: 'Метали',        supplier: 'Baosteel Group Corp',       factory_price: 18,    negotiated_price: 12,   discount_pct: 33, delivery_days: 14, warehouse: 'Шанхай, CN',   moq: 100, weight_kg: 26,  tags: 'тръба стоманена квадратна 50x50 метал конструкция' },
  { id:16, name: 'Лагер 6205-2RS 100бр',                    category: 'Механика',      supplier: 'NSK Bearings Compatible',  factory_price: 180,   negotiated_price: 120,  discount_pct: 33, delivery_days: 6,  warehouse: 'Нинго, CN',    moq: 100, weight_kg: 4,   tags: 'лагер bearing 6205 2rs механика' },
  { id:17, name: 'Индустриален изсушител 80L/ден',           category: 'Климатизация',  supplier: 'Bry-Air Asia',              factory_price: 820,   negotiated_price: 570,  discount_pct: 30, delivery_days: 9,  warehouse: 'Гуанджоу, CN', moq: 1,   weight_kg: 28,  tags: 'изсушител dehumidifier климатизация промишлен 80l' },
  { id:18, name: 'Промишлен вентилатор 3-фазен 0.75kW',      category: 'Климатизация',  supplier: 'Ziehl-Abegg Compatible',   factory_price: 380,   negotiated_price: 260,  discount_pct: 32, delivery_days: 7,  warehouse: 'Шанхай, CN',   moq: 2,   weight_kg: 8,   tags: 'вентилатор промишлен 3-фазен 0.75kw климатизация' },
  { id:19, name: 'Индустриален суич 24-порта',               category: 'Мрежи',         supplier: 'H3C Technologies Co.',      factory_price: 420,   negotiated_price: 290,  discount_pct: 31, delivery_days: 5,  warehouse: 'Шенджен, CN',  moq: 1,   weight_kg: 2.8, tags: 'прекъсвач switch 24-порта мрежа lan индустриален' },
  { id:20, name: 'Лентова шлайфмашина 150x1220mm',           category: 'Инструменти',   supplier: 'Metabo Compatible',         factory_price: 560,   negotiated_price: 385,  discount_pct: 31, delivery_days: 7,  warehouse: 'Ченду, CN',    moq: 1,   weight_kg: 15,  tags: 'шлайфмашина лентова 150mm шлайф инструмент' },
  { id:21, name: 'Предпазни ръкавици Cut-5 24 чифта',        category: 'ЛПС',           supplier: 'Ansell Healthcare',         factory_price: 120,   negotiated_price: 75,   discount_pct: 38, delivery_days: 5,  warehouse: 'Шенджен, CN',  moq: 1,   weight_kg: 1.5, tags: 'ръкавици cut-5 предпазни лпс безопасност' },
  { id:22, name: 'Въглеродна стоманена плоча 4mm 1x2m',      category: 'Метали',        supplier: 'Ansteel Metal Group',       factory_price: 68,    negotiated_price: 47,   discount_pct: 31, delivery_days: 14, warehouse: 'Аншан, CN',    moq: 10,  weight_kg: 62,  tags: 'плоча стоманена въглеродна 4mm метал лист' },
  { id:23, name: 'Тръбни фитинги 304 SS 200бр',              category: 'Тръбопроводи',  supplier: 'YongGao Pipe Fittings',    factory_price: 380,   negotiated_price: 260,  discount_pct: 32, delivery_days: 8,  warehouse: 'Вензджоу, CN', moq: 1,   weight_kg: 12,  tags: 'фитинги тръба 304 ss неръждаема стомана тръбопровод' },
  { id:24, name: 'Бояджийски пистолет HVLP 1.4mm',           category: 'Инструменти',   supplier: 'Devilbiss Compatible',      factory_price: 560,   negotiated_price: 385,  discount_pct: 31, delivery_days: 6,  warehouse: 'Нинго, CN',    moq: 1,   weight_kg: 0.9, tags: 'пистолет боядисване hvlp 1.4mm лакиране' },
  { id:25, name: 'Power Quality Анализатор',                  category: 'Измерване',     supplier: 'Fluke Compatible',          factory_price: 1200,  negotiated_price: 835,  discount_pct: 30, delivery_days: 8,  warehouse: 'Шенджен, CN',  moq: 1,   weight_kg: 2.5, tags: 'честотомер мрежа анализатор power quality fluke измерване' },
];

const fmt = (n: number) => new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const DEMO_QUERIES = ['хидравлична помпа', 'компресор', 'led прожектор', 'заваръчен апарат', 'cnc рутер'];
const CONTACT_EMAIL = 'kolev.tihomir@gmail.com';

export default function App() {
  const [view, setView] = useState<'search' | 'result' | 'catalog'>('search');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<Product | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [catalogQuery, setCatalogQuery] = useState('');

  // Build MiniSearch index in browser
  const engine = useMemo(() => {
    const ms = new MiniSearch({
      fields: ['name', 'category', 'supplier', 'tags'],
      storeFields: ['id','name','category','supplier','factory_price','negotiated_price','discount_pct','delivery_days','warehouse','moq','weight_kg'],
      searchOptions: { boost: { name: 3, tags: 2.5, category: 1.5 }, fuzzy: 0.25, prefix: true },
    });
    ms.addAll(CATALOG);
    return ms;
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % DEMO_QUERIES.length), 3000);
    return () => clearInterval(t);
  }, []);

  const handleDemoSearch = useCallback((q?: string) => {
    const sq = q || query;
    if (!sq.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const results = engine.search(sq);
      const product = results.length > 0
        ? CATALOG.find(p => p.id === (results[0] as any).id) || CATALOG[0]
        : CATALOG[0];
      setDemoResult(product);
      setView('result');
      setLoading(false);
      setTimeout(() => setShowPaywall(true), 2500);
    }, 800);
  }, [query, engine]);

  const handleCatalogSearch = (q: string) => {
    setCatalogQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const results = engine.search(q);
    setSearchResults(results.map(r => CATALOG.find(p => p.id === (r as any).id)!).filter(Boolean));
  };

  const displayed = catalogQuery.trim() ? searchResults : CATALOG;

  return (
    <div className="min-h-screen bg-[#070a12] text-white font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[200px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView('search'); setShowPaywall(false); }}>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Package size={18} className="text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight">AI-Покупки</span>
              <span className="text-[10px] text-blue-400 font-mono tracking-wider ml-2">B2B PLATFORM</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setView('catalog')}
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">
              Каталог ({CATALOG.length})
            </button>
            <button onClick={() => setShowPaywall(true)}
              className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full">
              от 9.90 EUR / месец →
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* SEARCH VIEW */}
        {view === 'search' && (
          <motion.div key="search" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-xs text-blue-400 font-medium mb-8">
              <Zap size={12} /> B2B Промишлен AI — директно от производителя
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
              Намери всеки<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">B2B продукт</span>
              <br />на фабрична цена
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
              AI агент преговаря директно с доставчика. Средно{' '}
              <span className="text-white font-bold">31% под пазарна цена</span>.
              DHL логистика. Ценов одит. 25 B2B продукта.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="relative max-w-2xl mx-auto mb-8">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDemoSearch()}
                    placeholder={`Напр. "${DEMO_QUERIES[placeholderIdx]}"`}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 py-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 text-base transition-all" />
                </div>
                <button onClick={() => handleDemoSearch()} disabled={loading || !query.trim()}
                  className="px-8 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-bold text-sm tracking-wide hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-blue-500/30">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Търси'}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-2 mb-16">
              {DEMO_QUERIES.map(q => (
                <button key={q} onClick={() => { setQuery(q); handleDemoSearch(q); }}
                  className="text-xs bg-white/5 border border-white/10 rounded-full px-4 py-2 text-gray-400 hover:text-white hover:border-white/20 transition-all">
                  {q}
                </button>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
              {[['842+', 'B2B търсения'], ['31%', 'средна отстъпка'], ['145к EUR', 'спестено']].map(([val, label]) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-black text-white mb-1">{val}</div>
                  <div className="text-xs text-gray-500 font-medium">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* RESULT VIEW */}
        {view === 'result' && demoResult && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 max-w-4xl mx-auto px-6 py-12">
            <button onClick={() => { setView('search'); setShowPaywall(false); }}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors">
              ← Ново търсене
            </button>
            <div className="text-xs text-blue-400 font-mono tracking-wider mb-4">ДЕМО РЕЗУЛТАТ — MiniSearch Engine (client-side)</div>

            <div className="bg-white/3 border border-white/10 rounded-3xl p-8 mb-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full mb-3 inline-block">{demoResult.category}</span>
                  <h2 className="text-2xl font-bold mb-1">{demoResult.name}</h2>
                  <p className="text-gray-400 text-sm flex items-center gap-2"><Globe size={12} /> {demoResult.supplier}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-black">{fmt(demoResult.negotiated_price)}</div>
                  <div className="text-sm text-gray-500 line-through">{fmt(demoResult.factory_price)}</div>
                  <div className="text-green-400 text-sm font-bold">-{demoResult.discount_pct}%</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { icon: MapPin, label: 'Склад', value: demoResult.warehouse },
                  { icon: Clock, label: 'Доставка', value: `${demoResult.delivery_days} дни` },
                  { icon: Package, label: 'МОК', value: `${demoResult.moq} бр.` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-white/3 rounded-2xl p-4">
                    <Icon size={14} className="text-gray-500 mb-2" />
                    <div className="text-xs text-gray-500 mb-1">{label}</div>
                    <div className="text-sm font-semibold">{value}</div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={16} className="text-green-400" />
                  <span className="text-sm font-bold text-green-400">ROI ДОКАЗАТЕЛСТВО</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-green-400">{fmt(demoResult.factory_price - demoResult.negotiated_price)}</div>
                    <div className="text-xs text-gray-400 mt-1">спестено на поръчка</div>
                  </div>
                  <div className="text-center border-l border-r border-white/10">
                    <div className="text-2xl font-black text-blue-400">{fmt((demoResult.factory_price - demoResult.negotiated_price) * 12)}</div>
                    <div className="text-xs text-gray-400 mt-1">ROI за 12 месеца</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-purple-400">{demoResult.discount_pct}%</div>
                    <div className="text-xs text-gray-400 mt-1">под пазарна цена</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8 opacity-50">
              {[
                { icon: Truck, label: 'DHL Логистика', sub: 'Шенджен → България' },
                { icon: BarChart3, label: 'Ценови Одит', sub: 'vs Amazon & пазар' },
                { icon: Brain, label: 'AI Препоръки', sub: 'HuggingFace ML модел' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-white/3 border border-white/5 rounded-2xl p-4 relative">
                  <div className="absolute inset-0 bg-black/40 rounded-2xl backdrop-blur-[2px] flex items-center justify-center">
                    <ShieldCheck size={20} className="text-gray-500" />
                  </div>
                  <Icon size={18} className="text-gray-500 mb-2" />
                  <div className="text-sm font-semibold text-gray-400">{label}</div>
                  <div className="text-xs text-gray-600">{sub}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowPaywall(true)}
              className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-black text-lg tracking-wide hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30">
              Отключи пълния достъп — от 9.90 EUR <ArrowRight size={20} />
            </button>
          </motion.div>
        )}

        {/* CATALOG VIEW */}
        {view === 'catalog' && (
          <motion.div key="catalog" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black">B2B Каталог</h2>
                <p className="text-gray-500 text-sm">{displayed.length} продукта · Директно от производителя</p>
              </div>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input value={catalogQuery} onChange={e => handleCatalogSearch(e.target.value)}
                placeholder="Търси продукт, категория, доставчик..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 text-sm transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map(p => (
                <motion.div key={p.id} layout
                  className="bg-white/3 border border-white/8 rounded-2xl p-5 hover:border-blue-500/30 transition-all cursor-pointer"
                  onClick={() => { setDemoResult(p); setView('result'); setShowPaywall(false); }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{p.category}</span>
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">-{p.discount_pct}%</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-2 leading-snug">{p.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{p.supplier}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black text-lg">{fmt(p.negotiated_price)}</div>
                      <div className="text-xs text-gray-600 line-through">{fmt(p.factory_price)}</div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>{p.delivery_days} дни</div>
                      <div>MOQ {p.moq}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAYWALL MODAL */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-6">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowPaywall(false)} />
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0d1118] border border-white/10 rounded-3xl p-8 shadow-2xl">
              <button onClick={() => setShowPaywall(false)} className="absolute top-5 right-5 text-gray-500 hover:text-white">
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                  <Package size={24} />
                </div>
                <h2 className="text-2xl font-black mb-2">Отключи пълния достъп</h2>
                <p className="text-gray-400 text-sm">Неограничено търсене · DHL логистика · AI предложения · Ценов одит</p>
              </div>

              {demoResult && (
                <div className="bg-green-500/8 border border-green-500/15 rounded-2xl p-4 mb-5">
                  <div className="text-xs text-green-400 font-bold mb-2">ВЪЗ ОСНОВА НА ДЕМОТО ТИ:</div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">Спестено на поръчка</span>
                    <span className="font-bold text-green-400">{fmt(demoResult.factory_price - demoResult.negotiated_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1 pt-2 border-t border-white/5">
                    <span className="text-gray-400">ROI в посока 9,90 EUR/мес.</span>
                    <span className="font-black text-green-400">{Math.round((demoResult.factory_price - demoResult.negotiated_price) / 9.9)}x</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { name: 'Стартер', price: '9.90', desc: '50 търсения/месец' },
                  { name: 'Про', price: '49', desc: 'Неограничени + AI', highlight: true },
                ].map(plan => (
                  <div key={plan.name}
                    className={`p-4 rounded-2xl border text-left ${plan.highlight ? 'border-blue-500/60 bg-blue-500/10' : 'border-white/10 bg-white/3'}`}>
                    <div className={`text-xs font-bold mb-1 ${plan.highlight ? 'text-blue-400' : 'text-gray-400'}`}>{plan.name}</div>
                    <div className="text-xl font-black">{plan.price} <span className="text-sm font-normal text-gray-400">EUR/мес.</span></div>
                    <div className="text-xs text-gray-500 mt-1">{plan.desc}</div>
                  </div>
                ))}
              </div>

              <a href={`mailto:${CONTACT_EMAIL}?subject=AI-Покупки достъп&body=Здравейте, искам достъп до AI-Покупки платформата.`}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-black text-base hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30">
                Поръчай достъп — {CONTACT_EMAIL}
                <ArrowRight size={20} />
              </a>

              <p className="text-center text-xs text-gray-600 mt-3 flex items-center justify-center gap-2">
                <ShieldCheck size={12} /> Отговор до 24 часа · Плащане с банков превод или карта
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
