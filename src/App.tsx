import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, TrendingDown, Truck, BarChart3, Brain, Zap,
  CheckCircle, ArrowRight, Star, Package, Globe,
  ShieldCheck, X, ChevronDown, Loader2, MapPin, Clock,
  DollarSign, AlertTriangle, ExternalLink, RefreshCw,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────
interface Product {
  id: string; name: string; category: string; supplier: string;
  factory_price: number; negotiated_price: number; discount_pct: number;
  delivery_days: number; warehouse: string; moq: number; weight_kg: number;
  savings_eur: number; roi_annual_eur: number;
}
interface Logistics { source: string; route: string; service: string; delivery_days: number; cost_eur: number; }
interface PriceAudit { source: string; amazon_price_eur: number; factory_price_eur: number; our_price_eur: number; savings_vs_amazon_pct: number; market_position: string; }
interface Recommendation { id: string; name: string; category: string; negotiated_price: number; discount_pct: number; ml_score: number; model: string; }
interface Analytics { total_searches: number; paid_searches: number; total_savings_eur: number; total_orders: number; avg_discount_pct: number; demo_to_paid_rate: number; }

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Demo queries ─────────────────────────────────────────────
const DEMO_QUERIES = ['хидравлична помпа', 'компресор', 'led прожектор', 'заваръчен апарат', 'cnc рутер'];

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<'search' | 'result' | 'platform'>('search');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<Product | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'logistics' | 'prices' | 'ai' | 'analytics'>('search');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [logisticsData, setLogisticsData] = useState<Logistics | null>(null);
  const [priceData, setPriceData] = useState<PriceAudit | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [analyticsData, setAnalyticsData] = useState<Analytics | null>(null);
  const [fullSearchResults, setFullSearchResults] = useState<Product[]>([]);
  const [fullSearchQuery, setFullSearchQuery] = useState('');
  const [tabLoading, setTabLoading] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % DEMO_QUERIES.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('ai_pokupki_token');
    if (saved) {
      fetch(`/api/verify/${saved}`).then(r => r.json()).then(d => {
        if (d.paid) { setHasAccess(true); setAccessToken(saved); setView('platform'); }
      }).catch(() => {});
    }
    // Check for Stripe redirect
    const params = new URLSearchParams(location.search);
    const sid = params.get('session_id');
    if (sid) {
      fetch(`/api/verify/${sid}`).then(r => r.json()).then(d => {
        if (d.paid) {
          localStorage.setItem('ai_pokupki_token', d.token);
          setHasAccess(true); setAccessToken(d.token); setView('platform');
          history.replaceState({}, '', '/');
        }
      }).catch(() => {});
    }
  }, []);

  // ── Demo Search ───────────────────────────────────────────
  const handleDemoSearch = useCallback(async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/search/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (data.success) {
        setDemoResult(data.product);
        setView('result');
        await sleep(800);
        setShowPaywall(true);
      }
    } catch (e) {
      alert('Грешка при търсене. Моля опитайте отново.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  // ── Checkout ──────────────────────────────────────────────
  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.test_token) {
        // Test mode — grant access immediately
        localStorage.setItem('ai_pokupki_token', data.test_token);
        setAccessToken(data.test_token);
        setHasAccess(true);
        setShowPaywall(false);
        setView('platform');
        loadPlatformData(data.test_token);
      }
    } catch (e) {
      alert('Грешка при плащане. Моля опитайте отново.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── Load platform data ────────────────────────────────────
  const loadPlatformData = useCallback(async (token?: string) => {
    const t = token || accessToken;
    setTabLoading(true);
    try {
      const [logRes, priceRes, recRes, analyticsRes] = await Promise.all([
        fetch('/api/logistics', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_name: demoResult?.name || 'industrial equipment', weight_kg: demoResult?.weight_kg || 10 }),
        }).then(r => r.json()),
        fetch('/api/prices', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_name: demoResult?.name || 'industrial pump', factory_price: demoResult?.factory_price || 1000 }),
        }).then(r => r.json()),
        fetch('/api/recommendations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: demoResult?.name || query, product_id: demoResult?.id }),
        }).then(r => r.json()),
        fetch('/api/analytics').then(r => r.json()),
      ]);
      if (logRes.success) setLogisticsData(logRes.logistics);
      if (priceRes.success) setPriceData(priceRes.price_audit);
      if (recRes.success) setRecommendations(recRes.recommendations);
      if (analyticsRes.success) setAnalyticsData(analyticsRes);
    } catch (e) {
      console.error('Platform data error:', e);
    } finally {
      setTabLoading(false);
    }
  }, [accessToken, demoResult, query]);

  useEffect(() => {
    if (view === 'platform' && hasAccess) loadPlatformData();
  }, [view]);

  // ── Full search (paid) ────────────────────────────────────
  const handleFullSearch = async () => {
    if (!fullSearchQuery.trim()) return;
    setTabLoading(true);
    try {
      const res = await fetch('/api/search/full', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullSearchQuery, token: accessToken }),
      });
      const data = await res.json();
      if (data.success) setFullSearchResults(data.results);
    } catch (e) {
      console.error('Full search error:', e);
    } finally {
      setTabLoading(false);
    }
  };

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070a12] text-white font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[200px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Package size={18} className="text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight">AI-Покупки</span>
              <span className="text-[10px] text-blue-400 font-mono tracking-wider ml-2">B2B PLATFORM</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {hasAccess ? (
              <span className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-full">
                <CheckCircle size={12} /> Активен достъп
              </span>
            ) : (
              <button onClick={() => setShowPaywall(true)} className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                0.99 EUR / месец →
              </button>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* ── SEARCH VIEW ─────────────────────────────────── */}
        {view === 'search' && (
          <motion.div key="search" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-xs text-blue-400 font-medium mb-8">
              <Zap size={12} /> B2B Промишлен AI — реална интеграция с DHL, Keepa, HuggingFace ML
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
              Намери всеки<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">B2B продукт</span>
              <br />на фабрична цена
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
              AI агент преговаря директно с доставчика. Средно <span className="text-white font-bold">31% под пазарна цена</span>.
              DHL логистика. Ценов одит с Keepa. 1 безплатно търсене.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="relative max-w-2xl mx-auto mb-8">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text" value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDemoSearch()}
                    placeholder={`Напр. "${DEMO_QUERIES[placeholderIdx]}"`}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 py-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 text-base transition-all"
                  />
                </div>
                <button
                  onClick={() => handleDemoSearch()}
                  disabled={loading || !query.trim()}
                  className="px-8 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-bold text-sm tracking-wide hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-blue-500/30"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Търси'}
                </button>
              </div>
            </motion.div>

            {/* Quick demo queries */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-2 mb-16">
              {DEMO_QUERIES.map(q => (
                <button key={q} onClick={() => { setQuery(q); handleDemoSearch(q); }}
                  className="text-xs bg-white/5 border border-white/10 rounded-full px-4 py-2 text-gray-400 hover:text-white hover:border-white/20 transition-all">
                  {q}
                </button>
              ))}
            </motion.div>

            {/* Stats row */}
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

        {/* ── RESULT VIEW ──────────────────────────────────── */}
        {view === 'result' && demoResult && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 max-w-4xl mx-auto px-6 py-12">

            <button onClick={() => { setView('search'); setShowPaywall(false); }}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors">
              ← Ново търсене
            </button>

            <div className="text-xs text-blue-400 font-mono tracking-wider mb-4">
              ДЕМО РЕЗУЛТАТ — MiniSearch Engine
            </div>

            {/* Product card */}
            <div className="bg-white/3 border border-white/10 rounded-3xl p-8 mb-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full mb-3 inline-block">{demoResult.category}</span>
                  <h2 className="text-2xl font-bold mb-1">{demoResult.name}</h2>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <Globe size={12} /> {demoResult.supplier}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-black text-white">{fmt(demoResult.negotiated_price)}</div>
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

              {/* ROI PROOF — visible BEFORE paywall */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={16} className="text-green-400" />
                  <span className="text-sm font-bold text-green-400">ROI ДОКАЗАТЕЛСТВО — преди плащане</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-green-400">{fmt(demoResult.savings_eur)}</div>
                    <div className="text-xs text-gray-400 mt-1">спестено на поръчка</div>
                  </div>
                  <div className="text-center border-l border-r border-white/10">
                    <div className="text-2xl font-black text-blue-400">{fmt(demoResult.roi_annual_eur)}</div>
                    <div className="text-xs text-gray-400 mt-1">ROI за 12 месеца</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-purple-400">{demoResult.discount_pct}%</div>
                    <div className="text-xs text-gray-400 mt-1">под пазарна цена</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4 text-center">
                  При 1 поръчка/месец → <span className="text-white font-bold">{fmt(demoResult.roi_annual_eur)} годишна икономия</span>
                  {' '}срещу само <span className="text-white font-bold">0.99 EUR/месец</span> за достъп
                </p>
              </div>
            </div>

            {/* Teaser — what's behind paywall */}
            <div className="grid grid-cols-3 gap-4 mb-8 opacity-60">
              {[
                { icon: Truck, label: 'DHL Логистика', sub: 'Реална цена Шенджен→БГ' },
                { icon: DollarSign, label: 'Keepa Ценов Одит', sub: 'Amazon vs Factory' },
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
              Отключи пълния достъп — 0.99 EUR
              <ArrowRight size={20} />
            </button>
          </motion.div>
        )}

        {/* ── PLATFORM VIEW ────────────────────────────────── */}
        {view === 'platform' && hasAccess && (
          <motion.div key="platform" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="relative z-10 max-w-7xl mx-auto px-6 py-8">

            {/* Tabs */}
            <div className="flex gap-1 bg-white/3 border border-white/8 rounded-2xl p-1 mb-8 overflow-x-auto">
              {[
                { id: 'search', label: 'Търсене', icon: Search },
                { id: 'logistics', label: 'DHL Логистика', icon: Truck },
                { id: 'prices', label: 'Ценов Одит', icon: BarChart3 },
                { id: 'ai', label: 'AI Препоръки', icon: Brain },
                { id: 'analytics', label: 'Аналитика', icon: TrendingDown },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-gray-500 hover:text-white'}`}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            {tabLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-400" size={32} />
              </div>
            )}

            {!tabLoading && (
              <AnimatePresence mode="wait">
                {/* Search Tab */}
                {activeTab === 'search' && (
                  <motion.div key="search-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex gap-3 mb-8">
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input value={fullSearchQuery} onChange={e => setFullSearchQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleFullSearch()}
                          placeholder="Търси в каталога — 25 B2B продукта..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 text-sm transition-all" />
                      </div>
                      <button onClick={handleFullSearch}
                        className="px-6 py-3.5 bg-blue-500 rounded-xl font-bold text-sm hover:bg-blue-400 transition-all">
                        Търси
                      </button>
                    </div>

                    {fullSearchResults.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-500 mb-4">{fullSearchResults.length} резултата · MiniSearch Engine</p>
                        {fullSearchResults.map((p: any) => (
                          <div key={p.id} className="bg-white/3 border border-white/8 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-white/15 transition-all">
                            <div>
                              <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full mr-2">{p.category}</span>
                              <span className="font-semibold text-sm">{p.name}</span>
                              <p className="text-xs text-gray-500 mt-1">{p.supplier} · {p.warehouse}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-black text-lg">{fmt(p.negotiated_price)}</div>
                              <div className="text-xs text-green-400 font-bold">-{p.discount_pct}% · спест. {fmt(p.savings_eur)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <p className="col-span-full text-gray-500 text-sm mb-2">Популярни продукти:</p>
                        {recommendations.slice(0, 6).map(r => (
                          <div key={r.id} onClick={() => { setFullSearchQuery(r.name); handleFullSearch(); }}
                            className="bg-white/3 border border-white/8 rounded-2xl p-5 cursor-pointer hover:border-blue-500/30 transition-all">
                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{r.category}</span>
                            <p className="font-semibold text-sm mt-2 mb-1">{r.name}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-black text-blue-400">{fmt(r.negotiated_price)}</span>
                              <span className="text-xs text-green-400">-{r.discount_pct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Logistics Tab */}
                {activeTab === 'logistics' && logisticsData && (
                  <motion.div key="logistics-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white/3 border border-white/8 rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                            <Truck size={20} className="text-orange-400" />
                          </div>
                          <div>
                            <h3 className="font-bold">DHL Логистика</h3>
                            <p className="text-xs text-gray-500">{logisticsData.source}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {[
                            ['Маршрут', logisticsData.route],
                            ['Услуга', logisticsData.service],
                            ['Доставка', `${logisticsData.delivery_days} работни дни`],
                            ['Цена', fmt(logisticsData.cost_eur)],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-center py-3 border-b border-white/5">
                              <span className="text-sm text-gray-400">{label}</span>
                              <span className="font-semibold text-sm">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/10 rounded-3xl p-8 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold mb-2">Защо DHL Express?</h3>
                          <ul className="space-y-3 text-sm text-gray-400">
                            {['Директен полет Шенджен → София', 'Митническо освобождаване включено', 'Track & Trace в реално време', 'Застраховка до €50,000'].map(item => (
                              <li key={item} className="flex items-center gap-3">
                                <CheckCircle size={14} className="text-green-400 flex-shrink-0" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button onClick={() => loadPlatformData()}
                          className="mt-6 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                          <RefreshCw size={14} /> Опресни логистична оферта
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Prices Tab */}
                {activeTab === 'prices' && priceData && (
                  <motion.div key="prices-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white/3 border border-white/8 rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <BarChart3 size={20} className="text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-bold">Keepa Ценови Одит</h3>
                            <p className="text-xs text-gray-500">{priceData.source}</p>
                          </div>
                        </div>

                        <div className="space-y-4 mb-6">
                          {[
                            { label: 'Amazon цена', value: fmt(priceData.amazon_price_eur), color: 'text-red-400' },
                            { label: 'Фабрична цена', value: fmt(priceData.factory_price_eur), color: 'text-yellow-400' },
                            { label: 'Нашата цена', value: fmt(priceData.our_price_eur), color: 'text-green-400' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="flex justify-between items-center py-3 border-b border-white/5">
                              <span className="text-sm text-gray-400">{label}</span>
                              <span className={`font-bold ${color}`}>{value}</span>
                            </div>
                          ))}
                        </div>

                        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                          <div className="text-3xl font-black text-green-400">{priceData.savings_vs_amazon_pct}%</div>
                          <div className="text-sm text-gray-400 mt-1">по-евтино от Amazon</div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/10 rounded-3xl p-8">
                        <h3 className="font-bold mb-4">Пазарна позиция</h3>
                        <div className="flex items-center gap-2 mb-6">
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          <span className="text-green-400 font-bold text-lg">BELOW MARKET</span>
                        </div>
                        <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-2">
                          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                            style={{ width: `${Math.min(priceData.savings_vs_amazon_pct, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500">Нашата цена спрямо пазарната цена</p>

                        <div className="mt-8 space-y-3">
                          {['Директно от производителя', 'Без посредници', 'Договорена цена от AI агент'].map(item => (
                            <div key={item} className="flex items-center gap-3 text-sm text-gray-400">
                              <Star size={13} className="text-yellow-400 flex-shrink-0" fill="currentColor" /> {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* AI Recommendations Tab */}
                {activeTab === 'ai' && (
                  <motion.div key="ai-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <Brain size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold">AI Препоръки</h3>
                        <p className="text-xs text-gray-500">
                          Модел: {recommendations[0]?.model || 'all-MiniLM-L6-v2'} · HuggingFace Transformers
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendations.map((rec, idx) => (
                        <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                          className="bg-white/3 border border-white/8 rounded-2xl p-5 hover:border-blue-500/30 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{rec.category}</span>
                            <div className="text-xs text-blue-400 font-mono">
                              {(rec.ml_score * 100).toFixed(1)}% match
                            </div>
                          </div>
                          <h4 className="font-semibold text-sm mb-3 leading-snug">{rec.name}</h4>
                          <div className="flex items-center justify-between">
                            <span className="font-black text-lg">{fmt(rec.negotiated_price)}</span>
                            <span className="text-xs bg-green-400/10 text-green-400 border border-green-400/20 px-2 py-1 rounded-full font-bold">
                              -{rec.discount_pct}%
                            </span>
                          </div>
                          <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"
                              style={{ width: `${Math.min(rec.ml_score * 100, 100)}%` }}></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {recommendations.length === 0 && (
                      <div className="text-center py-16 text-gray-500">
                        <Brain size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Зарежда ML препоръки...</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && analyticsData && (
                  <motion.div key="analytics-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      {[
                        { label: 'Общо търсения', value: analyticsData.total_searches.toLocaleString(), icon: Search, color: 'blue' },
                        { label: 'Платени търсения', value: analyticsData.paid_searches.toLocaleString(), icon: CheckCircle, color: 'green' },
                        { label: 'Спестено EUR', value: fmt(analyticsData.total_savings_eur), icon: TrendingDown, color: 'emerald' },
                        { label: 'Поръчки', value: analyticsData.total_orders.toString(), icon: Package, color: 'purple' },
                        { label: 'Средна отстъпка', value: `${analyticsData.avg_discount_pct}%`, icon: BarChart3, color: 'orange' },
                        { label: 'Demo → Платен', value: `${analyticsData.demo_to_paid_rate}%`, icon: Zap, color: 'yellow' },
                      ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white/3 border border-white/8 rounded-2xl p-6">
                          <Icon size={18} className={`text-${color}-400 mb-3`} />
                          <div className="text-2xl font-black mb-1">{value}</div>
                          <div className="text-xs text-gray-500">{label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10 rounded-3xl p-6">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-blue-400" /> ROI Калкулатор
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        При <span className="text-white font-bold">{analyticsData.avg_discount_pct}% средна отстъпка</span> на B2B поръчки и
                        {' '}<span className="text-white font-bold">{analyticsData.demo_to_paid_rate}% конверсия</span> от демо към платен достъп,
                        платформата генерира <span className="text-green-400 font-black">{fmt(analyticsData.total_savings_eur)}</span> в спестявания за клиентите.
                        Средната компания спестява{' '}
                        <span className="text-blue-400 font-black">
                          {fmt(Math.round(analyticsData.total_savings_eur / analyticsData.total_orders))} EUR на поръчка
                        </span>.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PAYWALL MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {showPaywall && !hasAccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-6">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowPaywall(false)} />
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0d1118] border border-white/10 rounded-3xl p-8 shadow-2xl">

              <button onClick={() => setShowPaywall(false)} className="absolute top-5 right-5 text-gray-500 hover:text-white">
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                  <Package size={24} />
                </div>
                <h2 className="text-2xl font-black mb-2">Отключи пълния достъп</h2>
                <p className="text-gray-400 text-sm">Демото показа реалния потенциал. Сега го използвай.</p>
              </div>

              {/* ROI summary in paywall */}
              {demoResult && (
                <div className="bg-green-500/8 border border-green-500/15 rounded-2xl p-4 mb-6">
                  <div className="text-xs text-green-400 font-bold mb-2">ТОЙ САМО ЩЕ ВЪРНЕ ВЛОЖЕНОТО:</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Спестено (1 поръчка)</span>
                    <span className="font-bold text-green-400">{fmt(demoResult.savings_eur)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">Цена на достъп</span>
                    <span className="font-bold text-white">0.99 EUR</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1 pt-2 border-t border-white/5">
                    <span className="text-gray-400">ROI от 1 поръчка</span>
                    <span className="font-black text-green-400">{Math.round(demoResult.savings_eur / 0.99)}x</span>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-8">
                {[
                  'Неограничени B2B търсения (MiniSearch)',
                  'DHL Logistics — реална sandbox API',
                  'Keepa Price Audit — пазарни данни',
                  'AI Препоръки — HuggingFace all-MiniLM-L6-v2',
                  'ROI Аналитика в реално време',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" /> {item}
                  </div>
                ))}
              </div>

              <button onClick={handleCheckout} disabled={checkoutLoading}
                className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-black text-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 disabled:opacity-50">
                {checkoutLoading ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    Плати 0.99 EUR — Stripe Checkout
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-600 mt-4 flex items-center justify-center gap-2">
                <ShieldCheck size={12} /> Защитено плащане · Stripe · Без автоматично подновяване
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
