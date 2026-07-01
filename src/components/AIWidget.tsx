import React, { useState } from "react";
import { 
  MessageSquare, X, ShieldAlert, ShoppingCart, Check, 
  HelpCircle, Sparkles, ChevronRight, RefreshCw, AlertTriangle 
} from "lucide-react";

type StateStep = 
  | "intent"       // Intent detection
  | "clarification"// Request clarification
  | "catalog"      // Catalog search
  | "ranking"      // Option ranking
  | "recommend"    // Recommendation
  | "action";      // Action execution (Safety Guardrail)

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  jsonPayload?: any;
}

export default function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<StateStep>("intent");
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [pendingAction, setPendingAction] = useState<boolean>(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      sender: "assistant",
      text: "Hello! I am your e-commerce AI conversion assistant. Are you looking for a specific product for your office or home?"
    }
  ]);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: "u_" + Date.now(),
      sender: "user",
      text: inputText
    };

    setMessages(prev => [...prev, userMsg]);
    const prompt = inputText.toLowerCase();
    setInputText("");

    // Simulate state machine transitions
    if (currentStep === "intent") {
      setCurrentStep("clarification");
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: "a_" + Date.now(),
          sender: "assistant",
          text: "I understand your requirements! Would you like the chair to have ergonomic lumbar support for long sitting hours, or a simpler design?"
        }]);
      }, 1000);
    } else if (currentStep === "clarification") {
      setCurrentStep("catalog");
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: "a_cat",
          sender: "assistant",
          text: "Thank you! I am now scanning the product catalog for ergonomic mesh chairs with 3D adjustments..."
        }]);

        setTimeout(() => {
          setCurrentStep("ranking");
          setMessages(prev => [...prev, {
            id: "a_rank",
            sender: "assistant",
            text: "Ranking options based on price, delivery reliability, and certifications (CE/BIFMA). Found a premium match!"
          }]);

          setTimeout(() => {
            setCurrentStep("recommend");
            setMessages(prev => [...prev, {
              id: "a_rec",
              sender: "assistant",
              text: "I highly recommend the 'Premium Ergonomic Office Chair' ($299.00). It meets all criteria and increases your order value.",
              jsonPayload: {
                action: "ADD_TO_CART",
                item: "Premium Ergonomic Office Chair",
                price: 299.00,
                quantity: 1,
                requires_confirmation: true
              }
            }]);
            setCurrentStep("action");
            setPendingAction(true);
          }, 1500);

        }, 1200);

      }, 1000);
    } else {
      // General response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: "a_" + Date.now(),
          sender: "assistant",
          text: "I can help you select additional filters or accessories! Try intent detection by asking me about a new item."
        }]);
      }, 1000);
    }
  };

  const handleConfirmCart = () => {
    setCartCount(prev => prev + 1);
    setCartTotal(prev => prev + 299);
    setPendingAction(false);
    
    setMessages(prev => [...prev, {
      id: "a_success",
      sender: "assistant",
      text: "✅ Executed! Transaction confirmed by the user and the item has been added to the cart. Your average order value (AOV) increased by $299.00!"
    }]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {/* Cart Value Widget for proof of concept */}
        <div className="bg-slate-900/95 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-cyan-400" />
          <div>
            <div>Cart: <span className="font-bold text-slate-100">{cartCount} pcs.</span></div>
            <div className="text-[10px] text-emerald-400 font-bold">${cartTotal}</div>
          </div>
        </div>

        <button 
          onClick={() => setIsOpen(prev => !prev)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center justify-center shadow-[0_4px_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer relative"
        >
          {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          {pendingAction && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 border-2 border-slate-950 rounded-full animate-ping" />
          )}
        </button>
      </div>

      {/* Conversation Window */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-40 w-96 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col h-[480px] overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-200">AI Conversion Assistant Widget</h4>
              </div>
              <p className="text-[10px] text-slate-500">Boosts Average Order Value (AOV)</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-200 cursor-pointer">
              ✕
            </button>
          </div>

          {/* State Machine Status Tracker */}
          <div className="bg-slate-950/60 border-b border-slate-800/80 px-3 py-1.5 flex justify-between items-center gap-1 overflow-x-auto text-[9px] font-mono whitespace-nowrap text-slate-500">
            <span className={`px-1 rounded ${currentStep === "intent" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold" : ""}`}>
              🎯 Intent
            </span>
            <span className="text-slate-700">➔</span>
            <span className={`px-1 rounded ${currentStep === "clarification" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold" : ""}`}>
              💬 Clarify
            </span>
            <span className="text-slate-700">➔</span>
            <span className={`px-1 rounded ${currentStep === "catalog" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold" : ""}`}>
              📦 Catalog
            </span>
            <span className="text-slate-700">➔</span>
            <span className={`px-1 rounded ${currentStep === "ranking" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold" : ""}`}>
              🏆 Rank
            </span>
            <span className="text-slate-700">➔</span>
            <span className={`px-1 rounded ${currentStep === "recommend" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold" : ""}`}>
              📊 Rec
            </span>
            <span className="text-slate-700">➔</span>
            <span className={`px-1 rounded ${currentStep === "action" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold" : ""}`}>
              🛡️ Action
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[300px]">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === "user" 
                      ? "bg-cyan-600 text-white rounded-tr-none" 
                      : "bg-slate-950/80 border border-slate-800 text-slate-300 rounded-tl-none"
                  }`}
                >
                  {m.text}

                  {/* Safety Guardrail Structured JSON Payload simulation */}
                  {m.jsonPayload && (
                    <div className="mt-2 p-2 bg-slate-900 border border-amber-500/20 rounded font-mono text-[9px] text-amber-400 space-y-1">
                      <div className="flex items-center gap-1 text-slate-400 border-b border-slate-800 pb-1 mb-1">
                        <ShieldAlert className="w-3 h-3 text-amber-500" />
                        <span>Safety Guardrail Active</span>
                      </div>
                      <div>"requires_confirmation": {String(m.jsonPayload.requires_confirmation)}</div>
                      <div>"action": "{m.jsonPayload.action}"</div>
                      <div>"payload": "{m.jsonPayload.item}" (${m.jsonPayload.price})</div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pending Confirmation Block */}
            {pendingAction && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 animate-fade-in text-xs">
                <div className="flex items-start gap-1.5 text-amber-500">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Warning: Safety Guardrail</span>
                    The assistant widget cannot modify your cart automatically. Explicit manual confirmation is required.
                  </div>
                </div>
                <button 
                  onClick={handleConfirmCart}
                  className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Confirm Add to Cart
                </button>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-1.5">
            <input 
              type="text" 
              placeholder="Type e.g. 'I am looking for an ergonomic chair'..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button 
              type="submit"
              className="px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
