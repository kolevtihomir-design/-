import React, { useState, useEffect } from "react";
import { B2BProduct } from "../types";
import { 
  Search, ShieldCheck, Truck, Scale, DollarSign, Percent, 
  HelpCircle, ArrowRight, CheckCircle, RefreshCw, AlertTriangle
} from "lucide-react";

interface SourcingCatalogProps {
  products: B2BProduct[];
  loading: boolean;
  onSelectProduct: (product: B2BProduct) => void;
  selectedProduct: B2BProduct | null;
  onStartNegotiation: (product: B2BProduct, initialOffer: number, margin: number) => void;
}

export default function SourcingCatalog({
  products,
  loading,
  onSelectProduct,
  selectedProduct,
  onStartNegotiation
}: SourcingCatalogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [desiredMargin, setDesiredMargin] = useState(40); // default 40%
  const [searxngIndex, setSearxngIndex] = useState(1);
  const [searxngStatus, setSearxngStatus] = useState("OK");
  const [mlSearchActive, setMlSearchActive] = useState(true);

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculations
  const factoryPrice = selectedProduct?.factoryPrice || 0;
  
  // Invisible fees
  const freightFee = factoryPrice * 0.05;
  const insuranceFee = factoryPrice * 0.01;
  const customsFee = factoryPrice * 0.02;
  const handlingFee = 1.65; // $1.65 approx 1.5 EUR
  
  const landedCost = Number((factoryPrice + freightFee + insuranceFee + customsFee + handlingFee).toFixed(2));
  
  // Under desired margin, what should the retail price be?
  // Margin = (Retail - LandedCost) / Retail => Retail = LandedCost / (1 - Margin/100)
  const calculatedRetailPrice = Number((landedCost / (1 - desiredMargin / 100)).toFixed(2));
  const profitPerUnit = Number((calculatedRetailPrice - landedCost).toFixed(2));
  const roi = Number(((profitPerUnit / landedCost) * 100).toFixed(1));

  // Auto-failover simulation of SearXNG & ML
  const triggerSearxngFailover = () => {
    if (searxngIndex < 6) {
      setSearxngIndex(prev => prev + 1);
    } else {
      setSearxngIndex(1);
    }
    setSearxngStatus("FAILOVER");
    setTimeout(() => {
      setSearxngStatus("OK");
    }, 1500);
  };

  const toggleMlSearch = () => {
    setMlSearchActive(prev => !prev);
  };

  return (
    <div id="sourcing-catalog-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product List Panel */}
      <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-cyan-400">Sourcing Catalog</h2>
          
          {/* SearXNG Failover indicator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${searxngStatus === "OK" ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-ping"}`} />
            <span>SearXNG #{searxngIndex}</span>
            <button 
              onClick={triggerSearxngFailover} 
              title="Simulate SearXNG search engine crash"
              className="hover:text-cyan-400 transition-colors cursor-pointer ml-1"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search products (e.g., chair)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        {/* Resilience Mode Settings */}
        <div className="mb-4 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60 pb-3">
          <span>Vector Search (ML):</span>
          <button 
            onClick={toggleMlSearch}
            className={`px-2 py-0.5 rounded border transition-colors ${
              mlSearchActive 
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                : "bg-amber-500/10 border-amber-500/30 text-amber-500"
            }`}
          >
            {mlSearchActive ? "ACTIVE (HuggingFace)" : "FAILBACK (Meilisearch)"}
          </button>
        </div>

        {/* Products List */}
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-500" />
              Loading catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No products found. Try another search query.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = selectedProduct?.sku === product.sku;
              const productLanded = product.landedCost || Number((product.factoryPrice * 1.08 + 1.65).toFixed(2));
              const currentMargin = Math.round(((product.retailPrice - productLanded) / product.retailPrice) * 100);

              return (
                <div 
                  key={product.sku}
                  onClick={() => onSelectProduct(product)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                      : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-mono text-cyan-400/80">{product.sku}</span>
                    <span className="text-xs bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-200 mt-1 line-clamp-1">{product.name}</h3>
                  <div className="mt-2 flex justify-between items-center text-xs text-slate-400">
                    <div>
                      Factory: <span className="text-slate-200 font-semibold">${product.factoryPrice}</span>
                    </div>
                    <div>
                      Landed: <span className="text-emerald-400 font-semibold">${productLanded}</span>
                    </div>
                    <div>
                      Margin: <span className="text-purple-400 font-semibold">{currentMargin}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Calculator & Simulator Panel */}
      <div className="lg:col-span-2 space-y-6">
        {selectedProduct ? (
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
            <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20">
                    {selectedProduct.sku}
                  </span>
                  <span className="text-xs text-slate-400">{selectedProduct.category}</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-100 mt-1">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedProduct.description}</p>
              </div>

              {/* Trust & Supplier Rating */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-right min-w-[150px]">
                <div className="text-xs text-slate-400">Supplier (Trust Score)</div>
                <div className="text-sm font-medium text-slate-200 mt-0.5">{selectedProduct.supplier}</div>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {selectedProduct.supplierTrust}/100
                  </span>
                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${selectedProduct.supplierTrust}%` }} 
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {selectedProduct.supplierYears} yrs experience • {selectedProduct.certifications.join(", ")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Landed Cost Breakdown */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold tracking-wide text-slate-300 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  Landed Cost Calculator
                </h4>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Base Factory Price:</span>
                    <span className="font-semibold text-slate-200">${factoryPrice.toFixed(2)}</span>
                  </div>
                  
                  {/* Invisible Fees List */}
                  <div className="space-y-2 pl-3 border-l border-cyan-500/30 text-xs text-slate-400">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        Shipping & Freight (5%):
                      </span>
                      <span>+${freightFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        Logistics Insurance (1%):
                      </span>
                      <span>+${insuranceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        Customs Duties & Fees (2%):
                      </span>
                      <span>+${customsFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        Handling Surcharge (1.5 EUR):
                      </span>
                      <span>+${handlingFee.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-300">Net Delivered Cost (Landed):</span>
                    <span className="text-base font-bold text-emerald-400">${landedCost}</span>
                  </div>
                </div>

                <div className="text-slate-400 text-xs bg-slate-950/30 p-2.5 rounded border border-slate-800/40">
                  💡 <span className="font-medium text-slate-300">ProcureOS Auto-Transit:</span> System automatically computed and applied hidden tariffs, saving hours of manual labor.
                </div>
              </div>

              {/* Margin Simulator */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold tracking-wide text-slate-300 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-purple-400" />
                  Margin Simulator
                </h4>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-400">Target Profit Margin:</span>
                      <span className="font-bold text-purple-400">{desiredMargin}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="85" 
                      value={desiredMargin}
                      onChange={(e) => setDesiredMargin(Number(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>10% Min</span>
                      <span>Average margin for {selectedProduct.category}</span>
                      <span>85% Max</span>
                    </div>
                  </div>

                  {/* Pricing Output */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-[10px] text-slate-500">Minimum B2C Price:</div>
                      <div className="text-base font-bold text-slate-200 mt-0.5">${calculatedRetailPrice}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">(Market Retail: ${selectedProduct.retailPrice})</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-[10px] text-slate-500">Net Profit / unit:</div>
                      <div className="text-base font-bold text-cyan-400 mt-0.5">${profitPerUnit}</div>
                      <div className="text-[9px] text-emerald-400 mt-0.5">ROI: {roi}%</div>
                    </div>
                  </div>

                  {/* Pre-Negotiate Actions */}
                  <div className="pt-2">
                    <button 
                      onClick={() => onStartNegotiation(selectedProduct, Number((selectedProduct.factoryPrice * 0.88).toFixed(2)), desiredMargin)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-100 font-medium rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
                    >
                      <span>Start Lot Negotiation</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="text-[9px] text-slate-500 text-center mt-1.5">
                      We will automatically attempt Fast-Track approval at 85%+ of base price.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 backdrop-blur-md border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500">
            <DollarSign className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base text-slate-400">Select a product from the catalog on the left to start the simulator</p>
            <p className="text-xs text-slate-500 mt-1">The system will automatically calculate shipping fees and margins.</p>
          </div>
        )}
      </div>
    </div>
  );
}
