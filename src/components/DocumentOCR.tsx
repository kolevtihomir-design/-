import React, { useState } from "react";
import { 
  FileText, Upload, CheckCircle, RefreshCw, Layers, 
  ArrowRight, Sparkles, ChevronRight, Calculator, Check 
} from "lucide-react";
import { OCRData, OCRItem } from "../types";

interface DocumentOCRProps {
  onImportToNegotiation: (item: OCRItem, vendor: string) => void;
}

const SAMPLE_INVOICE_1: OCRData = {
  vendor: "Yiwu Sourcing Alliance Co.",
  invoiceNumber: "PI-2026-8891",
  date: "2026-06-25",
  items: [
    { sku: "FUR-ERGO-001", description: "Premium Ergonomic Office Chair", quantity: 150, unitPrice: 72.00, total: 10800.00 },
    { sku: "ELE-PWR-003", description: "Ultra-thin Power Bank 10000mAh", quantity: 500, unitPrice: 8.10, total: 4050.00 }
  ],
  subtotal: 14850.00,
  shippingEstimate: 742.50,
  totalAmount: 15592.50
};

const SAMPLE_INVOICE_2: OCRData = {
  vendor: "Zhejiang Bamboo Products Factory",
  invoiceNumber: "PI-2026-4112",
  date: "2026-06-28",
  items: [
    { sku: "ECO-TOOTH-002", description: "Eco-Friendly Bamboo Toothbrush Pack", quantity: 2000, unitPrice: 1.65, total: 3300.00 },
    { sku: "DEC-VASE-004", description: "Modern Minimalist Ceramic Vase", quantity: 120, unitPrice: 11.20, total: 1344.00 }
  ],
  subtotal: 4644.00,
  shippingEstimate: 320.00,
  totalAmount: 4964.00
};

export default function DocumentOCR({ onImportToNegotiation }: DocumentOCRProps) {
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<OCRData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importedItems, setImportedItems] = useState<{ [sku: string]: boolean }>({});

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateOcrProcessing(SAMPLE_INVOICE_1);
    }
  };

  const loadPresetInvoice = (invoice: OCRData) => {
    simulateOcrProcessing(invoice);
  };

  const simulateOcrProcessing = (invoice: OCRData) => {
    setLoading(true);
    setExtractedData(null);
    setImportedItems({});

    setTimeout(() => {
      setExtractedData(invoice);
      setLoading(false);
    }, 1500);
  };

  const handleImport = (item: OCRItem, vendor: string) => {
    onImportToNegotiation(item, vendor);
    setImportedItems(prev => ({ ...prev, [item.sku]: true }));
  };

  // Landed Cost calculator for OCR items (using 8% invisible fees + $1.65 handling)
  const calculateItemLandedCost = (unitPrice: number) => {
    return Number((unitPrice * 1.08 + 1.65).toFixed(2));
  };

  return (
    <div id="document-ocr-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Upload Zone */}
      <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)] flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-1">
            <Upload className="w-5 h-5 text-cyan-400" />
            Document OCR Extraction
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Upload a proforma invoice PDF or specifications sheet. The system will extract items automatically via Gemini AI.
          </p>

          {/* Drag & Drop Box */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              dragActive 
                ? "border-cyan-400 bg-cyan-950/20" 
                : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
            }`}
          >
            <div className="space-y-3">
              <FileText className={`w-10 h-10 mx-auto ${dragActive ? "text-cyan-400 animate-pulse" : "text-slate-600"}`} />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-cyan-400">Drag and drop PDF file here</span> or click to select file
              </div>
              <div className="text-[10px] text-slate-500">
                Max size: 10MB • Supports PDF, PNG, JPEG
              </div>
            </div>
          </div>
        </div>

        {/* Presets for Easy testing */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="text-xs text-slate-500 mb-2.5 font-medium">Quickly test with prepared sample invoices:</div>
          <div className="space-y-2">
            <button 
              onClick={() => loadPresetInvoice(SAMPLE_INVOICE_1)}
              className="w-full text-left p-2.5 bg-slate-950/80 hover:bg-slate-900/60 rounded-lg border border-slate-800/80 text-xs text-slate-300 transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="truncate pr-2">
                <div className="font-semibold text-slate-200 truncate">Yiwu_Sourcing_Invoice_#PI8891.pdf</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Furniture & Electronics • 2 items</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            </button>

            <button 
              onClick={() => loadPresetInvoice(SAMPLE_INVOICE_2)}
              className="w-full text-left p-2.5 bg-slate-950/80 hover:bg-slate-900/60 rounded-lg border border-slate-800/80 text-xs text-slate-300 transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="truncate pr-2">
                <div className="font-semibold text-slate-200 truncate">Zhejiang_Bamboo_Wholesale_#PI4112.pdf</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Cosmetics & Decor • 2 items</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* OCR Results Display */}
      <div className="lg:col-span-8 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
            <h4 className="font-semibold text-slate-200">Gemini OCR Scanning in progress...</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              AI analyzes the structure of the proforma invoice and extracts catalogs, eliminating manual SKU data entry.
            </p>
          </div>
        ) : extractedData ? (
          <div className="space-y-5 animate-fade-in">
            {/* Invoice Metadata Block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs">
              <div className="space-y-1">
                <div className="text-slate-500">Supplier (Vendor)</div>
                <div className="font-bold text-slate-200 text-sm">{extractedData.vendor}</div>
              </div>
              <div className="flex gap-4">
                <div>
                  <div className="text-slate-500">Invoice No.</div>
                  <div className="font-mono text-slate-300 font-semibold mt-0.5">{extractedData.invoiceNumber}</div>
                </div>
                <div>
                  <div className="text-slate-500">Date</div>
                  <div className="font-mono text-slate-300 font-semibold mt-0.5">{extractedData.date}</div>
                </div>
                <div>
                  <div className="text-slate-500">Total Amount</div>
                  <div className="text-emerald-400 font-bold mt-0.5">${extractedData.totalAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Smart Cards Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Digital Item Smart Cards</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extractedData.items.map((item, i) => {
                  const landed = calculateItemLandedCost(item.unitPrice);
                  const isImported = importedItems[item.sku];

                  return (
                    <div 
                      key={i} 
                      className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-cyan-500/30 transition-all shadow-[0_0_10px_rgba(6,182,212,0.02)]"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/10">
                          {item.sku}
                        </span>
                        <span className="text-[10px] text-slate-500">Quantity: <b>{item.quantity} pcs.</b></span>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-slate-200 leading-snug line-clamp-1" title={item.description}>
                          {item.description}
                        </h5>
                        <div className="flex justify-between items-center text-xs mt-2 border-b border-slate-900 pb-1.5">
                          <span className="text-slate-500">Unit price:</span>
                          <span className="font-semibold text-slate-300">${item.unitPrice}</span>
                        </div>
                      </div>

                      {/* Landed Cost quick calculation */}
                      <div className="flex justify-between items-center text-xs text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-900">
                        <span className="flex items-center gap-1">
                          <Calculator className="w-3.5 h-3.5 text-cyan-500" />
                          Estimated Landed Cost:
                        </span>
                        <span className="text-emerald-400 font-bold font-mono">${landed}</span>
                      </div>

                      {/* Import action */}
                      <button 
                        onClick={() => handleImport(item, extractedData.vendor)}
                        disabled={isImported}
                        className={`w-full flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isImported 
                            ? "bg-slate-900 text-slate-500 border border-slate-800" 
                            : "bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400"
                        }`}
                      >
                        {isImported ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Imported to CRM</span>
                          </>
                        ) : (
                          <>
                            <span>Send to Negotiations CRM</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base text-slate-400">No document loaded for OCR extraction</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              Please select one of the prepared proforma PDF samples on the left to simulate optical extraction and item Smart Card generation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
