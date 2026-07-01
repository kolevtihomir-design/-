import React, { useState } from "react";
import { 
  Lock, Check, ArrowRight, TrendingUp, Sparkles, 
  HelpCircle, ShieldCheck, DollarSign, CreditCard, Zap, RefreshCw
} from "lucide-react";

interface ArbitrageItem {
  pair: string;
  binance: number;
  kraken: number;
  coinbase: number;
  bybit: number;
  lockedRoute: string;
  spread: number;
  potentialProfit: string;
}

const INITIAL_PAIRS: ArbitrageItem[] = [
  { pair: "BTC/USDT", binance: 98420.00, kraken: 98580.00, coinbase: 98450.00, bybit: 98400.00, lockedRoute: "Buy from Bybit ($98.4k) ➡️ Sell in Kraken ($98.58k)", spread: 0.18, potentialProfit: "$180 per BTC" },
  { pair: "ETH/USDT", binance: 3220.50, kraken: 3215.00, coinbase: 3232.00, bybit: 3218.00, lockedRoute: "Buy from Kraken ($3215.00) ➡️ Sell in Coinbase ($3232.00)", spread: 0.53, potentialProfit: "$17.00 per ETH" },
  { pair: "SOL/USDT", binance: 182.10, kraken: 183.45, coinbase: 182.05, bybit: 182.20, lockedRoute: "Buy from Coinbase ($182.05) ➡️ Sell in Kraken ($183.45)", spread: 0.77, potentialProfit: "$1.40 per SOL" }
];

interface CryptoArbitrageProps {
  isPremium: boolean;
  onSubscribe: (email: string) => Promise<void>;
  userEmail?: string;
}

export default function CryptoArbitrage({ isPremium, onSubscribe, userEmail = "office@tngroup.eu" }: CryptoArbitrageProps) {
  const [pairs, setPairs] = useState<ArbitrageItem[]>(INITIAL_PAIRS);
  const [showModal, setShowModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [inputEmail, setInputEmail] = useState(userEmail);

  // If globally premium, user is VIP
  const isVip = isPremium;

  const handleSubscribeClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    try {
      await onSubscribe(inputEmail);
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div id="crypto-arbitrage-container" className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              VIP Crypto Arbitrage (Closed Panel)
            </h3>
            {isVip ? (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.1)] animate-pulse">
                <Sparkles className="w-3 h-3" /> VIP Active
              </span>
            ) : (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked Paywall
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            B2B Crypto arbitrage scanner for hedging and liquidity discovery through cross-exchange price differences.
          </p>
        </div>

        {!isVip && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            Unlock with Pro Subscription
          </button>
        )}
      </div>

      {/* Arbitrage Opportunities Grid/Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="text-slate-500 uppercase border-b border-slate-800 text-[10px] tracking-wider bg-slate-950/40">
            <tr>
              <th className="py-2.5 px-3">Trading Pair</th>
              <th className="py-2.5 px-3">Binance</th>
              <th className="py-2.5 px-3">Kraken PRO</th>
              <th className="py-2.5 px-3">Coinbase</th>
              <th className="py-2.5 px-3">Bybit</th>
              <th className="py-2.5 px-3">Max Spread</th>
              <th className="py-2.5 px-3">Optimal Routing Pathway</th>
              <th className="py-2.5 px-3 text-right">Potential Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {pairs.map((item, i) => (
              <tr key={i} className="hover:bg-slate-950/20 transition-colors">
                <td className="py-3.5 px-3 font-semibold text-slate-200">{item.pair}</td>
                <td className="py-3.5 px-3 font-mono text-slate-400">${item.binance.toLocaleString()}</td>
                <td className="py-3.5 px-3 font-mono text-slate-400">${item.kraken.toLocaleString()}</td>
                <td className="py-3.5 px-3 font-mono text-slate-400">${item.coinbase.toLocaleString()}</td>
                <td className="py-3.5 px-3 font-mono text-slate-400">${item.bybit.toLocaleString()}</td>
                <td className="py-3.5 px-3 text-emerald-400 font-bold font-mono">+{item.spread}%</td>
                
                {/* Locked column showing Paywall */}
                <td className="py-3.5 px-3 relative min-w-[240px]">
                  {isVip ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold animate-fade-in bg-emerald-500/5 border border-emerald-500/20 p-1.5 rounded text-[11px]">
                      <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item.lockedRoute}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-500 select-none bg-slate-950/80 p-1.5 rounded border border-slate-900/60 backdrop-blur-sm filter blur-[2px] pointer-events-none">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Bybit ➡️ Kraken (LOCKED_PATHWAY)</span>
                    </div>
                  )}
                  {!isVip && (
                    <button 
                      onClick={() => setShowModal(true)}
                      className="absolute inset-0 m-auto w-36 h-6 flex items-center justify-center gap-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-[10px] rounded border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      Unlock with Pro
                    </button>
                  )}
                </td>

                <td className="py-3.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                  {isVip ? item.potentialProfit : "🔒 Locked"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paywall Popup Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-[0_0_35px_rgba(6,182,212,0.15)] relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-200 text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-100 font-display">Unlock VIP Sourcing & Arbitrage</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get full, unlimited real-time access to optimal arbitrage routing chains, eliminate 100% of exchange spreads, and hedge your foreign exchange risks instantly.
              </p>
            </div>

            {/* Price Box */}
            <div className="my-5 bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-400 font-medium">B2B Monthly Subscription</div>
                <div className="text-2xl font-black text-cyan-400 mt-1">$49 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
              </div>
              <div className="text-right text-[10px] text-slate-500 leading-normal">
                ✔️ Instant activation<br />
                ✔️ Invoice download<br />
                ✔️ Cancel anytime
              </div>
            </div>

            <form onSubmit={handleSubscribeClick} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Your Work Email</label>
                <input 
                  type="email" 
                  required
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Checklists */}
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automate detection of optimal exchange routing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct integration of proforma invoices via OCR</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Export contracts compatible with Odoo/SAP ERP</span>
                </div>
              </div>

              {/* Stripe Checkout button */}
              <button 
                type="submit"
                disabled={paying}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer"
              >
                {paying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Stripe Checkout...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Securely Subscribe with Stripe</span>
                  </>
                )}
              </button>
            </form>
            
            <div className="text-[9px] text-slate-500 text-center mt-3">
              Stripe Billing API integration. Enter email and click to simulate or execute actual subscription.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
