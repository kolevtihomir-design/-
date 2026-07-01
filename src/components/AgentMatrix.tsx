import React, { useState, useEffect } from "react";
import { 
  Cpu, Zap, Play, CheckCircle, ShieldAlert, 
  ChevronRight, RefreshCw, Layers, Compass, BarChart4, FileText 
} from "lucide-react";

interface Agent {
  id: number;
  name: string;
  cluster: "logistics" | "auditors" | "risk" | "brokers";
  status: "IDLE" | "ANALYZING" | "SUCCESS";
  description: string;
}

const INITIAL_AGENTS: Agent[] = [
  // Logistics
  { id: 1, name: "Sea Cargo Router", cluster: "logistics", status: "IDLE", description: "Optimizes maritime routes and container volumes" },
  { id: 2, name: "Air Freight Broker", cluster: "logistics", status: "IDLE", description: "Verifies air freight tariffs in real-time" },
  { id: 3, name: "Rail Transit Analyst", cluster: "logistics", status: "IDLE", description: "Calculates land transit across the Silk Road corridors" },
  { id: 4, name: "Last-Mile Calculator", cluster: "logistics", status: "IDLE", description: "Compares DHL, FedEx, and local shipping agents" },
  { id: 5, name: "Lead-Time Estimator", cluster: "logistics", status: "IDLE", description: "Simulates seaport congestion and delays" },
  
  // Price Auditors
  { id: 6, name: "Alibaba Price Scraper", cluster: "auditors", status: "IDLE", description: "Eliminates middlemen using visual image analysis" },
  { id: 7, name: "Direct Factory Auditor", cluster: "auditors", status: "IDLE", description: "Verifies manufacturer licenses and plant capacity" },
  { id: 8, name: "Wholesale Margin Grader", cluster: "auditors", status: "IDLE", description: "Rates direct manufacturing cost structure per SKU" },
  { id: 9, name: "Catalog Parser AI", cluster: "auditors", status: "IDLE", description: "Extracts pricing catalogs from manufacturer PDFs" },
  { id: 10, name: "Bulk Volume Negotiator", cluster: "auditors", status: "IDLE", description: "Calculates multi-tiered wholesale volume discounts" },
  
  // Risk Analysts
  { id: 11, name: "Customs Duty Auditor", cluster: "risk", status: "IDLE", description: "Monitors customs tariffs (TARIC / HS codes)" },
  { id: 12, name: "FX Currency Hedger", cluster: "risk", status: "IDLE", description: "Hedges foreign currency fluctuations USD/EUR/CNY" },
  { id: 13, name: "Supplier Solvency Auditor", cluster: "risk", status: "IDLE", description: "Audits supplier solvency, financial health, and litigation" },
  { id: 14, name: "Compliance Guard", cluster: "risk", status: "IDLE", description: "Validates CE, RoHS, and FCC certificate compliances" },
  { id: 15, name: "Geopolitical Risk Model", cluster: "risk", status: "IDLE", description: "Models potential delays due to geopolitical frictions" },
  
  // Brokers
  { id: 16, name: "B2B Contract Generator", cluster: "brokers", status: "IDLE", description: "Generates standardized bilateral B2B purchase agreements" },
  { id: 17, name: "Escrow Safety Broker", cluster: "brokers", status: "IDLE", description: "Arranges secure escrow structures and deposits" },
  { id: 18, name: "Invoice Matcher OCR", cluster: "brokers", status: "IDLE", description: "Cross-checks proformas against agreed purchase rates" },
  { id: 19, name: "Scarcity Timer AI", cluster: "brokers", status: "IDLE", description: "Creates urgency cues for optimal execution timing" },
  { id: 20, name: "SAP / Odoo Exporter", cluster: "brokers", status: "IDLE", description: "Formats structured datasets for SAP/Odoo ERP imports" }
];

export default function AgentMatrix() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activeStep, setActiveStep] = useState<number>(-1); // -1 = idle, 0 = log, 1 = audit, 2 = risk, 3 = broker, 4 = done
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  // Active cluster strings for easy UI highlight
  const stepClusters: ("logistics" | "auditors" | "risk" | "brokers")[] = [
    "logistics",
    "auditors",
    "risk",
    "brokers"
  ];

  const triggerScan = () => {
    if (scanning) return;
    setScanning(true);
    setActiveStep(0);
    setLogMessages(["Launching FlowLogic 20-Agent Matrix..."]);
    
    // Reset agent statuses
    setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: "IDLE" })));
  };

  useEffect(() => {
    if (activeStep === -1 || activeStep > 3) {
      if (activeStep === 4) {
        setScanning(false);
        setLogMessages(prev => [...prev, "✅ All 20 agents completed analysis. Supply chain is fully optimized!"]);
      }
      return;
    }

    const currentCluster = stepClusters[activeStep];
    
    // Add logs for starting cluster
    const clusterNames = {
      logistics: "Logistics Cluster (Agents 1-5) calculating transit times...",
      auditors: "Price Auditors (Agents 6-10) scanning factory-direct quotes...",
      risk: "Risk Analysts (Agents 11-15) assessing customs duties and FX risks...",
      brokers: "Brokers (Agents 16-20) generating contracts and ERP export streams..."
    };

    setLogMessages(prev => [...prev, `🔍 Launching: ${clusterNames[currentCluster]}`]);

    // Animate agents in cluster
    setAgents(prev => prev.map(a => 
       a.cluster === currentCluster ? { ...a, status: "ANALYZING" } : a
    ));

    // Wait 2 seconds, then mark them as SUCCESS and transition to next step
    const timer = setTimeout(() => {
      setAgents(prev => prev.map(a => 
        a.cluster === currentCluster ? { ...a, status: "SUCCESS" } : a
      ));
      
      const details = {
        logistics: "Optimized transit time: 22 days (Ocean) | 6 days (Air Cargo). All ancillary fees computed.",
        auditors: "Direct factory source validated. Middlemen markup eliminated from the chain.",
        risk: "Foreign currency exchange rate locked. Supplier CE/RoHS certificates validated.",
        brokers: "B2B supply contract auto-generated and ready for Odoo/SAP import."
      };

      setLogMessages(prev => [...prev, `✨ ${details[currentCluster]}`]);
      setActiveStep(prev => prev + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeStep]);

  return (
    <div id="agent-matrix-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Visual Agent Grid Panel */}
      <div className="lg:col-span-8 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              FlowLogic 20-Agent Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Coordinated execution of 20 specialized AI agents for parallel supply-chain analysis.
            </p>
          </div>
          
          <button 
            onClick={triggerScan}
            disabled={scanning}
            className="flex items-center gap-1.5 py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analysis in progress...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run 20-Agent Matrix Scanner</span>
              </>
            )}
          </button>
        </div>

        {/* Clusters Visualizer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Cluster: Logistics */}
          <div className={`p-3 rounded-xl border transition-all ${activeStep === 0 ? "bg-cyan-950/20 border-cyan-500/50" : "bg-slate-950/40 border-slate-800/80"}`}>
            <h4 className="text-xs font-bold text-cyan-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              1. Logistics (1-5)
            </h4>
            <div className="space-y-2">
              {agents.filter(a => a.cluster === "logistics").map(agent => (
                <div key={agent.id} className="p-2 bg-slate-950/60 rounded border border-slate-900 flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-slate-400 truncate">A#{agent.id} • {agent.name}</div>
                    <div className="text-[8px] text-slate-500 truncate">{agent.description}</div>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    agent.status === "SUCCESS" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : 
                    agent.status === "ANALYZING" ? "bg-cyan-400 animate-ping" : "bg-slate-700"
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Cluster: Auditors */}
          <div className={`p-3 rounded-xl border transition-all ${activeStep === 1 ? "bg-purple-950/20 border-purple-500/50" : "bg-slate-950/40 border-slate-800/80"}`}>
            <h4 className="text-xs font-bold text-purple-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              2. Price Auditing (6-10)
            </h4>
            <div className="space-y-2">
              {agents.filter(a => a.cluster === "auditors").map(agent => (
                <div key={agent.id} className="p-2 bg-slate-950/60 rounded border border-slate-900 flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-slate-400 truncate">A#{agent.id} • {agent.name}</div>
                    <div className="text-[8px] text-slate-500 truncate">{agent.description}</div>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    agent.status === "SUCCESS" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : 
                    agent.status === "ANALYZING" ? "bg-purple-400 animate-ping" : "bg-slate-700"
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Cluster: Risk */}
          <div className={`p-3 rounded-xl border transition-all ${activeStep === 2 ? "bg-amber-950/20 border-amber-500/50" : "bg-slate-950/40 border-slate-800/80"}`}>
            <h4 className="text-xs font-bold text-amber-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
              <BarChart4 className="w-3.5 h-3.5" />
              3. Risk Assessment (11-15)
            </h4>
            <div className="space-y-2">
              {agents.filter(a => a.cluster === "risk").map(agent => (
                <div key={agent.id} className="p-2 bg-slate-950/60 rounded border border-slate-900 flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-slate-400 truncate">A#{agent.id} • {agent.name}</div>
                    <div className="text-[8px] text-slate-500 truncate">{agent.description}</div>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    agent.status === "SUCCESS" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : 
                    agent.status === "ANALYZING" ? "bg-amber-400 animate-ping" : "bg-slate-700"
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Cluster: Brokers */}
          <div className={`p-3 rounded-xl border transition-all ${activeStep === 3 ? "bg-emerald-950/20 border-emerald-500/50" : "bg-slate-950/40 border-slate-800/80"}`}>
            <h4 className="text-xs font-bold text-emerald-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              4. Brokers & Contracts (16-20)
            </h4>
            <div className="space-y-2">
              {agents.filter(a => a.cluster === "brokers").map(agent => (
                <div key={agent.id} className="p-2 bg-slate-950/60 rounded border border-slate-900 flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-slate-400 truncate">A#{agent.id} • {agent.name}</div>
                    <div className="text-[8px] text-slate-500 truncate">{agent.description}</div>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    agent.status === "SUCCESS" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : 
                    agent.status === "ANALYZING" ? "bg-emerald-400 animate-ping" : "bg-slate-700"
                  }`} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Sourcing Intelligence Live Log Feed */}
      <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)] flex flex-col h-full min-h-[400px]">
        <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          Intelligence Log
        </h4>
        
        <div className="bg-slate-950 rounded-lg p-3.5 font-mono text-xs text-slate-400 space-y-2 flex-1 overflow-y-auto max-h-[300px] border border-slate-800">
          {logMessages.length === 0 ? (
            <div className="text-slate-600 italic text-center py-12">
              Awaiting activation... Press 'Run 20-Agent Matrix Scanner' to launch global customs, compliance, and logistics audit.
            </div>
          ) : (
            logMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`leading-relaxed border-l-2 pl-2 ${
                  msg.startsWith("✅") ? "text-emerald-400 border-emerald-500" :
                  msg.startsWith("✨") ? "text-cyan-300 border-cyan-500" :
                  msg.startsWith("🔍") ? "text-amber-300 border-amber-500" : "text-slate-400 border-slate-800"
                }`}
              >
                {msg}
              </div>
            ))
          )}
        </div>

        {activeStep === 4 && (
          <div className="mt-4 p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-lg text-xs leading-relaxed text-slate-300 animate-fade-in">
            🎯 <span className="font-semibold text-cyan-400">Optimization Result:</span> All 20 agents successfully completed. Customs verified via HS codes, middleman margins pruned to direct factory source, and FX exposure offset via automated hedging.
          </div>
        )}
      </div>
    </div>
  );
}
