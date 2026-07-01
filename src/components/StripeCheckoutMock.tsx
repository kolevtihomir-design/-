import React, { useState } from "react";
import { CreditCard, ShieldCheck, HelpCircle, Lock, ArrowLeft, RefreshCw, MapPin } from "lucide-react";

export default function StripeCheckoutMock() {
  const [paying, setPaying] = useState(false);
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.includes("?") ? hash.split("?")[1] : "");
  const email = params.get("email") || "office@tngroup.eu";
  const sessionId = params.get("session_id") || "mock_session_123";

  // Billing address state
  const [billingName, setBillingName] = useState("TIHOMIR KOLEV");
  const [billingAddress, setBillingAddress] = useState("bul. Bulgaria 111");
  const [billingCity, setBillingCity] = useState("Sofia");
  const [billingCountry, setBillingCountry] = useState("Bulgaria");
  const [billingZip, setBillingZip] = useState("1000");

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      // Redirect back with successful parameters
      window.location.href = `/?session_id=${sessionId}&payment=success`;
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = `/?payment=cancel`;
  };

  return (
    <div id="stripe-checkout-mock" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full filter blur-[150px] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-6 space-y-6 relative overflow-hidden">
        
        {/* Stripe Branding Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-[0_0_10px_rgba(79,70,229,0.4)]">
              S
            </div>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stripe Checkout</h1>
              <p className="text-[10px] text-slate-500">Subscription Simulator (Sandbox)</p>
            </div>
          </div>
          <button 
            onClick={handleCancel}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>
        </div>

        {/* Pricing Info */}
        <div className="space-y-1 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
          <span className="text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded uppercase tracking-wider">
            ProcureOS Pro Monthly
          </span>
          <h2 className="text-sm font-bold text-slate-200 mt-2">Monthly SaaS Subscription</h2>
          <p className="text-[11px] text-slate-400">Complete access to VIP arbitrage routes, unlimited AI Sourcing advisor, OCR PDF invoice scanning, and compliant ERP export feeds.</p>
          <div className="text-2xl font-black text-slate-100 mt-3 flex items-baseline gap-1">
            $49.00 <span className="text-xs text-slate-500 font-normal">/ monthly</span>
          </div>
        </div>

        {/* Stripe Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Billing Email Address</label>
              <input 
                type="text" 
                readOnly 
                value={email} 
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono outline-none" 
              />
            </div>

            {/* Billing Address fields requested by user */}
            <div className="space-y-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-400" /> Billing Address
              </h3>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Full Name</label>
                <input 
                  type="text" 
                  value={billingName} 
                  onChange={(e) => setBillingName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-indigo-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Address Line</label>
                <input 
                  type="text" 
                  value={billingAddress} 
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-indigo-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">City</label>
                  <input 
                    type="text" 
                    value={billingCity} 
                    onChange={(e) => setBillingCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-indigo-500" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Postal Code</label>
                  <input 
                    type="text" 
                    value={billingZip} 
                    onChange={(e) => setBillingZip(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Country</label>
                <input 
                  type="text" 
                  value={billingCountry} 
                  onChange={(e) => setBillingCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-indigo-500" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Credit Card Details
              </h3>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Test Card Number</label>
                <div className="relative">
                  <input 
                    type="text" 
                    readOnly 
                    value="4242  4242  4242  4242" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 pl-10 text-xs text-slate-200 font-mono outline-none" 
                  />
                  <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Expires</label>
                  <input 
                    type="text" 
                    readOnly 
                    value="12 / 28" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono text-center outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">CVC</label>
                  <input 
                    type="text" 
                    readOnly 
                    value="123" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono text-center outline-none" 
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-2">
              <button 
                onClick={handlePay}
                disabled={paying}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] cursor-pointer"
              >
                {paying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Subscribe with Test Card ($49.00)</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={handleCancel}
                className="w-full py-2 bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 font-semibold rounded-lg text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <div className="text-[9px] text-slate-500 text-center leading-relaxed flex flex-col items-center justify-center gap-1 border-t border-slate-800/60 pt-3">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-400 font-medium">🛡️ Secure 3D-Secure Payments Enabled</span>
          </div>
          <span>Secure transaction via Stripe Sandbox. No real funds required. Billing details will be recorded.</span>
        </div>
      </div>
    </div>
  );
}
