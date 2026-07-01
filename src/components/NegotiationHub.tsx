import React, { useState } from "react";
import { B2BProduct, NegotiationOffer } from "../types";
import { 
  Send, ShieldCheck, Mail, CheckCircle2, XCircle, AlertCircle, 
  HelpCircle, UserCheck, ChevronRight, FileDown, Eye, Check, X
} from "lucide-react";

interface NegotiationHubProps {
  products: B2BProduct[];
  selectedProduct: B2BProduct | null;
  offers: NegotiationOffer[];
  onAddOffer: (offer: NegotiationOffer) => void;
  onResolveOffer: (id: string, action: "accepted" | "rejected" | "counter", counterPrice?: number) => void;
  onRefreshOffers: () => void;
  exportCsv: () => void;
}

export default function NegotiationHub({
  products,
  selectedProduct,
  offers,
  onAddOffer,
  onResolveOffer,
  onRefreshOffers,
  exportCsv
}: NegotiationHubProps) {
  // Input form state
  const [targetProduct, setTargetProduct] = useState<B2BProduct | null>(selectedProduct);
  const [proposedPrice, setProposedPrice] = useState<number>(
    selectedProduct ? Number((selectedProduct.factoryPrice * 0.88).toFixed(2)) : 0
  );
  const [email, setEmail] = useState("office@tngroup.eu");
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{
    message: string;
    emailSentSimulation: string;
    ratio: number;
    offer: NegotiationOffer;
  } | null>(null);

  // Sync state if selectedProduct changes
  React.useEffect(() => {
    if (selectedProduct) {
      setTargetProduct(selectedProduct);
      setProposedPrice(Number((selectedProduct.factoryPrice * 0.88).toFixed(2)));
    }
  }, [selectedProduct]);

  const handleProductSelect = (sku: string) => {
    const prod = products.find(p => p.sku === sku);
    if (prod) {
      setTargetProduct(prod);
      setProposedPrice(Number((prod.factoryPrice * 0.88).toFixed(2)));
    }
  };

  const handleNegotiateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProduct) return;

    setSubmitting(true);
    setLastSubmissionResult(null);

    try {
      const response = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: targetProduct.sku,
          proposedPrice,
          customerEmail: email,
          marginSimulated: 40
        })
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data = await response.json();
      setLastSubmissionResult(data);
      onAddOffer(data.offer);
    } catch (err) {
      console.error(err);
      alert("An error occurred while submitting your offer.");
    } finally {
      setSubmitting(false);
    }
  };

  // Admin override actions
  const [counterValues, setCounterValues] = useState<{ [id: string]: number }>({});

  const handleAdminAction = async (id: string, action: "accepted" | "rejected" | "counter") => {
    const counterPrice = counterValues[id];
    try {
      const response = await fetch("/api/admin/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, counterPrice })
      });
      if (response.ok) {
        onResolveOffer(id, action, counterPrice);
        // Clear counter value
        setCounterValues(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingOffers = offers.filter(o => o.status === "pending");
  const completedOffers = offers.filter(o => o.status !== "pending");

  return (
    <div id="negotiation-hub-container" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* 1. Propose Deal Panel */}
      <div className="xl:col-span-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
        <h3 className="text-lg font-semibold tracking-tight text-cyan-400 mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          Submit Quick Offer
        </h3>

        <form onSubmit={handleNegotiateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Select Product for Negotiation</label>
            <select 
              value={targetProduct?.sku || ""}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              required
            >
              <option value="" disabled>-- Select Product --</option>
              {products.map(p => (
                <option key={p.sku} value={p.sku}>{p.name} (${p.factoryPrice} factory)</option>
              ))}
            </select>
          </div>

          {targetProduct && (
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Base Factory Price:</span>
                <span className="font-semibold text-slate-200">${targetProduct.factoryPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>85% Fast-Track threshold:</span>
                <span className="font-semibold text-emerald-400">${(targetProduct.factoryPrice * 0.85).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Proposed Unit Price ($ / piece)</label>
            <input 
              type="number" 
              step="0.01"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-semibold text-slate-200 focus:outline-none focus:border-cyan-500/50"
              required
            />
            {targetProduct && (
              <div className="flex justify-between text-[10px] mt-1 text-slate-500">
                <span>Offer: {targetProduct ? ((proposedPrice / targetProduct.factoryPrice) * 100).toFixed(1) : 0}% of base</span>
                <span>Savings vs B2C: ${targetProduct ? (targetProduct.retailPrice - proposedPrice).toFixed(2) : 0}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Buyer / Importer Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={submitting || !targetProduct}
            className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-100 font-medium rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(6,182,212,0.1)] cursor-pointer"
          >
            {submitting ? "Calculating..." : "Submit for Automated Approval"}
          </button>
        </form>

        {/* Dynamic Resolution Popup Info */}
        {lastSubmissionResult && (
          <div className="mt-4 p-4 rounded-xl border space-y-3 animate-fade-in bg-slate-950/90 border-slate-800">
            <div className="flex items-center gap-2">
              {lastSubmissionResult.offer.status === "accepted" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
              <h4 className="text-sm font-semibold">
                {lastSubmissionResult.offer.status === "accepted" ? "Deal Approved!" : "Approval Required"}
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lastSubmissionResult.message}
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded p-2 text-[10px] text-slate-400 font-mono overflow-x-auto whitespace-pre">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1 pb-1 border-b border-slate-800">
                <Mail className="w-3.5 h-3.5" /> Simulated Resolution Email
              </div>
              {lastSubmissionResult.emailSentSimulation.trim()}
            </div>
          </div>
        )}
      </div>

      {/* 2. Admin Review Panel (Human-in-the-loop) */}
      <div className="xl:col-span-8 space-y-6">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-amber-400 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Admin Panel (Human-in-the-Loop)
              </h3>
              <p className="text-xs text-slate-400">Offers below the 85% threshold awaiting manual review, counter-offer, or rejection.</p>
            </div>
            <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
              {pendingOffers.length} pending
            </span>
          </div>

          {pendingOffers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No offers requiring manual intervention. All deals are finalized or algorithmically assessed.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOffers.map(offer => {
                const ratio = ((offer.proposedPrice / offer.factoryPrice) * 100).toFixed(1);
                return (
                  <div key={offer.id} className="p-4 bg-slate-950/80 rounded-xl border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.02)] grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="lg:col-span-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          PENDING
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{offer.sku}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 mt-1">{offer.productName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Importer: {offer.customerEmail}</p>
                    </div>

                    <div className="lg:col-span-3 text-xs text-slate-400 space-y-1">
                      <div>Factory Price: <span className="text-slate-200 font-semibold">${offer.factoryPrice}</span></div>
                      <div>Proposed: <span className="text-amber-400 font-bold">${offer.proposedPrice}</span> ({ratio}%)</div>
                      <div>Landed Cost: <span className="text-slate-300">${offer.landedCost}</span></div>
                    </div>

                    {/* Actions block */}
                    <div className="lg:col-span-4 flex flex-col sm:flex-row gap-2 items-center justify-end">
                      <div className="flex gap-1.5 w-full sm:w-auto">
                        <button 
                          onClick={() => handleAdminAction(offer.id, "accepted")}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-2.5 py-1.5 rounded transition-all cursor-pointer"
                          title="Approve at proposed price"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button 
                          onClick={() => handleAdminAction(offer.id, "rejected")}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs px-2.5 py-1.5 rounded transition-all cursor-pointer"
                          title="Reject entirely"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>

                      {/* Counter-offer interface */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <input 
                          type="number" 
                          placeholder="Counter"
                          value={counterValues[offer.id] || ""}
                          onChange={(e) => setCounterValues({ ...counterValues, [offer.id]: Number(e.target.value) })}
                          className="w-16 px-1.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                        <button 
                          onClick={() => handleAdminAction(offer.id, "counter")}
                          disabled={!counterValues[offer.id]}
                          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs px-2 py-1.5 rounded transition-all cursor-pointer"
                        >
                          Counter
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. CRM Offers Logs list */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-100">CRM Deals & Negotiation Log</h3>
              <p className="text-xs text-slate-400">Real-time history of finalized and active margin negotiations.</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={exportCsv}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export CSV for Odoo/SAP
              </button>
            </div>
          </div>

          {completedOffers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No finalized deals. Propose an offer above the 85% threshold!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-slate-500 uppercase border-b border-slate-800 text-[10px] tracking-wider bg-slate-950/40">
                  <tr>
                    <th className="py-2.5 px-3">SKU/Product</th>
                    <th className="py-2.5 px-3">Factory Price</th>
                    <th className="py-2.5 px-3">Agreed Price</th>
                    <th className="py-2.5 px-3">Landed Cost</th>
                    <th className="py-2.5 px-3">Importer</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {completedOffers.map((offer) => {
                    const isApproved = offer.status === "accepted";
                    return (
                      <tr key={offer.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-3 px-3 font-medium">
                          <span className="font-mono text-[10px] text-cyan-400 block">{offer.sku}</span>
                          <span className="text-slate-200 font-medium text-xs line-clamp-1">{offer.productName}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">${offer.factoryPrice}</td>
                        <td className="py-3 px-3 font-mono text-cyan-300 font-semibold">${offer.proposedPrice}</td>
                        <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">${offer.landedCost}</td>
                        <td className="py-3 px-3 text-slate-400 truncate max-w-[150px]" title={offer.customerEmail}>
                          {offer.customerEmail}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isApproved 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          }`}>
                            {offer.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 font-mono text-[10px]">
                          {new Date(offer.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
