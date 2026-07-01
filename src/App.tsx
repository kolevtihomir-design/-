import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { B2BProduct, NegotiationOffer, OCRItem, OCRData, GlobalSearchItem } from "./types";
import { 
  Building2, FileText, Send, Mail, LineChart, 
  Compass, TrendingUp, HelpCircle, MessageSquare, 
  RefreshCw, AlertCircle, Sparkles, CheckCircle2, 
  Check, Plus, Trash2, Edit3, ArrowRight, FileDown,
  Upload, Sparkle, X, LayoutGrid, ArrowUpRight, ShieldCheck, HelpCircle as InfoIcon,
  Globe, Search, Palette, FileSpreadsheet, KeyRound, LogOut, UserCheck,
  Laptop, Server, Clock, ShoppingBag
} from "lucide-react";
import { initAuth, googleSignIn, logout as googleLogout } from "./googleAuth";
import { createSourcingSpreadsheet, syncSpreadsheetData, importProductsFromSpreadsheet } from "./googleSheets";
import { getProductImage } from "./productImages";

export const themePresets = {
  teal: {
    primaryBg: "bg-teal-600",
    primaryHover: "hover:bg-teal-500",
    text: "text-teal-700",
    border: "border-teal-200",
    lightBg: "bg-teal-50",
    borderFocus: "focus:border-teal-500 focus:ring-teal-500/30",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
    accentText: "text-teal-600",
    activeTab: "bg-teal-50/70 text-teal-700 border border-teal-200/60"
  },
  indigo: {
    primaryBg: "bg-indigo-600",
    primaryHover: "hover:bg-indigo-500",
    text: "text-indigo-700",
    border: "border-indigo-200",
    lightBg: "bg-indigo-50",
    borderFocus: "focus:border-indigo-500 focus:ring-indigo-500/30",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    accentText: "text-indigo-600",
    activeTab: "bg-indigo-50/70 text-indigo-700 border border-indigo-200/60"
  },
  emerald: {
    primaryBg: "bg-emerald-600",
    primaryHover: "hover:bg-emerald-500",
    text: "text-emerald-700",
    border: "border-emerald-200",
    lightBg: "bg-emerald-50",
    borderFocus: "focus:border-emerald-500 focus:ring-emerald-500/30",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    accentText: "text-emerald-600",
    activeTab: "bg-emerald-50/70 text-emerald-700 border border-emerald-200/60"
  },
  rose: {
    primaryBg: "bg-rose-600",
    primaryHover: "hover:bg-rose-500",
    text: "text-rose-700",
    border: "border-rose-200",
    lightBg: "bg-rose-50",
    borderFocus: "focus:border-rose-500 focus:ring-rose-500/30",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    accentText: "text-rose-600",
    activeTab: "bg-rose-50/70 text-rose-700 border border-rose-200/60"
  },
  amber: {
    primaryBg: "bg-amber-600",
    primaryHover: "hover:bg-amber-500",
    text: "text-amber-700",
    border: "border-amber-200",
    lightBg: "bg-amber-50",
    borderFocus: "focus:border-amber-500 focus:ring-amber-500/30",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    accentText: "text-amber-600",
    activeTab: "bg-amber-50/70 text-amber-700 border border-amber-200/60"
  },
  violet: {
    primaryBg: "bg-violet-600",
    primaryHover: "hover:bg-violet-500",
    text: "text-violet-700",
    border: "border-violet-200",
    lightBg: "bg-violet-50",
    borderFocus: "focus:border-violet-500 focus:ring-violet-500/30",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    accentText: "text-violet-600",
    activeTab: "bg-violet-50/70 text-violet-700 border border-violet-200/60"
  },
  slate: {
    primaryBg: "bg-slate-700",
    primaryHover: "hover:bg-slate-600",
    text: "text-slate-800",
    border: "border-slate-300",
    lightBg: "bg-slate-100",
    borderFocus: "focus:border-slate-700 focus:ring-slate-700/30",
    badge: "bg-slate-100 text-slate-800 border-slate-200",
    accentText: "text-slate-700",
    activeTab: "bg-slate-100/70 text-slate-800 border border-slate-300/60"
  }
};

export const canvasPresets = {
  default: "bg-slate-50",
  teal: "bg-teal-50/40",
  indigo: "bg-indigo-50/40",
  emerald: "bg-emerald-50/40",
  rose: "bg-rose-50/40",
  amber: "bg-amber-50/40",
  violet: "bg-violet-50/40",
  slate: "bg-slate-100/60"
};

export default function App() {
  const formatTimeLeft = (seconds: number | null) => {
    if (seconds === null) return "60:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const [themeColor, setThemeColor] = useState<"teal" | "indigo" | "emerald" | "rose" | "amber" | "violet" | "slate">(() => {
    const saved = localStorage.getItem("procureos_theme");
    return (saved as any) || "teal";
  });

  const [canvasColor, setCanvasColor] = useState<"teal" | "indigo" | "emerald" | "rose" | "amber" | "violet" | "slate" | "default">(() => {
    const saved = localStorage.getItem("procureos_canvas");
    return (saved as any) || "default";
  });

  // Google Sheets Integration State
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [linkedSheetId, setLinkedSheetId] = useState<string | null>(() => localStorage.getItem("procureos_linked_spreadsheet_id"));
  const [linkedSheetUrl, setLinkedSheetUrl] = useState<string | null>(() => localStorage.getItem("procureos_linked_spreadsheet_url"));
  const [sheetsSyncLoading, setSheetsSyncLoading] = useState(false);
  const [sheetsSyncMessage, setSheetsSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [googleTokenExpiresAt, setGoogleTokenExpiresAt] = useState<number | null>(() => {
    const saved = localStorage.getItem("google_token_expires_at");
    return saved ? parseInt(saved, 10) : null;
  });
  const [googleTokenSecondsLeft, setGoogleTokenSecondsLeft] = useState<number | null>(null);

  // PWA installation trigger
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // Helper to robustly clear and set google translate cookies across all subdomain variations
  const setGoogleTranslateCookie = (val: string) => {
    const domains = [
      "",
      window.location.hostname,
      `.${window.location.hostname}`,
      "europe-west2.run.app",
      ".europe-west2.run.app",
      "run.app",
      ".run.app"
    ];
    
    domains.forEach(d => {
      const domainStr = d ? `; domain=${d}` : "";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${domainStr}`;
    });

    domains.forEach(d => {
      const domainStr = d ? `; domain=${d}` : "";
      document.cookie = `googtrans=${val}; path=/;${domainStr}`;
    });
  };

  // Manual language toggle state (forces English /en/en or Bulgarian /en/bg)
  const [currentLang, setCurrentLang] = useState<"en" | "bg" | "auto">(() => {
    const saved = localStorage.getItem("procureos_manual_lang");
    if (saved === "en" || saved === "bg") return saved;
    return "auto";
  });

  const handleLanguageToggle = (lang: "en" | "bg") => {
    localStorage.setItem("procureos_manual_lang", lang);
    const val = lang === "en" ? "/en/en" : "/en/bg";
    setGoogleTranslateCookie(val);
    setCurrentLang(lang);
    window.location.reload();
  };

  // Client Authentication & Portal States (with local persistence)
  const [clientSession, setClientSession] = useState<{
    name: string;
    email: string;
    company: string;
    phone: string;
    isEmailVerified: boolean;
    isPaid: boolean;
    planSelected?: string;
    isDeputyAdmin?: boolean;
  } | null>(() => {
    const saved = localStorage.getItem("procureos_client_session");
    return saved ? JSON.parse(saved) : null;
  });

  const [authView, setAuthView] = useState<"login" | "register" | "verify" | "forgot" | "reset" | "payment">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authCompany, setAuthCompany] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authVerifyCode, setAuthVerifyCode] = useState("");
  const [authNewPassword, setAuthNewPassword] = useState("");
  const [authNotification, setAuthNotification] = useState<{ type: "success" | "error"; text: string; code?: string } | null>(null);

  // Simulated Stripe Checkout Plan details
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<{ name: string; price: number }>({
    name: "B2B Essential Sourcing",
    price: 49
  });
  const [paymentCardName, setPaymentCardName] = useState("");
  const [paymentCardNumber, setPaymentCardNumber] = useState("");
  const [paymentCardExpiry, setPaymentCardExpiry] = useState("");
  const [paymentCardCvc, setPaymentCardCvc] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Admin Registered Users list for tracing
  const [registeredUsersList, setRegisteredUsersList] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (clientSession) {
      localStorage.setItem("procureos_client_session", JSON.stringify(clientSession));
    } else {
      localStorage.removeItem("procureos_client_session");
    }
  }, [clientSession]);

  useEffect(() => {
    localStorage.setItem("procureos_theme", themeColor);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem("procureos_canvas", canvasColor);
  }, [canvasColor]);

  useEffect(() => {
    // Initialize google auth state listener
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        // If there's no expiration timestamp in localStorage, initialize it now (60 minutes)
        if (!localStorage.getItem("google_token_expires_at")) {
          const exp = Date.now() + 3600 * 1000;
          setGoogleTokenExpiresAt(exp);
          localStorage.setItem("google_token_expires_at", exp.toString());
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setGoogleTokenExpiresAt(null);
        localStorage.removeItem("google_token_expires_at");
      }
    );
    return () => unsubscribe();
  }, []);

  // Google Token Lifespan countdown (60 minutes)
  useEffect(() => {
    if (!googleToken) {
      setGoogleTokenSecondsLeft(null);
      setGoogleTokenExpiresAt(null);
      localStorage.removeItem("google_token_expires_at");
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const expires = googleTokenExpiresAt || (now + 3600 * 1000);
      const left = Math.max(0, Math.floor((expires - now) / 1000));
      setGoogleTokenSecondsLeft(left);

      if (left <= 0) {
        // Automatically sign out/clear token once expired
        setGoogleToken(null);
        setGoogleUser(null);
        setGoogleTokenExpiresAt(null);
        localStorage.removeItem("google_token_expires_at");
        setSheetsSyncMessage({
          type: "error",
          text: "Google сесията изтече (минали са 60 минути). Моля, презаредете сесията от панела за бърз достъп или се свържете наново!"
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [googleToken, googleTokenExpiresAt]);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert("За да инсталирате ProcureOS на десктопа си ръчно:\n\n1. В Google Chrome: Кликнете на иконата с 3 точки горе вдясно -> 'Запазване и споделяне' -> 'Инсталиране на приложението'.\n2. На Apple Safari (iPhone/Mac): Натиснете бутона 'Споделяне' -> 'Добавяне към началния екран'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsAppInstalled(true);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    // Respect manually saved language, or set default to Bulgarian on first load
    const manualLang = localStorage.getItem("procureos_manual_lang");
    if (manualLang === "en") {
      setGoogleTranslateCookie("/en/en");
    } else if (manualLang === "bg") {
      setGoogleTranslateCookie("/en/bg");
    } else if (!document.cookie.includes("googtrans")) {
      // Default to Bulgarian on very first load
      setGoogleTranslateCookie("/en/bg");
    }
  }, []);

  const [activeTab, setActiveTab] = useState<"catalog" | "negotiation" | "ocr" | "global-search" | "admin-audit">("catalog");
  const [catalogViewMode, setCatalogViewMode] = useState<"grid" | "split">("grid");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("All");
  const [gridSelectedProduct, setGridSelectedProduct] = useState<B2BProduct | null>(null);
  const [showGridProductDetailModal, setShowGridProductDetailModal] = useState<boolean>(false);
  const [products, setProducts] = useState<B2BProduct[]>([]);
  const [offers, setOffers] = useState<NegotiationOffer[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<B2BProduct | null>(null);
  const [loading, setLoading] = useState(true);

  // Global Supplier Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchItem[]>([]);
  const [globalSearchError, setGlobalSearchError] = useState<string | null>(null);
  const [globalSearchGrounding, setGlobalSearchGrounding] = useState<any>(null);
  const [globalSearchImportedIds, setGlobalSearchImportedIds] = useState<Set<string>>(new Set());

  // Dynamic Product Form State (for Add / Edit)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<B2BProduct | null>(null);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "Furniture",
    retailPrice: "",
    factoryPrice: "",
    weightKg: "1.0",
    supplier: "",
    supplierTrust: "95",
    supplierYears: "3",
    certifications: "CE",
    leadTimeDays: "15",
    description: ""
  });

  // Bulk Product CSV Upload State & Parsers
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkUploadResult, setBulkUploadResult] = useState<{
    success: boolean;
    insertedCount: number;
    updatedCount: number;
    totalCount: number;
    errors: string[];
  } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Helper: In-browser CSV line-by-line secure parsing
  const parseCSV = (text: string): Record<string, string>[] => {
    const lines: string[] = [];
    let currentLine = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === '\n' && !insideQuotes) {
        lines.push(currentLine);
        currentLine = "";
      } else if (char === '\r' && !insideQuotes) {
        // Skip carriage returns
      } else {
        currentLine += char;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    if (lines.length < 2) return [];

    const parseCSVLine = (lineStr: string): string[] => {
      const result: string[] = [];
      let currentVal = "";
      let insideQ = false;

      for (let i = 0; i < lineStr.length; i++) {
        const char = lineStr[i];
        if (char === '"') {
          insideQ = !insideQ;
        } else if (char === ',' && !insideQ) {
          result.push(currentVal);
          currentVal = "";
        } else {
          currentVal += char;
        }
      }
      result.push(currentVal);
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const results: Record<string, string>[] = [];

    for (let j = 1; j < lines.length; j++) {
      if (!lines[j].trim()) continue;
      const values = parseCSVLine(lines[j]);
      const obj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        const cleanHeader = header.trim().replace(/^["']|["']$/g, '');
        const rawVal = values[idx] || "";
        obj[cleanHeader] = rawVal.trim().replace(/^["']|["']$/g, '');
      });
      results.push(obj);
    }

    return results;
  };

  const handleParseAndUploadCSV = async (rawText: string) => {
    setBulkLoading(true);
    setBulkUploadResult(null);

    try {
      const rawParsed = parseCSV(rawText);
      if (rawParsed.length === 0) {
        setBulkUploadResult({
          success: false,
          insertedCount: 0,
          updatedCount: 0,
          totalCount: 0,
          errors: ["The uploaded data appears to be empty or missing valid headers."]
        });
        return;
      }

      const findKey = (row: Record<string, string>, possibleNames: string[]): string => {
        const rowKeys = Object.keys(row);
        for (const name of possibleNames) {
          const found = rowKeys.find(k => k.toLowerCase().replace(/[\s_()]/g, "") === name.toLowerCase().replace(/[\s_()]/g, ""));
          if (found) return row[found];
        }
        return "";
      };

      const formattedProducts = rawParsed.map((row) => {
        const sku = findKey(row, ["sku", "productcode", "code", "itemcode"]);
        const name = findKey(row, ["name", "productname", "title", "label"]);
        const category = findKey(row, ["category", "group", "type"]) || "General";
        const factoryPriceVal = findKey(row, ["factoryprice", "factory", "cost", "baseprice", "purchaseprice"]);
        const retailPriceVal = findKey(row, ["retailprice", "retail", "price", "sellingprice"]);
        const weightKgVal = findKey(row, ["weight", "weightkg", "mass"]);
        const supplier = findKey(row, ["supplier", "manufacturer", "vendor"]) || "Unknown Supplier";
        const supplierTrust = findKey(row, ["suppliertrust", "trustscore", "trust"]) || "90";
        const supplierYears = findKey(row, ["supplieryears", "yearsactive", "experience"]) || "1";
        const certifications = findKey(row, ["certifications", "certs", "approved"]) || "CE";
        const leadTimeDays = findKey(row, ["leadtimedays", "leadtime", "days"]) || "15";
        const description = findKey(row, ["description", "info", "summary", "notes"]) || "";

        return {
          sku,
          name,
          category,
          factoryPrice: factoryPriceVal ? Number(factoryPriceVal) : undefined,
          retailPrice: retailPriceVal ? Number(retailPriceVal) : undefined,
          weightKg: weightKgVal ? Number(weightKgVal) : undefined,
          supplier,
          supplierTrust: Number(supplierTrust),
          supplierYears: Number(supplierYears),
          certifications,
          leadTimeDays: Number(leadTimeDays),
          description
        };
      });

      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: formattedProducts })
      });

      if (response.ok) {
        const data = await response.json();
        setBulkUploadResult({
          success: data.success,
          insertedCount: data.insertedCount,
          updatedCount: data.updatedCount,
          totalCount: data.totalCount,
          errors: data.errors || []
        });
        fetchProducts();
      } else {
        const errorData = await response.json();
        setBulkUploadResult({
          success: false,
          insertedCount: 0,
          updatedCount: 0,
          totalCount: 0,
          errors: [errorData.error || "Server rejected bulk upload request."]
        });
      }
    } catch (err: any) {
      setBulkUploadResult({
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        totalCount: 0,
        errors: [`Parsing error: ${err.message}`]
      });
    } finally {
      setBulkLoading(false);
    }
  };

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
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const text = event.target.result as string;
          setBulkCsvText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const text = event.target.result as string;
          setBulkCsvText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  // Main Dashboard Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I am your **AI Sourcing Assistant**. I can calculate final landed costs, analyze profit margins, recommend negotiation strategies with factories, or answer questions about logistics, VAT, and custom duties."
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Search and Calculator states
  const [searchTerm, setSearchTerm] = useState("");
  const [desiredMargin, setDesiredMargin] = useState(40); // default 40%
  const [catalogPage, setCatalogPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    setCatalogPage(1);
  }, [searchTerm]);

  // Quick Offer Form State
  const [quickOfferSearch, setQuickOfferSearch] = useState("");
  const [quickOfferPrice, setQuickOfferPrice] = useState<string>("");
  const [quickOfferEmail, setQuickOfferEmail] = useState("kolev.tihomir@gmail.com");
  const [quickOfferLoading, setQuickOfferLoading] = useState(false);
  const [quickOfferResult, setQuickOfferResult] = useState<{ message: string; status: string } | null>(null);

  // Supplier Gateway & SMTP Integration State
  const [gatewayWebhookUrl, setGatewayWebhookUrl] = useState("");
  const [gatewayWebhookEnabled, setGatewayWebhookEnabled] = useState(true);
  const [gatewaySmtpHost, setGatewaySmtpHost] = useState("");
  const [gatewaySmtpPort, setGatewaySmtpPort] = useState("2525");
  const [gatewaySmtpUser, setGatewaySmtpUser] = useState("");
  const [gatewaySmtpPass, setGatewaySmtpPass] = useState("");
  const [gatewaySmtpFrom, setGatewaySmtpFrom] = useState("");
  const [gatewaySmtpEnabled, setGatewaySmtpEnabled] = useState(false);
  const [gatewayTestRecipient, setGatewayTestRecipient] = useState("kolev.tihomir@gmail.com");

  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewaySaveStatus, setGatewaySaveStatus] = useState("");
  const [gatewayWebhookTestLog, setGatewayWebhookTestLog] = useState("");
  const [gatewayEmailTestLog, setGatewayEmailTestLog] = useState("");

  // B2B Disintermediation and Trial States
  const [maskSupplierInfo, setMaskSupplierInfo] = useState(true);
  const [escrowEnabled, setEscrowEnabled] = useState(true);
  const [showStripeCheckoutInApp, setShowStripeCheckoutInApp] = useState(false);

  const fetchGatewayConfig = async () => {
    try {
      const res = await fetch("/api/supplier/config");
      if (res.ok) {
        const data = await res.json();
        setGatewayWebhookUrl(data.webhookUrl || "");
        setGatewayWebhookEnabled(data.webhookEnabled !== undefined ? data.webhookEnabled : true);
        setGatewaySmtpHost(data.smtpHost || "");
        setGatewaySmtpPort(String(data.smtpPort || "2525"));
        setGatewaySmtpUser(data.smtpUser || "");
        setGatewaySmtpPass(data.smtpPass || "");
        setGatewaySmtpFrom(data.smtpFrom || "");
        setGatewaySmtpEnabled(data.smtpEnabled !== undefined ? data.smtpEnabled : false);
        setMaskSupplierInfo(data.maskSupplierInfo !== undefined ? data.maskSupplierInfo : true);
        setEscrowEnabled(data.escrowEnabled !== undefined ? data.escrowEnabled : true);
      }
    } catch (err) {
      console.error("Failed to load supplier integration config:", err);
    }
  };

  const handleSaveGatewayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayLoading(true);
    setGatewaySaveStatus("");
    try {
      const res = await fetch("/api/supplier/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: gatewayWebhookUrl,
          webhookEnabled: gatewayWebhookEnabled,
          smtpHost: gatewaySmtpHost,
          smtpPort: gatewaySmtpPort,
          smtpUser: gatewaySmtpUser,
          smtpPass: gatewaySmtpPass,
          smtpFrom: gatewaySmtpFrom,
          smtpEnabled: gatewaySmtpEnabled,
          maskSupplierInfo,
          escrowEnabled
        })
      });
      if (res.ok) {
        setGatewaySaveStatus("✅ Integration Settings updated successfully!");
        fetchGatewayConfig();
      } else {
        setGatewaySaveStatus("❌ Failed to save configuration settings.");
      }
    } catch (err: any) {
      setGatewaySaveStatus(`❌ Connection error: ${err.message}`);
    } finally {
      setGatewayLoading(false);
    }
  };

  const handleToggleOption = async (field: "maskSupplierInfo" | "escrowEnabled", value: boolean) => {
    try {
      const res = await fetch("/api/supplier/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field]: value
        })
      });
      if (res.ok) {
        fetchGatewayConfig();
      }
    } catch (err) {
      console.error("Failed to update config option:", err);
    }
  };

  const handleTestWebhook = async () => {
    setGatewayWebhookTestLog("📡 Broadcasting secure test event payload to supplier gateway...");
    try {
      const res = await fetch("/api/supplier/test-webhook", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setGatewayWebhookTestLog(`🟢 Succeeded: ${data.log}\nResponse body: ${data.data || "(No text content returned)"}`);
      } else {
        setGatewayWebhookTestLog(`🔴 Failed: ${data.log}\nMake sure your endpoint is active.`);
      }
    } catch (err: any) {
      setGatewayWebhookTestLog(`🔴 Webhook call crashed: ${err.message}`);
    }
  };

  const handleTestEmail = async () => {
    setGatewayEmailTestLog(`📧 Initializing real SMTP connection & delivering verification email to ${gatewayTestRecipient}...`);
    try {
      const res = await fetch("/api/supplier/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testRecipient: gatewayTestRecipient })
      });
      const data = await res.json();
      if (data.success) {
        setGatewayEmailTestLog(`🟢 SMTP Success: ${data.log}`);
      } else {
        setGatewayEmailTestLog(`🔴 SMTP Error: ${data.log}\nPlease verify host, port, credentials, and network rules.`);
      }
    } catch (err: any) {
      setGatewayEmailTestLog(`🔴 Failed to reach email server: ${err.message}`);
    }
  };

  // OCR/Invoice Parser State
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRData | null>(null);
  const [ocrDragActive, setOcrDragActive] = useState(false);
  const [ocrImportedSkus, setOcrImportedSkus] = useState<Set<string>>(new Set());

  // Fetch initial products and offers from Express Backend APIs
  const fetchProducts = async () => {
    try {
      const prodRes = await fetch("/api/products");
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
        // Set first product as selected if none is selected
        if (prodData.length > 0 && !selectedProduct) {
          setSelectedProduct(prodData[0]);
        }
      }
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  const fetchOffers = async () => {
    try {
      const offerRes = await fetch("/api/admin/offers");
      if (offerRes.ok) {
        const offerData = await offerRes.json();
        setOffers(offerData);
      }
    } catch (err) {
      console.error("Error loading offers:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchOffers()]);
      setLoading(false);
    }
    loadData();
  }, []);

  // Sync quick offer price when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      setQuickOfferPrice(Number(selectedProduct.factoryPrice * 0.88).toFixed(2));
      setQuickOfferResult(null);
    }
  }, [selectedProduct]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // Main chat submit (real Gemini AI call)
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: chatMessages
        })
      });

      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.text }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: "⚠️ Connection to server failed. Please check if the dev server is active and running." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Global Supplier Search Submit
  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;

    setGlobalSearchLoading(true);
    setGlobalSearchError(null);
    setGlobalSearchResults([]);
    setGlobalSearchGrounding(null);

    try {
      const res = await fetch("/api/global-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: globalSearchQuery })
      });

      if (!res.ok) throw new Error("Error performing global search.");
      const data = await res.json();
      setGlobalSearchResults(data.results || []);
      setGlobalSearchGrounding(data.grounding || null);
    } catch (err: any) {
      console.error(err);
      setGlobalSearchError(err.message || "Failed to connect to search server.");
    } finally {
      setGlobalSearchLoading(false);
    }
  };

  // Import product from global search results to the catalog
  const handleImportGlobalProduct = async (item: GlobalSearchItem) => {
    // Convert USD to base factoryPrice
    const payload = {
      sku: "GS-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
      name: item.productName,
      category: "Import",
      retailPrice: Number((item.unitPriceUsd * 2.5).toFixed(2)), // simple markup
      factoryPrice: Number(item.unitPriceUsd.toFixed(2)),
      weightKg: 1.0,
      supplier: item.supplier,
      supplierTrust: 90,
      supplierYears: 2,
      certifications: ["CE", "RoHS"],
      leadTimeDays: item.deliveryTimeDays,
      description: `${item.descriptionBg || ""} Global supplier (${item.country}). Delivery method: ${item.shippingMethod}. Source: ${item.sourceUrl}`
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setGlobalSearchImportedIds(prev => {
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });
        await fetchProducts();
      } else {
        const errData = await res.json();
        alert("Import error: " + errData.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to backend server.");
    }
  };

  // Add / Edit Product Submit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct ? `/api/products/${editingProduct.sku}` : "/api/products";
    const method = editingProduct ? "PUT" : "POST";

    const payload = {
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      retailPrice: parseFloat(formData.retailPrice),
      factoryPrice: parseFloat(formData.factoryPrice),
      weightKg: parseFloat(formData.weightKg),
      supplier: formData.supplier,
      supplierTrust: parseInt(formData.supplierTrust),
      supplierYears: parseInt(formData.supplierYears),
      certifications: formData.certifications.split(",").map(c => c.trim()),
      leadTimeDays: parseInt(formData.leadTimeDays),
      description: formData.description
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedProduct = await res.json();
        await fetchProducts();
        setSelectedProduct(updatedProduct);
        setShowProductModal(false);
        setEditingProduct(null);
      } else {
        const errData = await res.json();
        alert("Error saving: " + errData.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred connecting to the server.");
    }
  };

  // Delete Product
  const handleDeleteProduct = async (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete the product with SKU "${sku}"?`)) return;

    try {
      const res = await fetch(`/api/products/${sku}`, { method: "DELETE" });
      if (res.ok) {
        await fetchProducts();
        if (selectedProduct?.sku === sku) {
          setSelectedProduct(products.find(p => p.sku !== sku) || null);
        }
      } else {
        const errData = await res.json();
        alert("Error deleting: " + errData.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the server for deletion.");
    }
  };

  // Prepare edit form
  const startEditProduct = (product: B2BProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      retailPrice: String(product.retailPrice),
      factoryPrice: String(product.factoryPrice),
      weightKg: String(product.weightKg),
      supplier: product.supplier,
      supplierTrust: String(product.supplierTrust),
      supplierYears: String(product.supplierYears),
      certifications: product.certifications.join(", "),
      leadTimeDays: String(product.leadTimeDays),
      description: product.description
    });
    setShowProductModal(true);
  };

  // Prepare add form
  const startAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      sku: "PROD-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
      name: "",
      category: "Furniture",
      retailPrice: "",
      factoryPrice: "",
      weightKg: "1.0",
      supplier: "",
      supplierTrust: "95",
      supplierYears: "3",
      certifications: "CE",
      leadTimeDays: "15",
      description: ""
    });
    setShowProductModal(true);
  };

  // Submit Quick Offer (Negotiation)
  const handleQuickOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setQuickOfferLoading(true);
    setQuickOfferResult(null);

    try {
      const res = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: selectedProduct.sku,
          proposedPrice: parseFloat(quickOfferPrice),
          customerEmail: quickOfferEmail,
          marginSimulated: desiredMargin
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOffers(prev => [data.offer, ...prev]);
        setQuickOfferResult({
          message: data.message,
          status: data.offer.status
        });
      } else {
        const err = await res.json();
        alert("Error sending offer: " + err.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during offer submission.");
    } finally {
      setQuickOfferLoading(false);
    }
  };

  // Resolve pending offers (Admin Human-in-the-Loop)
  const handleResolveOffer = async (id: string, action: "accepted" | "rejected" | "counter", counterPrice?: number) => {
    try {
      const res = await fetch("/api/admin/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, counterPrice })
      });
      if (res.ok) {
        setOffers(prev => prev.map(o => {
          if (o.id === id) {
            let proposedPrice = o.proposedPrice;
            if (action === "counter" && counterPrice) {
              proposedPrice = counterPrice;
            }
            return {
              ...o,
              status: action === "counter" ? "accepted" : action as "accepted" | "rejected",
              proposedPrice,
              landedCost: Number((proposedPrice * 1.08 + 1.65).toFixed(2))
            };
          }
          return o;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Google Sheets Integration Handlers
  const handleGoogleLogin = async () => {
    setSheetsSyncMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        const exp = Date.now() + 3600 * 1000;
        setGoogleTokenExpiresAt(exp);
        localStorage.setItem("google_token_expires_at", exp.toString());
        setSheetsSyncMessage({ type: "success", text: "Успешно се свързахте с Google Workspace!" });
      }
    } catch (err: any) {
      console.error(err);
      setSheetsSyncMessage({ type: "error", text: `Връзката не бе успешна: ${err.message}` });
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      setGoogleToken(null);
      setGoogleTokenExpiresAt(null);
      localStorage.removeItem("google_token_expires_at");
      setSheetsSyncMessage({ type: "success", text: "Връзката с Google Workspace бе прекъсната." });
    } catch (err: any) {
      console.error(err);
      setSheetsSyncMessage({ type: "error", text: `Прекъсването на връзката не бе успешно: ${err.message}` });
    }
  };

  const handleCreateSheet = async () => {
    if (!googleToken) {
      setSheetsSyncMessage({ type: "error", text: "Моля, свържете се с Google Workspace първо." });
      return;
    }
    setSheetsSyncLoading(true);
    setSheetsSyncMessage(null);
    try {
      const result = await createSourcingSpreadsheet(googleToken, products, offers);
      if (result.success && result.spreadsheetId) {
        setLinkedSheetId(result.spreadsheetId);
        setLinkedSheetUrl(result.spreadsheetUrl || null);
        setSheetsSyncMessage({ type: "success", text: "Успешно създадохте Google Sheet таблица и синхронизирахте данните!" });
      } else {
        throw new Error(result.error || "Failed to create spreadsheet");
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "";
      if (errMsg.includes("401") || errMsg.toLowerCase().includes("auth") || errMsg.toLowerCase().includes("credential")) {
        errMsg = "Грешка 401 (Невалидна/изтекла сесия в Google). Срокът на вашия Google OAuth токен е изтекъл. Моля, натиснете иконата 'Изход' (врата) долу вдясно, след което се впишете отново чрез 'Connect Google Workspace', за да подновите сесията си сигурно!";
      } else {
        errMsg = `Възникна грешка при създаване: ${err.message}`;
      }
      setSheetsSyncMessage({ type: "error", text: errMsg });
    } finally {
      setSheetsSyncLoading(false);
    }
  };

  const handleSyncSheet = async () => {
    if (!googleToken) {
      setSheetsSyncMessage({ type: "error", text: "Моля, първо се впишете в Google Workspace." });
      return;
    }
    if (!linkedSheetId) {
      setSheetsSyncMessage({ type: "error", text: "Няма свързана таблица. Първо създайте нова." });
      return;
    }
    setSheetsSyncLoading(true);
    setSheetsSyncMessage(null);
    try {
      const result = await syncSpreadsheetData(googleToken, linkedSheetId, products, offers);
      if (result.success) {
        setSheetsSyncMessage({ type: "success", text: "Синхронизацията бе успешна! Google Sheet таблицата бе актуализирана успешно!" });
      } else {
        throw new Error(result.error || "Failed to sync spreadsheet");
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "";
      if (errMsg.includes("401") || errMsg.toLowerCase().includes("auth") || errMsg.toLowerCase().includes("credential")) {
        errMsg = "Синхронизацията не бе успешна (Грешка 401 - Изтекъл или невалиден достъп). Google токенът ви е изтекъл (тези токени са валидни само 1 час за сигурност). Моля, излезте от Google профила (чрез иконата с изход/врата най-вдясно) и натиснете отново бутона за свързване с Google Workspace, след което натиснете 'Синхронизиране'.";
      } else {
        errMsg = `Синхронизацията не бе успешна: ${err.message}`;
      }
      setSheetsSyncMessage({ type: "error", text: errMsg });
    } finally {
      setSheetsSyncLoading(false);
    }
  };

  const handleImportFromSheet = async () => {
    if (!googleToken) {
      setSheetsSyncMessage({ type: "error", text: "Моля, първо се впишете в Google Workspace." });
      return;
    }
    if (!linkedSheetId) {
      setSheetsSyncMessage({ type: "error", text: "Няма свързана таблица. Първо създайте нова." });
      return;
    }
    setSheetsSyncLoading(true);
    setSheetsSyncMessage(null);
    try {
      const result = await importProductsFromSpreadsheet(googleToken, linkedSheetId);
      if (!result.success || !result.products) {
        throw new Error(result.error || "Грешка при извличане на данни от Google Sheet");
      }

      if (result.products.length === 0) {
        setSheetsSyncMessage({ type: "error", text: "Не бяха намерени продукти в колоните на Google Sheet ('B2B Product Catalog'). Моля, уверете се, че имате поне 1 ред с попълнени SKU и Име." });
        return;
      }

      const formattedForBackend = result.products.map(p => ({
        ...p,
        certifications: p.certifications.join(", ")
      }));

      const bulkRes = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: formattedForBackend })
      });

      if (bulkRes.ok) {
        const bulkData = await bulkRes.json();
        await fetchProducts();
        setSheetsSyncMessage({
          type: "success",
          text: `Успешен импорт! Продуктите от Google Sheet бяха заредени в ProcureOS. Общо прочетени: ${bulkData.totalCount}. Добавени: ${bulkData.insertedCount}. Обновени: ${bulkData.updatedCount}.`
        });
      } else {
        const errorData = await bulkRes.json();
        throw new Error(errorData.error || "Сървърът отхвърли импортирането");
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "";
      if (errMsg.includes("401") || errMsg.toLowerCase().includes("auth") || errMsg.toLowerCase().includes("credential")) {
        errMsg = "Синхронизацията не бе успешна (Грешка 401 - Изтекъл или невалиден достъп). Google токенът ви е изтекъл. Моля, излезте от Google профила (чрез иконата с изход/врата най-вдясно) и се впишете отново, за да продължите.";
      } else {
        errMsg = `Възникна грешка при импорт от таблицата: ${err.message}`;
      }
      setSheetsSyncMessage({ type: "error", text: errMsg });
    } finally {
      setSheetsSyncLoading(false);
    }
  };

  const handleUnlinkSheet = () => {
    localStorage.removeItem("procureos_linked_spreadsheet_id");
    localStorage.removeItem("procureos_linked_spreadsheet_url");
    setLinkedSheetId(null);
    setLinkedSheetUrl(null);
    setSheetsSyncMessage({ type: "success", text: "Google Sheet reference unlinked. You can now create or link a new one." });
  };

  useEffect(() => {
    if (googleToken && linkedSheetId && products.length > 0) {
      const syncTimeout = setTimeout(() => {
        syncSpreadsheetData(googleToken, linkedSheetId, products, offers)
          .then((res) => {
            if (res.success) {
              console.log("Auto-synced latest state to Google Sheets successfully!");
            }
          })
          .catch((err) => console.error("Auto-sync error:", err));
      }, 1500); // debounce sync to avoid spamming the Sheets API
      return () => clearTimeout(syncTimeout);
    }
  }, [products, offers, googleToken, linkedSheetId]);

  useEffect(() => {
    if (clientSession?.email === "kolev.tihomir@gmail.com" || clientSession?.isDeputyAdmin) {
      fetchRegisteredUsers();
    }
  }, [clientSession]);

  // Client Authentication Handlers
  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotification(null);
    if (!authName || !authEmail || !authPassword) {
      setAuthNotification({ type: "error", text: "Please fill out the three required fields: Name, Email, and Password." });
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          company: authCompany,
          phone: authPhone,
          password: authPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      
      setAuthNotification({
        type: "success",
        text: `Registration complete! Simulated Email: Your verification code has been dispatched.`,
        code: data.verificationCode
      });
      setAuthView("verify");
    } catch (err: any) {
      setAuthNotification({ type: "error", text: err.message });
    }
  };

  const handleClientVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotification(null);
    if (!authVerifyCode) {
      setAuthNotification({ type: "error", text: "Please enter the 6-digit verification code." });
      return;
    }
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, code: authVerifyCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      setClientSession(data.user);
      setAuthNotification({ type: "success", text: "Email verified successfully!" });
      if (data.user.isPaid) {
        setAuthView("login");
      } else {
        setAuthView("payment");
      }
    } catch (err: any) {
      setAuthNotification({ type: "error", text: err.message });
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotification(null);
    if (!authEmail || !authPassword) {
      setAuthNotification({ type: "error", text: "Please enter your email and password." });
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid login credentials");

      setClientSession(data.user);
      if (!data.user.isEmailVerified) {
        setAuthNotification({ type: "error", text: "Account is not verified. Please verify your email first." });
        setAuthView("verify");
      } else if (!data.user.isPaid) {
        setAuthView("payment");
      } else {
        setAuthNotification({ type: "success", text: "Login successful!" });
      }
    } catch (err: any) {
      setAuthNotification({ type: "error", text: err.message });
    }
  };

  const handleClientForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotification(null);
    if (!authEmail) {
      setAuthNotification({ type: "error", text: "Please enter your email address." });
      return;
    }
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");

      setAuthNotification({
        type: "success",
        text: "Simulated password recovery code generated successfully.",
        code: data.recoveryCode
      });
      setAuthView("reset");
    } catch (err: any) {
      setAuthNotification({ type: "error", text: err.message });
    }
  };

  const handleClientReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotification(null);
    if (!authVerifyCode || !authNewPassword) {
      setAuthNotification({ type: "error", text: "Please enter the recovery code and your new password." });
      return;
    }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, code: authVerifyCode, newPassword: authNewPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error resetting password");

      setAuthNotification({ type: "success", text: "Password changed successfully! You may now log in." });
      setAuthView("login");
    } catch (err: any) {
      setAuthNotification({ type: "error", text: err.message });
    }
  };



  const handleClientPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientSession) return;
    setPaymentLoading(true);
    setAuthNotification(null);

    // Simulate standard payment processing wait time
    setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: clientSession.email,
            planName: selectedPaymentPlan.name,
            amount: selectedPaymentPlan.price,
            cardLast4: paymentCardNumber.slice(-4) || "4242"
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Payment was declined");

        setClientSession(data.user);
        setAuthNotification({ type: "success", text: "Payment completed successfully! Welcome to ProcureOS." });
        
        // If Google Sheet auto-sync is configured, sync registered clients to Sheets right now too
        if (googleToken && linkedSheetId) {
          syncSpreadsheetData(googleToken, linkedSheetId, products, offers).catch(console.error);
        }
      } catch (err: any) {
        setAuthNotification({ type: "error", text: err.message });
      } finally {
        setPaymentLoading(false);
      }
    }, 1800);
  };

  const fetchRegisteredUsers = async () => {
    setAdminLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setRegisteredUsersList(data);
      }
    } catch (err) {
      console.error("Error fetching registered users:", err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleLogoutClient = () => {
    setClientSession(null);
    setAuthView("login");
    setAuthNotification({ type: "success", text: "Successfully logged out of your profile." });
  };

  const handleToggleUser = async (email: string, field: "isPaid" | "isEmailVerified" | "isDeputyAdmin") => {
    try {
      const res = await fetch("/api/admin/toggle-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, field })
      });
      if (res.ok) {
        // Reload registered users list
        fetchRegisteredUsers();
        // If changing own admin status, update local session too
        if (clientSession && clientSession.email === email) {
          const updatedRes = await fetch("/api/admin/users");
          if (updatedRes.ok) {
            const users = await updatedRes.json();
            const self = users.find((u: any) => u.email === email);
            if (self) setClientSession(self);
          }
        }
        // Auto-sync with sheets if active
        if (googleToken && linkedSheetId) {
          syncSpreadsheetData(googleToken, linkedSheetId, products, offers).catch(console.error);
        }
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  // Real Gemini-based Document OCR parsing from pasted text
  const handleOcrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocrText.trim()) return;

    setOcrLoading(true);
    setOcrResult(null);

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileText: ocrText,
          fileName: "custom_invoice_text.txt"
        })
      });

      if (res.ok) {
        const responseData = await res.json();
        setOcrResult(responseData.data);
      } else {
        alert("An error occurred while processing the text with Gemini AI.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to the OCR server.");
    } finally {
      setOcrLoading(false);
    }
  };

  // Import OCR product directly into Catalog
  const handleImportOcrToCatalog = async (item: OCRItem, vendor: string) => {
    const payload = {
      sku: item.sku,
      name: item.description,
      category: "Import",
      retailPrice: Number(item.unitPrice * 3),
      factoryPrice: Number(item.unitPrice),
      weightKg: 1.0,
      supplier: vendor,
      supplierTrust: 95,
      supplierYears: 3,
      certifications: ["CE", "ISO9001"],
      leadTimeDays: 20,
      description: `Automatically imported product via OCR invoice from ${vendor}.`
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setOcrImportedSkus(prev => {
          const next = new Set(prev);
          next.add(item.sku);
          return next;
        });
        await fetchProducts();
      } else {
        const errData = await res.json();
        alert("Import error: " + errData.error);
      }
    } catch (err) {
      console.error(err);
      alert("Connection to server failed.");
    }
  };

  // Preset OCR text loader for easy testing of real system
  const loadPresetOcr = (type: 1 | 2) => {
    if (type === 1) {
      setOcrText(`Yiwu Sourcing Alliance Co., Ltd.
INVOICE #PI-2026-8891
Date: 2026-06-25
To: European Retail Hub GMBH

Items:
1. SKU: FUR-ERGO-001 | Premium Ergonomic Office Chair | Qty: 150 pcs | Unit Price: 72.00 USD | Total: 10,800.00 USD
2. SKU: ELE-PWR-003 | Ultra-thin Power Bank 10000mAh | Qty: 500 pcs | Unit Price: 8.10 USD | Total: 4,050.00 USD

Subtotal: 14,850.00 USD
Estimated Sea Freight: 742.50 USD
Total Invoice Amount: 15,592.50 USD`);
    } else {
      setOcrText(`Zhejiang Bamboo Products Factory
PROFORMA INVOICE #PI-2026-4112
Date: 2026-06-28

Items:
1. SKU: ECO-TOOTH-002 | Eco-Friendly Bamboo Toothbrush Pack | Qty: 2000 pcs | Unit Price: 1.65 USD | Total: 3,300.00 USD
2. SKU: DEC-VASE-004 | Modern Minimalist Ceramic Vase | Qty: 120 pcs | Unit Price: 11.20 USD | Total: 1,344.00 USD

Subtotal: 4,644.00 USD
Freight cost: 320.00 USD
Grand Total: 4,964.00 USD`);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    window.open("/api/export", "_blank");
  };

  // Filtering products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = catalogCategoryFilter === "All" || p.category === catalogCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Paginated products to render in sidebar list
  const totalCatalogPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (catalogPage - 1) * itemsPerPage,
    catalogPage * itemsPerPage
  );

  // Calculations for Sourcing Calculator
  const factoryPrice = selectedProduct?.factoryPrice || 0;
  const freightFee = factoryPrice * 0.05;
  const insuranceFee = factoryPrice * 0.01;
  const customsFee = factoryPrice * 0.02;
  const handlingFee = 1.65;
  const landedCost = Number((factoryPrice + freightFee + insuranceFee + customsFee + handlingFee).toFixed(2));
  const calculatedRetailPrice = Number((landedCost / (1 - desiredMargin / 100)).toFixed(2));
  const profitPerUnit = Number((calculatedRetailPrice - landedCost).toFixed(2));
  const roi = Number(((profitPerUnit / landedCost) * 100).toFixed(1));

  const getTrialDaysRemaining = (regDate: string) => {
    if (!regDate) return 0;
    const diffTime = new Date().getTime() - new Date(regDate).getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const remaining = 7 - Math.floor(diffDays);
    return remaining > 0 ? remaining : 0;
  };

  const isUnlocked = clientSession && clientSession.isEmailVerified && (clientSession.isPaid || getTrialDaysRemaining(clientSession.regDate) > 0);

  if (!isUnlocked) {
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 lg:p-8 font-sans ${canvasPresets[canvasColor]} transition-colors duration-300`}>
        {/* Real-time Simulated Email Client & Notification HUD at the top */}
        {authNotification && authNotification.code && (
          <div className="max-w-md w-full mb-6 bg-slate-900 text-slate-100 rounded-xl p-4 border border-amber-500 shadow-xl relative overflow-hidden animate-pulse">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-extrabold uppercase tracking-widest text-amber-400">Simulation: Email Notification Dispatched</span>
                <p className="text-slate-300">
                  To: <strong className="text-white font-semibold">{authEmail}</strong>
                </p>
                <p className="text-slate-200">
                  {authView === "verify" 
                    ? `Your 6-digit profile verification code is: ` 
                    : `Your password recovery code is: `}
                  <strong className="text-white font-mono text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700 tracking-wider">
                    {authNotification.code}
                  </strong>
                </p>
                <p className="text-[10px] text-slate-400">
                  (In a live environment this is sent via SMTP/SendGrid. Displayed here for seamless testing.)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Outer card holding our forms */}
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden transition-all duration-300">
          
          {/* Brand header */}
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-2xl ${themePresets[themeColor].primaryBg} flex items-center justify-center shadow-lg shadow-slate-500/15 mb-3`}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Procure<span className={themePresets[themeColor].accentText}>OS</span> Gateway
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Professional B2B system for supplier management, real-time landed cost calculations, and margins.
            </p>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Native status notifications */}
            {authNotification && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                authNotification.type === "success" 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                {authNotification.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{authNotification.text}</span>
              </div>
            )}

            {/* 1. LOGIN VIEW */}
            {authView === "login" && (
              <form onSubmit={handleClientLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="client@test.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthNotification(null);
                        setAuthView("forgot");
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-lg text-white font-extrabold text-xs tracking-wide transition-all ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-200`}
                >
                  Sign In to System
                </button>

                <div className="pt-2.5 border-t border-slate-100 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Quick Demo Access</span>
                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthEmail("kolev.tihomir@gmail.com");
                        setAuthPassword("303094Thk@@@");
                        setAuthNotification({
                          type: "info",
                          text: "Administrator credentials loaded! Press 'Sign In' to enter."
                        });
                      }}
                      className="flex-1 py-1.5 px-2 text-[10px] font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
                    >
                      Admin (Tihomir)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthEmail("client@test.com");
                        setAuthPassword("client123");
                        setAuthNotification({
                          type: "info",
                          text: "Client credentials loaded! Press 'Sign In' to enter."
                        });
                      }}
                      className="flex-1 py-1.5 px-2 text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                    >
                      Client (Ivan)
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-400">Don't have a partner profile? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthNotification(null);
                      setAuthView("register");
                    }}
                    className={`text-xs font-bold text-slate-700 hover:text-slate-950 underline decoration-2 transition-colors`}
                  >
                    Register here
                  </button>
                </div>
              </form>
            )}

            {/* 2. REGISTER VIEW */}
            {authView === "register" && (
              <form onSubmit={handleClientRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="client@test.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Company Name</label>
                    <input
                      type="text"
                      placeholder="Petrov Imports Ltd"
                      value={authCompany}
                      onChange={(e) => setAuthCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+359 899 111 222"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Access Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-lg text-white font-extrabold text-xs tracking-wide transition-all ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-200`}
                >
                  Create Account & Continue
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthNotification(null);
                      setAuthView("login");
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors underline"
                  >
                    Already have an account? Sign in here
                  </button>
                </div>
              </form>
            )}

            {/* 3. VERIFY CODE VIEW */}
            {authView === "verify" && (
              <form onSubmit={handleClientVerify} className="space-y-4">
                <p className="text-xs text-slate-500 text-center">
                  Enter the 6-digit verification code sent to <strong className="text-slate-800">{authEmail}</strong>.
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block text-center">Security Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={authVerifyCode}
                    onChange={(e) => setAuthVerifyCode(e.target.value)}
                    className="w-full px-4 py-2 text-center font-mono text-lg tracking-widest bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-lg text-white font-extrabold text-xs tracking-wide transition-all ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-200`}
                >
                  Confirm Profile
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthNotification(null);
                      setAuthView("login");
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 4. FORGOT PASSWORD VIEW */}
            {authView === "forgot" && (
              <form onSubmit={handleClientForgot} className="space-y-4">
                <p className="text-xs text-slate-500 text-center">
                  Enter your email and we will send you a password recovery code.
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="client@test.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-lg text-white font-extrabold text-xs tracking-wide transition-all ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-200`}
                >
                  Send Recovery Code
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthNotification(null);
                      setAuthView("login");
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 5. RESET PASSWORD VIEW */}
            {authView === "reset" && (
              <form onSubmit={handleClientReset} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Security Code</label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={authVerifyCode}
                    onChange={(e) => setAuthVerifyCode(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-center tracking-widest bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={authNewPassword}
                    onChange={(e) => setAuthNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-lg text-white font-extrabold text-xs tracking-wide transition-all ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-200`}
                >
                  Save New Password
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthNotification(null);
                      setAuthView("login");
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors underline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* 6. STRIPE SUBSCRIPTION PAYMENT VIEW */}
            {authView === "payment" && (
              <form onSubmit={handleClientPay} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Select B2B License Plan</label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentPlan({ name: "B2B Essential Sourcing", price: 49 })}
                      className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                        selectedPaymentPlan.name === "B2B Essential Sourcing" 
                          ? `${themePresets[themeColor].border} bg-slate-50/50` 
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">B2B Essential</div>
                      <div className={`text-lg font-black mt-1 ${themePresets[themeColor].accentText}`}>€49 <span className="text-[10px] text-slate-400 font-medium">/ mo</span></div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">Catalog, calculator, and PDF invoice OCR.</p>
                      {selectedPaymentPlan.name === "B2B Essential Sourcing" && (
                        <span className={`absolute top-2 right-2 w-3 h-3 rounded-full ${themePresets[themeColor].primaryBg} flex items-center justify-center`}>
                          <Check className="w-2 h-2 text-white" />
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentPlan({ name: "Enterprise Freight Logistics Hub", price: 149 })}
                      className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                        selectedPaymentPlan.name === "Enterprise Freight Logistics Hub" 
                          ? `${themePresets[themeColor].border} bg-slate-50/50` 
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">Enterprise Logistics</div>
                      <div className={`text-lg font-black mt-1 ${themePresets[themeColor].accentText}`}>€149 <span className="text-[10px] text-slate-400 font-medium">/ mo</span></div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">Full Google Sheets sync, active AI negotiation engine.</p>
                      {selectedPaymentPlan.name === "Enterprise Freight Logistics Hub" && (
                        <span className={`absolute top-2 right-2 w-3 h-3 rounded-full ${themePresets[themeColor].primaryBg} flex items-center justify-center`}>
                          <Check className="w-2 h-2 text-white" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Animated Stripe-like Card visualizer */}
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono shadow-lg relative overflow-hidden space-y-4">
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-slate-800 to-slate-950 rounded-full blur-xl opacity-80 pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Stripe Secure Card</span>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm tracking-widest text-slate-200">
                      {paymentCardNumber ? paymentCardNumber.replace(/(\d{4})/g, "$1 ").trim() : "•••• •••• •••• ••••"}
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <div>
                        <div className="text-slate-500 text-[8px] uppercase">Cardholder</div>
                        <div className="text-slate-300 uppercase">{paymentCardName || "CARDHOLDER NAME"}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[8px] uppercase">Expires</div>
                        <div className="text-slate-300">{paymentCardExpiry || "MM/YY"}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[8px] uppercase">CVC</div>
                        <div className="text-slate-300">{paymentCardCvc || "•••"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inputs for Card checkout form */}
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Name on Card</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={paymentCardName}
                      onChange={(e) => setPaymentCardName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Credit Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="4242424242424242"
                      value={paymentCardNumber}
                      onChange={(e) => setPaymentCardNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="12/28"
                        value={paymentCardExpiry}
                        onChange={(e) => setPaymentCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">CVC Code</label>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        placeholder="123"
                        value={paymentCardCvc}
                        onChange={(e) => setPaymentCardCvc(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={paymentLoading}
                  className={`w-full py-3 rounded-lg text-white font-extrabold text-xs tracking-wide transition-all ${
                    paymentLoading ? "bg-slate-400 cursor-not-allowed" : `${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} cursor-pointer hover:shadow-md`
                  } flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-200`}
                >
                  {paymentLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing transaction via Stripe Secure...
                    </>
                  ) : (
                    `Activate License for €${selectedPaymentPlan.price} / month`
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setClientSession(null);
                      setAuthView("login");
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    Sign Out & Start Over
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

        {/* Demo Account quick hint card */}
        <div className="mt-6 max-w-sm text-center space-y-2">
          <p className="text-[10px] text-slate-400 leading-normal">
            💡 <strong className="text-slate-500">Quick Test:</strong> You can sign in directly using the administrator credentials:
            <br />
            Email: <span className="font-mono text-slate-500">kolev.tihomir@gmail.com</span> • Password: <span className="font-mono text-slate-500">303094Thk@@@</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${canvasPresets[canvasColor]} text-slate-800 flex flex-col font-sans transition-colors duration-300`}>
      
      {/* Elegantly Styled Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${themePresets[themeColor].primaryBg} flex items-center justify-center shadow-md shadow-slate-500/10`}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">Procure<span className={themePresets[themeColor].accentText}>OS</span></span>
                <span className={`text-[10px] font-bold ${themePresets[themeColor].badge} border px-2 py-0.5 rounded-full uppercase`}>
                  Real B2B System
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Automated Landed Cost Calculator • Live Supplier Negotiations • AI Invoice OCR</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Color Palette Switcher */}
            <div className="flex flex-col justify-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg p-1.5">
              {/* Row 1: Accent Theme Color */}
              <div className="flex items-center gap-1.5 justify-between">
                <Palette className="w-3 h-3 text-slate-400" title="Accent Color" />
                <div className="flex gap-1">
                  {(Object.keys(themePresets) as Array<keyof typeof themePresets>).map((color) => {
                    const colorMap = {
                      teal: "bg-teal-500",
                      indigo: "bg-indigo-500",
                      emerald: "bg-emerald-500",
                      rose: "bg-rose-500",
                      amber: "bg-amber-500",
                      violet: "bg-violet-500",
                      slate: "bg-slate-500"
                    };
                    return (
                      <button
                        key={color}
                        onClick={() => setThemeColor(color)}
                        title={`Accent: ${color}`}
                        className={`w-3 h-3 rounded-full ${colorMap[color]} transition-transform duration-150 cursor-pointer ${
                          themeColor === color ? "ring-1.5 ring-slate-800 ring-offset-0.5 scale-110" : "hover:scale-105"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Canvas & Interface Background Color */}
              <div className="flex items-center gap-1.5 justify-between border-t border-slate-250 pt-1">
                <LayoutGrid className="w-3 h-3 text-slate-400" title="Canvas & Interface Color" />
                <div className="flex gap-1">
                  {(Object.keys(themePresets) as Array<keyof typeof themePresets>).map((color) => {
                    const colorMap = {
                      teal: "bg-teal-500",
                      indigo: "bg-indigo-500",
                      emerald: "bg-emerald-500",
                      rose: "bg-rose-500",
                      amber: "bg-amber-500",
                      violet: "bg-violet-500",
                      slate: "bg-slate-500"
                    };
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setCanvasColor(color);
                          setThemeColor(color);
                        }}
                        title={`Change Entire Interface: ${color}`}
                        className={`w-3 h-3 rounded-full ${colorMap[color]} transition-transform duration-150 cursor-pointer ${
                          canvasColor === color ? "ring-1.5 ring-slate-800 ring-offset-0.5 scale-110" : "hover:scale-105"
                        }`}
                      />
                    );
                  })}
                  <button
                    onClick={() => {
                      setCanvasColor("default");
                      setThemeColor("teal");
                    }}
                    title="Default Canvas & Accent (Slate & Teal)"
                    className={`w-3 h-3 rounded-full bg-slate-300 border border-slate-400/85 transition-transform duration-150 cursor-pointer ${
                      canvasColor === "default" ? "ring-1.5 ring-slate-800 ring-offset-0.5 scale-110" : "hover:scale-105"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 1-Click Language Switcher (BG/EN Toggles) */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1.5 shadow-inner">
              <button
                onClick={() => handleLanguageToggle("bg")}
                className={`px-2 py-1 rounded text-[11px] font-black tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                  currentLang === "bg" || (currentLang === "auto" && document.cookie.includes("googtrans=/en/bg"))
                    ? "bg-white text-slate-900 shadow-sm border border-slate-250"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Превод на Български"
              >
                🇧🇬 BG
              </button>
              <button
                onClick={() => handleLanguageToggle("en")}
                className={`px-2 py-1 rounded text-[11px] font-black tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                  currentLang === "en" || (currentLang === "auto" && document.cookie.includes("googtrans=/en/en"))
                    ? "bg-white text-slate-900 shadow-sm border border-slate-250"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Switch to English"
              >
                🇬🇧 EN
              </button>
            </div>

            {/* Google Translate Integration widget container */}
            <div id="google_translate_element" className="bg-slate-100 border border-slate-200 rounded px-2 h-9 flex items-center shadow-inner" />

            <div className="hidden md:flex items-center gap-4 border-l border-slate-200 pl-4 text-slate-500">
              <div className="flex flex-col text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">System Status</span>
                <span className="font-semibold text-emerald-600 flex items-center justify-end gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Contract Volume</span>
                <span className="font-semibold text-slate-900">
                  ${offers.filter(o => o.status === "accepted").reduce((acc, o) => acc + o.proposedPrice, 0).toLocaleString()} USD
                </span>
              </div>
            </div>

            {clientSession && (
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-700 border border-slate-200">
                  {clientSession.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                    {clientSession.name}
                    {!clientSession.isPaid && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                        {getTrialDaysRemaining(clientSession.regDate)} Days Left
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{clientSession.company || "Personal Profile"}</span>
                </div>
                <button
                  onClick={handleLogoutClient}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-all cursor-pointer"
                  title="Sign out of profile"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">

        {/* Google Sheets Live Synchronization Hub */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg ${themePresets[themeColor].lightBg} ${themePresets[themeColor].accentText}`}>
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Google Sheets Live Integration Hub
                  {googleUser && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      CONNECTED
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorize and synchronize your B2B Product Catalog, Negotiation Ledger, suppliers, and simulated profit margins directly into Google Workspace.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 md:self-center">
              {!googleUser ? (
                <button
                  onClick={handleGoogleLogin}
                  className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500/10`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Connect Google Workspace
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {linkedSheetId ? (
                    <>
                      <a
                        href={linkedSheetUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Open Google Sheet
                        <ArrowUpRight className="w-3 h-3" />
                      </a>

                      <button
                        onClick={handleSyncSheet}
                        disabled={sheetsSyncLoading}
                        className={`flex items-center gap-1.5 px-3 py-2 ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {sheetsSyncLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        Sync Latest Data
                      </button>

                      <button
                        onClick={handleImportFromSheet}
                        disabled={sheetsSyncLoading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Import products from 'B2B Product Catalog' sheet back to system"
                      >
                        {sheetsSyncLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        Импортиране от Sheet
                      </button>

                      <button
                        onClick={handleUnlinkSheet}
                        className={`px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer`}
                        title="Unlink current sheet reference"
                      >
                        Unlink Sheet
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCreateSheet}
                      disabled={sheetsSyncLoading}
                      className={`flex items-center gap-1.5 px-4 py-2 ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60`}
                    >
                      {sheetsSyncLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Create ProcureOS Sheet
                    </button>
                  )}

                  <button
                    onClick={handleGoogleLogout}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Disconnect Google Account"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sync notification message */}
          {sheetsSyncMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={`text-xs px-3.5 py-2.5 rounded-lg border flex items-center gap-2 ${
                sheetsSyncMessage.type === "success"
                  ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                  : "bg-rose-50/50 border-rose-100 text-rose-800"
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{sheetsSyncMessage.text}</span>
            </motion.div>
          )}

          {googleUser && linkedSheetId && (
            <div className="bg-slate-50/60 border border-slate-150 rounded-lg px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">Linked Account:</span>
                <span className="font-mono">{googleUser.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">Spreadsheet ID:</span>
                <span className="font-mono truncate max-w-[200px] sm:max-w-xs">{linkedSheetId}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="font-semibold text-emerald-600">Active Real-Time Auto-Sync</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Simple & Clean Navigation Tabs */}
        <div className="bg-white border border-slate-200 p-1.5 rounded-xl flex flex-wrap gap-1 shadow-sm">
          <button 
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "catalog" 
                ? themePresets[themeColor].activeTab
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Compass className="w-4 h-4" />
            Products & Sourcing Calculator
          </button>

          <button 
            onClick={() => setActiveTab("negotiation")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
              activeTab === "negotiation" 
                ? themePresets[themeColor].activeTab
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Mail className="w-4 h-4" />
            Negotiations & CRM Lounge
            {offers.filter(o => o.status === "pending").length > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                {offers.filter(o => o.status === "pending").length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("ocr")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "ocr" 
                ? themePresets[themeColor].activeTab
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <FileText className="w-4 h-4" />
            AI Invoice OCR Reader
          </button>

          <button 
            onClick={() => setActiveTab("global-search")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "global-search" 
                ? themePresets[themeColor].activeTab
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Globe className="w-4 h-4" />
            Global Supplier Search (AI)
          </button>

          {(clientSession?.email === "kolev.tihomir@gmail.com" || clientSession?.isDeputyAdmin) && (
            <button 
              onClick={() => {
                setActiveTab("admin-audit");
                fetchRegisteredUsers();
                fetchGatewayConfig();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "admin-audit" 
                  ? "bg-rose-50 border border-rose-200 text-rose-800 font-bold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              Client Audit & Payments ({clientSession?.isDeputyAdmin ? "Deputy Admin" : "Admin"})
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="relative">
          <AnimatePresence mode="wait">
            
            {/* Catalog tab */}
            {activeTab === "catalog" && (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Sourcing Platform Banner & View Toggle */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        🛍️ GLOBAL B2B PORTAL
                      </span>
                      {linkedSheetId && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                            <FileSpreadsheet className="w-3 h-3" />
                            Свързана таблица
                          </span>
                          <button
                            onClick={handleImportFromSheet}
                            disabled={sheetsSyncLoading}
                            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-bold transition-all cursor-pointer disabled:opacity-60"
                            title="Синхронизиране/Импортиране на цени от таблицата"
                          >
                            {sheetsSyncLoading ? (
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <Upload className="w-2.5 h-2.5" />
                            )}
                            Импорт на цени
                          </button>
                        </div>
                      )}
                    </div>
                    <h1 className="text-base md:text-lg font-black text-slate-800 mt-1.5">
                      ProcureOS Sourcing Marketplace
                    </h1>
                    <p className="text-xs text-slate-500">
                      Direct wholesale sourcing, price calculation, and real-time AI negotiation with global manufacturers.
                    </p>
                  </div>

                  {/* Mode Switcher Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg p-1 self-start md:self-auto">
                    <button
                      onClick={() => setCatalogViewMode("grid")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        catalogViewMode === "grid"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-black"
                          : "text-slate-500 hover:text-slate-850"
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                      Alibaba Showcase 🛍️
                    </button>
                    <button
                      onClick={() => setCatalogViewMode("split")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        catalogViewMode === "split"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-black"
                          : "text-slate-500 hover:text-slate-850"
                      }`}
                    >
                      <Server className="w-3.5 h-3.5 text-slate-600" />
                      Split Sourcing ⚙️
                    </button>
                  </div>
                </div>

                {/* Category Filter Chips (Scrollable) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
                  {[
                    { id: "All", label: "Всички категории 🌐" },
                    { id: "Electronics", label: "Електроника 🔌" },
                    { id: "Furniture", label: "Мебели 🛋️" },
                    { id: "Cosmetics", label: "Козметика 💄" },
                    { id: "Decor", label: "Декор 🏺" },
                    { id: "Kitchenware", label: "Кухня 🍳" },
                    { id: "Sports & Outdoors", label: "Спорт и аутдор ⚽" },
                    { id: "Apparel", label: "Облекло 👕" },
                    { id: "Office Supplies", label: "Офис консумативи 📝" },
                    { id: "Automotive", label: "Автоаксесоари 🚗" },
                    { id: "Toys & Games", label: "Играчки 🧸" },
                  ].map((cat) => {
                    const isSelected = catalogCategoryFilter === cat.id;
                    const count = cat.id === "All" 
                      ? products.length 
                      : products.filter(p => p.category === cat.id).length;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCatalogCategoryFilter(cat.id);
                          setCatalogPage(1);
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                          isSelected
                            ? `${themePresets[themeColor].primaryBg} border-transparent text-white font-bold`
                            : "bg-white border-slate-200 hover:border-slate-350 text-slate-600"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            isSelected ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar for general use */}
                <div className="relative max-w-md text-left">
                  <input 
                    type="text" 
                    placeholder="Search 20,000+ wholesale items by SKU, name or details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none ${themePresets[themeColor].borderFocus}`}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
                </div>

                {catalogViewMode === "grid" ? (
                  // BEAUTIFUL ALIBABA / SHEIN PRODUCT GRID VIEW
                  <div className="space-y-6">
                    {/* Grid Stats / Sourcing Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Общо артикули</span>
                        <span className="text-xl font-black text-slate-800">{filteredProducts.length}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">В каталога на ProcureOS</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Фабрична цена (Средно)</span>
                        <span className="text-xl font-black text-slate-800">
                          ${filteredProducts.length > 0 
                            ? (filteredProducts.reduce((acc, p) => acc + p.factoryPrice, 0) / filteredProducts.length).toFixed(2)
                            : "0.00"
                          }
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Директни доставчици</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Сертифицирани партньори</span>
                        <span className="text-xl font-black text-emerald-600">100%</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">ISO, CE, FDA, FCC одобрени</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Двустранен Синк</span>
                        <span className="text-xl font-black text-indigo-600 flex items-center gap-1">
                          Активен <Sparkles className="w-4 h-4 animate-pulse text-indigo-500" />
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Чрез Google Sheets API</span>
                      </div>
                    </div>

                    {/* Main Grid Content */}
                    {loading ? (
                      <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <RefreshCw className={`w-8 h-8 animate-spin mx-auto mb-3 ${themePresets[themeColor].accentText}`} />
                        <p className="text-sm font-semibold text-slate-600">Зареждане на каталога...</p>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                        <p className="text-base font-bold text-slate-700">Няма намерени артикули</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Няма намерени продукти за избраната категория или критерии за търсене. Опитайте да изчистите филтрите или да импортирате нови от свързаната Google Sheet таблица!
                        </p>
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setCatalogCategoryFilter("All");
                          }}
                          className={`px-4 py-2 text-xs font-bold text-white rounded-lg ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} cursor-pointer transition-all shadow-sm`}
                        >
                          Изчисти филтри
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedProducts.map((product) => {
                          const productLanded = product.landedCost || Number((product.factoryPrice * 1.08 + 1.65).toFixed(2));
                          const imageUrl = getProductImage(product.sku, product.category, product.name);

                          return (
                            <motion.div
                              key={product.sku}
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
                              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col text-left group transition-all"
                            >
                              {/* Product Image Stage */}
                              <div className="relative aspect-square w-full bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center">
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  referrerPolicy="no-referrer"
                                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                />
                                {/* Overlay badges */}
                                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded shadow-xs ${themePresets[themeColor].badge}`}>
                                    {product.sku}
                                  </span>
                                  <span className="text-[9px] font-bold bg-slate-900/85 text-white px-2 py-0.5 rounded shadow-xs backdrop-blur-xs">
                                    {product.category}
                                  </span>
                                </div>

                                <div className="absolute bottom-2.5 right-2.5">
                                  <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-1 rounded-lg shadow-sm flex items-center gap-0.5">
                                    ⭐ {product.supplierTrust}% Trust
                                  </span>
                                </div>
                              </div>

                              {/* Card Content */}
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[32px] group-hover:text-indigo-600 transition-colors">
                                    {product.name}
                                  </h4>
                                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {product.description || "Без допълнително описание."}
                                  </p>
                                </div>

                                {/* Pricing Metrics (Alibaba style) */}
                                <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs border border-slate-100">
                                  <div>
                                    <span className="text-[9px] text-slate-400 block font-semibold">Wholesale:</span>
                                    <span className={`text-sm font-black ${themePresets[themeColor].accentText}`}>
                                      ${product.factoryPrice.toFixed(2)}
                                    </span>
                                    <span className="text-[8px] text-slate-400 block">FOB Factory</span>
                                  </div>
                                  <div className="border-l border-slate-200 pl-2.5">
                                    <span className="text-[9px] text-slate-400 block font-semibold">Landed Cost:</span>
                                    <span className="text-sm font-black text-emerald-600">
                                      ${productLanded.toFixed(2)}
                                    </span>
                                    <span className="text-[8px] text-slate-400 block">DDP Port</span>
                                  </div>
                                </div>

                                {/* Factory specifications */}
                                <div className="text-[10px] text-slate-500 space-y-0.5 border-t border-slate-100 pt-2.5">
                                  <div className="flex justify-between">
                                    <span>Доставчик:</span>
                                    <span className="font-bold text-slate-700 truncate max-w-[120px]">
                                      {maskSupplierInfo ? `Verified Partner` : product.supplier}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Срок изработка:</span>
                                    <span className="font-bold text-slate-700">{product.leadTimeDays} дни</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Сертификати:</span>
                                    <span className="font-bold text-indigo-600 truncate max-w-[100px]">
                                      {Array.isArray(product.certifications) 
                                        ? product.certifications.join(", ") 
                                        : String(product.certifications)
                                      }
                                    </span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                  <button
                                    onClick={() => {
                                      setGridSelectedProduct(product);
                                      setSelectedProduct(product); // sync split view selection too
                                      setShowGridProductDetailModal(true);
                                    }}
                                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center"
                                  >
                                    Детайли
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      setActiveTab("negotiation");
                                    }}
                                    className={`px-2 py-1.5 bg-gradient-to-r ${themePresets[themeColor].primaryBg} to-indigo-600 hover:opacity-95 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1`}
                                  >
                                    Преговаряй 💬
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {/* Grid Pagination */}
                    {filteredProducts.length > itemsPerPage && (
                      <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-xs">
                        <button
                          onClick={() => setCatalogPage(prev => Math.max(1, prev - 1))}
                          disabled={catalogPage === 1}
                          className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-all font-semibold shadow-2xs cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="text-slate-500 font-medium">
                          Page <strong>{catalogPage}</strong> of <strong>{totalCatalogPages}</strong> ({filteredProducts.length} items)
                        </span>
                        <button
                          onClick={() => setCatalogPage(prev => Math.min(totalCatalogPages, prev + 1))}
                          disabled={catalogPage === totalCatalogPages}
                          className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-all font-semibold shadow-2xs cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // STANDARD SPLIT-SCREEN ADMIN / MANAGEMENT VIEW
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left side: List with Create/Delete actions */}
                    <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-left">
                      <div className="flex justify-between items-center gap-2 flex-wrap">
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Product List</h2>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => {
                              setBulkCsvText("");
                              setBulkUploadResult(null);
                              setShowBulkUploadModal(true);
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded shadow-2xs transition-colors cursor-pointer border border-slate-250"
                            title="Bulk Upload CSV"
                          >
                            <Upload className="w-3 h-3" />
                            Bulk
                          </button>
                          <button 
                            onClick={startAddProduct}
                            className={`flex items-center gap-1 px-2 py-1 ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} text-white font-bold text-[10px] rounded shadow-2xs transition-colors cursor-pointer`}
                          >
                            <Plus className="w-3 h-3" />
                            New
                          </button>
                        </div>
                      </div>

                      {/* Scrollable list */}
                      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                        {loading ? (
                          <div className="text-center py-12 text-slate-400">
                            <RefreshCw className={`w-6 h-6 animate-spin mx-auto mb-2 ${themePresets[themeColor].accentText}`} />
                            Loading catalog...
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                            No products found. Add a new one!
                          </div>
                        ) : (
                          paginatedProducts.map((product) => {
                            const isSelected = selectedProduct?.sku === product.sku;
                            const productLanded = product.landedCost || Number((product.factoryPrice * 1.08 + 1.65).toFixed(2));
                            const currentMargin = Math.round(((product.retailPrice - productLanded) / product.retailPrice) * 100);

                            return (
                              <div 
                                key={product.sku}
                                onClick={() => setSelectedProduct(product)}
                                className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                                  isSelected 
                                    ? `${themePresets[themeColor].lightBg} ${themePresets[themeColor].border} shadow-sm` 
                                    : "bg-white border-slate-200 hover:bg-slate-50/80"
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <span className={`text-[9px] font-mono border px-2 py-0.5 rounded font-bold ${themePresets[themeColor].badge}`}>{product.sku}</span>
                                  <div className="flex gap-1.5">
                                    <button 
                                      onClick={(e) => startEditProduct(product, e)}
                                      className={`text-slate-400 hover:${themePresets[themeColor].accentText} p-0.5 rounded transition-colors`}
                                      title="Edit"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={(e) => handleDeleteProduct(product.sku, e)}
                                      className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <h3 className="text-xs font-bold text-slate-800 mt-2 line-clamp-1">{product.name}</h3>
                                <div className="mt-3 grid grid-cols-3 gap-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                                  <div>
                                    Factory: <span className="text-slate-700 font-bold block">${product.factoryPrice}</span>
                                  </div>
                                  <div>
                                    Landed: <span className="text-emerald-600 font-bold block">${productLanded}</span>
                                  </div>
                                  <div>
                                    Margin: <span className="text-indigo-600 font-bold block">{currentMargin}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Pagination Controls */}
                      {filteredProducts.length > itemsPerPage && (
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                          <button
                            onClick={() => setCatalogPage(prev => Math.max(1, prev - 1))}
                            disabled={catalogPage === 1}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 transition-all font-semibold"
                          >
                            Previous
                          </button>
                          <span className="text-slate-500 font-medium">
                            Page <strong>{catalogPage}</strong> of <strong>{totalCatalogPages}</strong>
                          </span>
                          <button
                            onClick={() => setCatalogPage(prev => Math.min(totalCatalogPages, prev + 1))}
                            disabled={catalogPage === totalCatalogPages}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 transition-all font-semibold"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right side: Landed cost calculator & Margin Simulator */}
                    <div className="lg:col-span-8 space-y-6">
                      {selectedProduct ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 text-left">
                          
                          {/* Product Header */}
                          <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono border font-bold px-2.5 py-0.5 rounded-full ${themePresets[themeColor].badge}`}>
                                  {selectedProduct.sku}
                                </span>
                                <span className="text-xs text-slate-400 font-semibold">Category: {selectedProduct.category}</span>
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 mt-1.5">{selectedProduct.name}</h3>
                              <p className="text-xs text-slate-500 mt-1">{selectedProduct.description || "No description available."}</p>
                            </div>

                            {/* Supplier Box */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right min-w-[200px]">
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manufacturer Factory</div>
                              <div className="text-xs font-bold text-slate-800 mt-0.5">
                                {maskSupplierInfo ? `Verified Factory Partner (SKU: ${selectedProduct.sku.slice(0, 5)})` : selectedProduct.supplier}
                              </div>
                              <div className="flex items-center justify-end gap-1.5 mt-2">
                                <span className="text-[11px] font-mono font-bold text-emerald-600">
                                  Trust Score: {selectedProduct.supplierTrust}/100
                                </span>
                                <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selectedProduct.supplierTrust}%` }} />
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-200/60 pt-1.5">
                                {selectedProduct.supplierYears} yrs exp • Lead Time: {selectedProduct.leadTimeDays} days
                              </div>
                            </div>
                          </div>

                          {/* Calculations Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Landed cost block */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <RefreshCw className={`w-4 h-4 ${themePresets[themeColor].accentText}`} />
                                Landed Cost Calculation
                              </h4>
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                                <div className="flex justify-between text-slate-600">
                                  <span>Base Factory Price:</span>
                                  <span className="font-bold text-slate-800">${factoryPrice.toFixed(2)} USD</span>
                                </div>

                                <div className={`space-y-1.5 pl-3.5 border-l-2 ${themePresets[themeColor].border.replace('border-', 'border-l-')} text-slate-500`}>
                                  <div className="flex justify-between">
                                    <span>Sea / Air Freight (5%):</span>
                                    <span>+${freightFee.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Transit Insurance (1%):</span>
                                    <span>+${insuranceFee.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Custom Duties & VAT (2%):</span>
                                    <span>+${customsFee.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Local Handling Port Fee:</span>
                                    <span>+${handlingFee.toFixed(2)}</span>
                                  </div>
                                </div>

                                <div className="border-t border-slate-200 pt-2.5 flex justify-between text-sm font-bold text-slate-800">
                                  <span>Final Landed Cost:</span>
                                  <span className="text-emerald-600">${landedCost} USD</span>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-normal">
                                💡 The calculator automatically computes shipping, insurance, and custom duties based on standard real-world import matrices.
                              </p>
                            </div>

                            {/* Margin Simulator block */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <LineChart className="w-4 h-4 text-indigo-600" />
                                Retail Profit Margin Simulator
                              </h4>
                              
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 text-xs">
                                <div>
                                  <div className="flex justify-between text-slate-600 font-bold mb-1">
                                    <span>Desired Net Margin:</span>
                                    <span className="text-indigo-600">{desiredMargin}%</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="10" 
                                    max="85" 
                                    value={desiredMargin}
                                    onChange={(e) => setDesiredMargin(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    style={{ accentColor: themePresets[themeColor].accentText }}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                                  <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                                    <span className="text-[10px] text-slate-400 block font-bold">Suggested B2C Price:</span>
                                    <span className="text-sm font-black text-slate-800">${calculatedRetailPrice}</span>
                                    <span className="text-[9px] text-slate-400 block mt-0.5">Market Retail: ${selectedProduct.retailPrice}</span>
                                  </div>
                                  <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                                    <span className="text-[10px] text-slate-400 block font-bold">Net Profit per Unit:</span>
                                    <span className={`text-sm font-black ${themePresets[themeColor].accentText}`}>${profitPerUnit}</span>
                                    <span className="text-[9px] text-emerald-500 block mt-0.5">ROI Return: {roi}%</span>
                                  </div>
                                </div>

                                <button 
                                  onClick={() => {
                                    setActiveTab("negotiation");
                                  }}
                                  className={`w-full py-2.5 px-4 bg-gradient-to-r ${themePresets[themeColor].primaryBg} to-indigo-600 hover:opacity-95 text-white font-bold rounded-lg text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5`}
                                >
                                  <span>Negotiate Production Batch</span>
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-16 text-center text-slate-400">
                          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-base text-slate-600 font-semibold">No Product Selected</p>
                          <p className="text-xs text-slate-400 mt-1">Select a product from the list on the left to activate the sourcing calculations.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* GRID DETAIL MODAL */}
                {showGridProductDetailModal && gridSelectedProduct && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-left max-h-[90vh]"
                    >
                      {/* Left: Beautiful Product Image Stage */}
                      <div className="md:w-1/2 bg-slate-50 relative flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-100">
                        <img
                          src={getProductImage(gridSelectedProduct.sku, gridSelectedProduct.category, gridSelectedProduct.name)}
                          alt={gridSelectedProduct.name}
                          referrerPolicy="no-referrer"
                          className="object-contain max-h-[400px] w-full rounded-xl"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className={`text-[10px] font-black tracking-wider px-3 py-1 rounded-full shadow-xs uppercase ${themePresets[themeColor].badge}`}>
                            {gridSelectedProduct.sku}
                          </span>
                          <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full shadow-xs uppercase">
                            {gridSelectedProduct.category}
                          </span>
                        </div>
                      </div>

                      {/* Right: Detailed Wholesale information */}
                      <div className="md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between space-y-6">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
                              {gridSelectedProduct.name}
                            </h3>
                            <button
                              onClick={() => setShowGridProductDetailModal(false)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            {gridSelectedProduct.description || "No description provided for this premium commercial commodity."}
                          </p>

                          {/* Price Tier matrix */}
                          <div className="mt-5 space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Wholesale Price Tiers (FOB Factory)</h4>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                                <span className="text-[9px] text-slate-400 font-bold block">10 - 99 units</span>
                                <span className="font-extrabold text-slate-700">${(gridSelectedProduct.factoryPrice * 1.05).toFixed(2)}</span>
                              </div>
                              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5">
                                <span className="text-[9px] text-indigo-500 font-bold block">100 - 999 units</span>
                                <span className="font-extrabold text-indigo-700">${gridSelectedProduct.factoryPrice.toFixed(2)}</span>
                              </div>
                              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2.5">
                                <span className="text-[9px] text-emerald-600 font-bold block font-black">1000+ units</span>
                                <span className="font-extrabold text-emerald-700">${(gridSelectedProduct.factoryPrice * 0.95).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Logistics, Landed Costs, and Custom Margins */}
                          <div className="mt-5 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estimated Import Logistics & Landed Cost</h4>
                            <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
                              <div className="flex justify-between">
                                <span>FOB Base Factory Price:</span>
                                <span className="font-bold text-slate-800">${gridSelectedProduct.factoryPrice.toFixed(2)} USD</span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-500 pl-3 border-l border-slate-300">
                                <span>Freight & Sea Logistics (5%):</span>
                                <span>+${(gridSelectedProduct.factoryPrice * 0.05).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-500 pl-3 border-l border-slate-300">
                                <span>Transit Port Customs & Duties (2%):</span>
                                <span>+${(gridSelectedProduct.factoryPrice * 0.02).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-500 pl-3 border-l border-slate-300">
                                <span>Local Port Handling Fee (Flat):</span>
                                <span>+$1.65</span>
                              </div>
                              <div className="border-t border-slate-200/80 pt-2 flex justify-between font-bold text-slate-800">
                                <span>Final Landed Cost (DDP Port):</span>
                                <span className="text-emerald-600">${(gridSelectedProduct.factoryPrice * 1.08 + 1.65).toFixed(2)} USD</span>
                              </div>
                            </div>
                          </div>

                          {/* Manufacturer Profile */}
                          <div className="mt-5 space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Verified Manufacturer Profile</h4>
                            <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex justify-between items-center text-xs">
                              <div className="text-left">
                                <p className="font-bold text-slate-800 truncate max-w-[200px]">
                                  {maskSupplierInfo ? "Verified Sourcing Factory Partner" : gridSelectedProduct.supplier}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{gridSelectedProduct.supplierYears} years verified supplier</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                  ⭐ {gridSelectedProduct.supplierTrust}% Trust
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CTA actions */}
                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setShowGridProductDetailModal(false);
                            }}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
                          >
                            Затвори
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(gridSelectedProduct);
                              setShowGridProductDetailModal(false);
                              setActiveTab("negotiation");
                            }}
                            className={`flex-1 py-2.5 bg-gradient-to-r ${themePresets[themeColor].primaryBg} to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1`}
                          >
                            Преговаряй за цена 💬
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Negotiation CRM Tab */}
            {activeTab === "negotiation" && (
              <motion.div
                key="negotiation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 xl:grid-cols-12 gap-6"
              >
                {/* Submit Offer Form */}
                <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-left space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Send className={`w-4.5 h-4.5 ${themePresets[themeColor].accentText}`} />
                    Send Custom Offer to Factory
                  </h3>

                  <form onSubmit={handleQuickOfferSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Select Product</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="🔍 Type SKU or name to search 20,000+ items..."
                          value={quickOfferSearch}
                          onChange={(e) => setQuickOfferSearch(e.target.value)}
                          className={`w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none ${themePresets[themeColor].borderFocus}`}
                        />
                        <select 
                          value={selectedProduct?.sku || ""}
                          onChange={(e) => {
                            const prod = products.find(p => p.sku === e.target.value);
                            if (prod) setSelectedProduct(prod);
                          }}
                          className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none ${themePresets[themeColor].borderFocus}`}
                          required
                        >
                          <option value="" disabled>-- Choose from Catalog --</option>
                          {products
                            .filter(p => 
                              p.name.toLowerCase().includes(quickOfferSearch.toLowerCase()) ||
                              p.sku.toLowerCase().includes(quickOfferSearch.toLowerCase()) ||
                              p.category.toLowerCase().includes(quickOfferSearch.toLowerCase())
                            )
                            .slice(0, 100)
                            .map(p => (
                              <option key={p.sku} value={p.sku}>{p.sku} - {p.name} (${p.factoryPrice})</option>
                            ))
                          }
                        </select>
                        <p className="text-[10px] text-slate-400">
                          Showing top 100 matching items of {products.filter(p => p.name.toLowerCase().includes(quickOfferSearch.toLowerCase()) || p.sku.toLowerCase().includes(quickOfferSearch.toLowerCase()) || p.category.toLowerCase().includes(quickOfferSearch.toLowerCase())).length} found.
                        </p>
                      </div>
                    </div>

                    {selectedProduct && (
                      <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg space-y-1">
                        <div className="flex justify-between">
                          <span>Base Factory Price:</span>
                          <span className="font-bold text-slate-700">${selectedProduct.factoryPrice} USD</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-emerald-600">
                          <span>Auto-Approval Threshold (85%):</span>
                          <span className="font-bold">${(selectedProduct.factoryPrice * 0.85).toFixed(2)} USD</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Proposed Factory Price ($ / unit)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={quickOfferPrice}
                        onChange={(e) => setQuickOfferPrice(e.target.value)}
                        className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none ${themePresets[themeColor].borderFocus}`}
                        required
                      />
                      {selectedProduct && quickOfferPrice && (
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>Offer: {((parseFloat(quickOfferPrice) / selectedProduct.factoryPrice) * 100).toFixed(1)}% of base price</span>
                          <span>Direct Savings: ${Math.max(0, Number((selectedProduct.factoryPrice - parseFloat(quickOfferPrice)).toFixed(2)))} USD</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Importer / Buyer Email Address</label>
                      <input 
                        type="email" 
                        value={quickOfferEmail}
                        onChange={(e) => setQuickOfferEmail(e.target.value)}
                        className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none ${themePresets[themeColor].borderFocus}`}
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={quickOfferLoading || !selectedProduct}
                      className={`w-full py-2.5 px-4 ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer`}
                    >
                      {quickOfferLoading ? "Analyzing offer..." : "Submit to Factory Negotiations"}
                    </button>
                  </form>

                  {/* Quick Offer Results */}
                  {quickOfferResult && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-fade-in text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        {quickOfferResult.status === "accepted" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span>{quickOfferResult.status === "accepted" ? "Offer Pre-Approved!" : "Offer Kept for Manual Review"}</span>
                      </div>
                      <p className="text-slate-500 leading-snug">{quickOfferResult.message}</p>
                    </div>
                  )}
                </div>

                {/* Review & History Log Panel */}
                <div className="xl:col-span-8 space-y-6">
                  
                  {/* Active Pending Negotiations */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-left">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                          <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
                          Approval Analytics (Human-in-the-Loop)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Offers below the 85% threshold, waiting for custom counter-offers, approval, or rejection.</p>
                      </div>
                      <span className="text-xs font-mono bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                        {offers.filter(o => o.status === "pending").length} pending
                      </span>
                    </div>

                    <div className="space-y-3">
                      {offers.filter(o => o.status === "pending").length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          No active negotiations requiring human approval.
                        </div>
                      ) : (
                        offers.filter(o => o.status === "pending").map(offer => {
                          const ratio = ((offer.proposedPrice / offer.factoryPrice) * 100).toFixed(1);
                          return (
                            <div key={offer.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                              <div className="lg:col-span-5 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold bg-amber-100 border border-amber-200 text-amber-700 px-1.5 py-0.2 rounded font-mono">PENDING</span>
                                  <span className="text-slate-400 font-mono">{offer.sku}</span>
                                </div>
                                <h4 className="font-bold text-slate-800 mt-1">{offer.productName}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Buyer: {offer.customerEmail}</p>
                              </div>

                              <div className="lg:col-span-3 text-[11px] text-slate-500 space-y-0.5 text-left">
                                <div>Factory: <b>${offer.factoryPrice}</b></div>
                                <div>Proposed: <span className="text-amber-600 font-bold">${offer.proposedPrice} ({ratio}%)</span></div>
                                <div>Landed: <b>${offer.landedCost}</b></div>
                              </div>

                              <div className="lg:col-span-4 flex justify-end gap-2 text-xs">
                                <button 
                                  onClick={() => handleResolveOffer(offer.id, "accepted")}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition-colors cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleResolveOffer(offer.id, "rejected")}
                                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Finalized Logs Table */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                          Deals CRM Logbook & Audit Trail
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Synchronized database logs for automated export to ERP systems (SAP, Odoo, Sage).</p>
                      </div>

                      <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5 text-slate-500" />
                        Export to CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-3">Item Details</th>
                            <th className="p-3">Factory price</th>
                            <th className="p-3">Agreed price</th>
                            <th className="p-3">Landed cost</th>
                            <th className="p-3">Importer</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {offers.filter(o => o.status !== "pending").length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-400 text-xs">
                                No finalized deals found. Run your first factory negotiation!
                              </td>
                            </tr>
                          ) : (
                            offers.filter(o => o.status !== "pending").map((offer) => {
                              const isApproved = offer.status === "accepted";
                              return (
                                <tr key={offer.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-3 font-semibold">
                                    <span className={`font-mono text-[9px] ${themePresets[themeColor].accentText} block`}>{offer.sku}</span>
                                    <span className="text-slate-800 text-xs block truncate max-w-[150px]">{offer.productName}</span>
                                  </td>
                                  <td className="p-3 font-mono">${offer.factoryPrice}</td>
                                  <td className="p-3 font-mono text-teal-600 font-bold">${offer.proposedPrice}</td>
                                  <td className="p-3 font-mono text-emerald-600 font-bold">${offer.landedCost}</td>
                                  <td className="p-3 text-slate-400 truncate max-w-[120px]" title={offer.customerEmail}>{offer.customerEmail}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                      isApproved 
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                        : "bg-rose-50 text-rose-600 border-rose-200"
                                    }`}>
                                      {offer.status === "accepted" ? "APPROVED" : "REJECTED"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* OCR PDF & Text Extraction Tab */}
            {activeTab === "ocr" && (
              <motion.div
                key="ocr"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left"
              >
                {/* Upload Zone / Text input */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Upload className={`w-4.5 h-4.5 ${themePresets[themeColor].accentText}`} />
                      AI Proforma Invoice OCR Reader
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Paste raw text from factory proforma invoices or packing lists. Gemini AI extracts structured product items automatically.
                    </p>
                  </div>

                  {/* Preset invoice selectors for super easy demonstration */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Select a demo template for instant testing:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => loadPresetOcr(1)}
                        className={`p-1.5 bg-white hover:${themePresets[themeColor].lightBg} border border-slate-200 rounded text-[10px] font-semibold text-slate-700 transition-colors text-left cursor-pointer`}
                      >
                        📄 Office Furniture Proforma (150 pcs)
                      </button>
                      <button 
                        onClick={() => loadPresetOcr(2)}
                        className={`p-1.5 bg-white hover:${themePresets[themeColor].lightBg} border border-slate-200 rounded text-[10px] font-semibold text-slate-700 transition-colors text-left cursor-pointer`}
                      >
                        🌱 Bamboo Toothbrush Spec (2000 pcs)
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleOcrSubmit} className="space-y-4">
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-1">Paste invoice / packing slip text here:</label>
                      <textarea 
                        rows={10}
                        value={ocrText}
                        onChange={(e) => setOcrText(e.target.value)}
                        placeholder="Yiwu Sourcing Co...&#10;ITEMS:&#10;SKU: FUR-ERGO-001 | Office Chair | Unit Price: 72 USD..."
                        className={`w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-xs font-mono focus:outline-none ${themePresets[themeColor].borderFocus}`}
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={ocrLoading || !ocrText.trim()}
                      className={`w-full py-2.5 px-4 ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5`}
                    >
                      {ocrLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Gemini AI is analyzing invoice data...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                          <span>Extract with Gemini AI OCR</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Extracted Items Smart Cards result */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  {ocrLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                      <RefreshCw className={`w-8 h-8 ${themePresets[themeColor].accentText} animate-spin mb-3`} />
                      <h4 className="font-bold text-slate-800 text-sm">Extracting in real time...</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm text-center leading-relaxed">
                        Connecting to the Gemini Vision API to parse, cross-reference, and structure product items, quantities, and prices.
                      </p>
                    </div>
                  ) : ocrResult ? (
                    <div className="space-y-4 animate-fade-in">
                      <div className={`${themePresets[themeColor].lightBg} border border-slate-200 rounded-xl p-3.5 text-xs`}>
                        <div className={`font-bold ${themePresets[themeColor].text} text-sm mb-1`}>{ocrResult.vendor}</div>
                        <div className="grid grid-cols-2 gap-2 text-slate-500 mt-2">
                          <div>Invoice №: <span className="font-bold text-slate-700">{ocrResult.invoiceNumber}</span></div>
                          <div>Date: <span className="font-bold text-slate-700">{ocrResult.date}</span></div>
                          <div>Total Amount: <span className="font-bold text-emerald-600">${ocrResult.totalAmount} USD</span></div>
                          <div>Shipping Fee: <span className="font-bold text-slate-700">${ocrResult.shippingEstimate} USD</span></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Extracted B2B Products</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {ocrResult.items.map((item, idx) => {
                            const landed = Number((item.unitPrice * 1.08 + 1.65).toFixed(2));
                            const alreadyImported = ocrImportedSkus.has(item.sku) || products.some(p => p.sku === item.sku);

                            return (
                              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className={`text-[10px] font-mono border px-2 py-0.5 rounded font-bold ${themePresets[themeColor].badge}`}>
                                    {item.sku}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold">Quantity: <b>{item.quantity} pcs</b></span>
                                </div>

                                <div>
                                  <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{item.description}</h5>
                                  <div className="flex justify-between text-[11px] mt-1.5 text-slate-500 pb-1.5 border-b border-slate-100">
                                    <span>Unit factory price:</span>
                                    <span className="font-bold">${item.unitPrice}</span>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center text-[11px] bg-white border border-slate-100 p-1.5 rounded">
                                  <span className="text-slate-400">Landed Cost estimate:</span>
                                  <span className="text-emerald-600 font-bold">${landed}</span>
                                </div>

                                <button 
                                  onClick={() => handleImportOcrToCatalog(item, ocrResult.vendor)}
                                  disabled={alreadyImported}
                                  className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    alreadyImported 
                                      ? "bg-slate-200 text-slate-400 border-none" 
                                      : `${themePresets[themeColor].lightBg} hover:opacity-90 border border-slate-200 ${themePresets[themeColor].text}`
                                  }`}
                                >
                                  {alreadyImported ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Imported into Catalog</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Import into Catalog</span>
                                      <Plus className="w-3.5 h-3.5" />
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
                    <div className="flex flex-col items-center justify-center py-28 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      <FileText className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                      <h4 className="font-bold text-slate-600 text-sm font-semibold">No Proforma Document Loaded</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm text-center leading-relaxed">
                        Paste the invoice text or select one of the ready demo templates on the left to test our real-time AI OCR.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Global Supplier Search Tab */}
            {activeTab === "global-search" && (
              <motion.div
                key="global-search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Search Bar Panel */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-left space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Globe className={`w-5 h-5 ${themePresets[themeColor].accentText} animate-pulse`} />
                        Global B2B Supplier Search (Live Search Grounded AI)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Enter a product query. Our search-grounded AI will scan global B2B supplier indices (Alibaba, Global Sources, Europages, etc.) in real time for the 10 most competitive offers, listing single unit price, price for 10 units, and delivery lead time.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded-full uppercase font-bold">
                      Google Search Grounding
                    </span>
                  </div>

                  <form onSubmit={handleGlobalSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="e.g., Bamboo toothbrush wholesale, LED table lamp bulk, custom phone cases, solar panels..."
                        value={globalSearchQuery}
                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none ${themePresets[themeColor].borderFocus}`}
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={globalSearchLoading}
                      className={`px-6 py-2.5 ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} disabled:opacity-55 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm`}
                    >
                      {globalSearchLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>Find 10 Cheapest</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Hot Tags / Preset Queries */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Popular:</span>
                    {["Eco Toothbrush", "Ergonomic Office Chair", "USB-C Power Bank", "Matte Ceramic Vase"].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setGlobalSearchQuery(tag);
                        }}
                        className={`text-[11px] text-slate-500 hover:${themePresets[themeColor].text} bg-slate-100 hover:${themePresets[themeColor].lightBg} px-2.5 py-1 rounded-md border border-slate-200/60 transition-colors cursor-pointer`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Results Display */}
                {globalSearchLoading && (
                  <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-400 space-y-4">
                    <div className={`w-16 h-16 ${themePresets[themeColor].lightBg} rounded-full flex items-center justify-center mx-auto shadow-inner`}>
                      <RefreshCw className={`w-8 h-8 ${themePresets[themeColor].accentText} animate-spin`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Running Real-Time Market Scan...</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                        Our AI connects to search engines in real time, filtering through global manufacturers and suppliers for <b>{globalSearchQuery}</b>. We then sort live offers from lowest price to highest!
                      </p>
                    </div>
                  </div>
                )}

                {globalSearchError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 flex items-start gap-2.5 text-left">
                    <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Search Error:</span> {globalSearchError}
                      <p className="mt-1 text-red-500">The system will automatically attempt a secure local cache/fallback search upon retry.</p>
                    </div>
                  </div>
                )}

                {globalSearchResults.length > 0 && (
                  <div className="space-y-4">
                    
                    {/* Search Stats Header */}
                    <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
                      <div className="text-xs">
                        <div className="text-slate-800 font-bold">
                          10 Cheapest Sourced Offers for <span className={`${themePresets[themeColor].accentText}`}>"{globalSearchQuery}"</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Offers are sorted dynamically by lowest unit price. Includes bundle pricing for 10 units and shipping lead times.
                        </p>
                      </div>
                      <div className="text-xs font-mono bg-white border border-slate-200 rounded px-2.5 py-1 font-bold text-slate-600">
                        Lowest Price: <span className="text-emerald-600 font-black">${globalSearchResults[0].unitPriceUsd.toFixed(2)} / unit</span>
                      </div>
                    </div>

                    {/* Results Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      {globalSearchResults.map((item, index) => {
                        const isImported = globalSearchImportedIds.has(item.id) || products.some(p => p.name.toLowerCase() === item.productName.toLowerCase());
                        
                        return (
                          <div 
                            key={item.id} 
                            className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between`}
                          >
                            <div>
                              {/* Card Header */}
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-[10px] font-mono border px-2 py-0.5 rounded font-black uppercase ${themePresets[themeColor].badge}`}>
                                  OFFER #{index + 1}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                                  {item.country}
                                </span>
                              </div>

                              {/* Product Info */}
                              <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-2" title={item.productName}>
                                {item.productName}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Supplier: <span className="text-slate-700 font-bold">{maskSupplierInfo ? `Verified Partner #${String(item.id).slice(0, 5)}` : item.supplier}</span></p>

                              {/* Pricing and Delivery block */}
                              <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-150">
                                <div className="text-xs">
                                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Unit Price</span>
                                  <span className="text-sm font-black text-slate-800">${item.unitPriceUsd.toFixed(2)}</span>
                                  <span className="text-[9px] text-slate-400 block mt-0.5">USD</span>
                                </div>
                                <div className="text-xs border-l border-slate-200 pl-3">
                                  <span className="text-[9px] uppercase tracking-wider text-indigo-500 block font-bold">Price for 10 units</span>
                                  <span className="text-sm font-black text-indigo-600">${item.tenUnitsPriceUsd.toFixed(2)}</span>
                                  <span className="text-[9px] text-slate-400 block mt-0.5">USD per batch</span>
                                </div>
                              </div>

                              <div className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                                <div className="flex justify-between">
                                  <span>Delivery Lead Time:</span>
                                  <span className="font-bold text-emerald-600">{item.deliveryTimeDays} days</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Shipping Method:</span>
                                  <span className="text-slate-500 font-medium">{item.shippingMethod}</span>
                                </div>
                              </div>

                              {/* Description details */}
                              <p className="text-[11px] text-slate-500 mt-3 border-t border-slate-100 pt-2.5 leading-relaxed italic">
                                {item.descriptionBg}
                              </p>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                                                 <button
                                onClick={() => handleImportGlobalProduct(item)}
                                disabled={isImported}
                                className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                  isImported 
                                    ? "bg-slate-100 text-slate-400 border border-transparent" 
                                    : `${themePresets[themeColor].lightBg} hover:opacity-90 border border-slate-200 ${themePresets[themeColor].text}`
                                }`}
                              >
                                {isImported ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Imported</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Import into ERP</span>
                                    <Plus className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Grounding Attribution sources */}
                    {globalSearchGrounding && (
                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-400 text-left flex flex-wrap gap-2 items-center">
                        <span className="font-bold">Search Grounding Sources (Verified by Google Search):</span>
                        {globalSearchGrounding.groundingChunks?.map((chunk: any, i: number) => {
                          if (chunk.web?.uri) {
                            return (
                              <a 
                                key={i} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noreferrer" 
                                className={`hover:underline font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 ${themePresets[themeColor].accentText}`}
                              >
                                {chunk.web.title || `Source ${i + 1}`}
                              </a>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}

                  </div>
                )}

                {/* Initial Empty State */}
                {!globalSearchLoading && globalSearchResults.length === 0 && (
                  <div className="bg-white border border-dashed border-slate-200 rounded-xl p-16 text-center text-slate-400">
                    <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base text-slate-600 font-semibold">Ready for Global Procurement</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Enter a product name above for real-time global index search. The system will retrieve the 10 lowest prices and delivery times!
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Admin Audit & Payments Ledger Tab (Bulgarian Admin panel) */}
            {activeTab === "admin-audit" && (clientSession?.email === "kolev.tihomir@gmail.com" || clientSession?.isDeputyAdmin) && (
              <motion.div
                key="admin-audit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* ДЕКСТОП УПРАВЛЕНИЕ, 24/7 КЛАУД СТАТУС И GOOGLE СЕСИЯ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Карта 1: Десктоп Стартиране */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-left flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                          <Laptop className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">Бърз Достъп от Десктоп</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        Инсталирайте ProcureOS като самостоятелно приложение директно на компютъра или мобилния си телефон за бърз достъп с икона от вашия десктоп!
                      </p>
                      <div className="text-[11px] bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-slate-500 space-y-1.5 mb-4">
                        <div><strong>За Google Chrome (Десктоп):</strong> Натиснете бутона по-долу или иконата за инсталация в адресната лента горе вдясно.</div>
                        <div><strong>За Apple Safari (iPhone):</strong> Натиснете <strong className="text-slate-700">"Споделяне"</strong> и изберете <strong className="text-slate-700">"Добавяне към началния екран"</strong>.</div>
                      </div>
                    </div>
                    <button
                      onClick={handleInstallApp}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
                    >
                      <Laptop className="w-4 h-4" />
                      Инсталирай на Десктоп
                    </button>
                  </div>

                  {/* Карта 2: 24/7 Сървърен Статус */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-left flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                          <Server className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">Денонощен Сървър (24/7)</h4>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-emerald-700 font-mono">АКТИВЕН И ОНЛАЙН В КЛАУДА</span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 mb-1">
                        ❓ Ако изключа компютъра си, клиентът ще има ли достъп?
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        <strong className="text-emerald-600 font-semibold">ДА, НАПЪЛНО!</strong> ProcureOS се хоства в защитен облачен контейнер на Google Cloud Run. Клиентите ви виждат офертите, преговарят с изкуствения интелект и плащат по всяко време на денонощието – независимо дали компютърът ви е изключен или затворен!
                      </p>
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 text-center">
                      Сървър: <span className="font-mono bg-slate-50 px-1 py-0.5 rounded">Google Cloud Run (Active 24/7)</span>
                    </div>
                  </div>

                  {/* Карта 3: Google Сесия Countdown */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-left flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
                          <Clock className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">Google Сесия (60 мин. лимит)</h4>
                      </div>

                      {googleToken ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Оставащо време:</span>
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                              (googleTokenSecondsLeft || 3600) <= 600 
                                ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse" 
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              {formatTimeLeft(googleTokenSecondsLeft)} мин
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                (googleTokenSecondsLeft || 3600) <= 600 ? "bg-rose-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, ((googleTokenSecondsLeft || 3600) / 3600) * 100))}%` }}
                            />
                          </div>

                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Google ограничава сесиите до точно 1 час за ваша сигурност. Натиснете бутона долу, за да презаредите и да си осигурите още 1 час непрекъснат синхрон с таблиците!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-150 text-[11px] text-slate-500 text-center">
                            В момента няма активна Google Workspace сесия за синхронизиране на таблици.
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Свържете се с вашия Google акаунт от раздела за продукти, за да активирате автоматичния 24/7 синхрон.
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleGoogleLogin}
                      className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {googleToken ? "Презареди Google Сесията" : "Свържи Google Workspace"}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-left">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5 mb-5">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-rose-600" />
                        Registered Users & Payments Audit (Admin)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Administrative ledger to monitor client access, verification status, and simulated Stripe transactions.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={fetchRegisteredUsers}
                        disabled={adminLoading}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-250 border border-slate-250 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${adminLoading ? "animate-spin" : ""}`} />
                        Refresh Directory
                      </button>
                      
                      {googleToken && linkedSheetId && (
                        <button
                          onClick={handleSyncSheet}
                          disabled={sheetsSyncLoading}
                          className={`px-3.5 py-2 ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Sync with Google Sheets
                        </button>
                      )}
                    </div>
                  </div>

                  {adminLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin text-slate-300 mb-2" />
                      <p className="text-xs">Loading partner directory...</p>
                    </div>
                  ) : registeredUsersList.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No registered users in the system</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="p-3.5">Partner (Name)</th>
                            <th className="p-3.5">Company / Phone</th>
                            <th className="p-3.5">Email Address</th>
                            <th className="p-3.5 text-center">Email Verified</th>
                            <th className="p-3.5 text-center">Role / Deputy</th>
                            <th className="p-3.5 text-center">Subscription Status</th>
                            <th className="p-3.5">Plan & Paid Total</th>
                            <th className="p-3.5 text-right">Quick Actions (Testing)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {registeredUsersList.map((user: any) => {
                            const isSelf = user.email === clientSession?.email;
                            return (
                              <tr key={user.email} className={`hover:bg-slate-50/50 transition-colors ${isSelf ? "bg-amber-50/20" : ""}`}>
                                <td className="p-3.5 font-bold text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-700 border border-slate-200">
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <span>{user.name}</span>
                                      {isSelf && <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-100 text-amber-800 rounded">You</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5">
                                  <div className="font-semibold text-slate-700">{user.company || "No company"}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{user.phone || "No phone"}</div>
                                </td>
                                <td className="p-3.5 font-mono text-slate-600">{user.email}</td>
                                <td className="p-3.5 text-center">
                                  <button
                                    onClick={() => handleToggleUser(user.email, "isEmailVerified")}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer ${
                                      user.isEmailVerified
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                        : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.isEmailVerified ? "bg-emerald-500" : "bg-amber-400"}`} />
                                    {user.isEmailVerified ? "VERIFIED" : "UNVERIFIED"}
                                  </button>
                                </td>
                                <td className="p-3.5 text-center">
                                  {user.email === "kolev.tihomir@gmail.com" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold uppercase">
                                      <ShieldCheck className="w-3 h-3 text-rose-600" />
                                      Главен Админ
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        if (clientSession?.email === "kolev.tihomir@gmail.com") {
                                          handleToggleUser(user.email, "isDeputyAdmin");
                                        }
                                      }}
                                      disabled={clientSession?.email !== "kolev.tihomir@gmail.com"}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all ${
                                        user.isDeputyAdmin
                                          ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                      } ${clientSession?.email === "kolev.tihomir@gmail.com" ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                                      title={clientSession?.email === "kolev.tihomir@gmail.com" ? "Кликнете за промяна на статус на заместник" : "Само главният администратор може да назначава заместници"}
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      {user.isDeputyAdmin ? "ЗАМЕСТНИК (Deputy)" : "ПОТРЕБИТЕЛ"}
                                    </button>
                                  )}
                                </td>
                                <td className="p-3.5 text-center">
                                  <button
                                    onClick={() => handleToggleUser(user.email, "isPaid")}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer ${
                                      user.isPaid
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                        : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.isPaid ? "bg-emerald-500" : "bg-rose-500"}`} />
                                    {user.isPaid ? "PAID" : "UNPAID"}
                                  </button>
                                </td>
                                <td className="p-3.5">
                                  {user.isPaid ? (
                                    <div className="space-y-0.5">
                                      <div className="font-bold text-slate-800">{user.planSelected}</div>
                                      <div className="text-[11px] text-slate-400 font-mono">Total paid: <strong className="text-slate-600">€{user.paymentAmount}</strong> (card **{user.paymentCardLast4})</div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="p-3.5 text-right space-x-1">
                                  <button
                                    onClick={() => handleToggleUser(user.email, "isPaid")}
                                    className="px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg hover:border-slate-350 text-slate-700 hover:text-slate-900 transition-all cursor-pointer focus:outline-none font-bold text-[10px]"
                                    title="Toggle payment status for testing"
                                  >
                                    Toggle Payment
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-150 text-[11px] text-slate-500 leading-relaxed space-y-2">
                    <p className="font-bold text-slate-700">🔒 Data Confidentiality & Administrator Security:</p>
                    <p>
                      As an administrator of <strong>ProcureOS</strong>, this view and its data are confidential and are never exposed to clients. 
                      When syncing your ERP data, this directory is automatically stored in the third secure tab of your linked Google Spreadsheet 
                      (<strong>"Client Registrations & Payments"</strong>) for complete cross-platform logging.
                    </p>
                  </div>

                  {/* B2B Disintermediation & Bypass Protection Panel */}
                  <div className="mt-8 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-6 shadow-md text-left space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-amber-500" />
                        🛡️ B2B Bypass Protection & Secure Escrow Hub
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Prevent clients from bypassing you to source direct from manufacturers. Control info masking and enforce platform escrow.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mask Supplier Info */}
                      <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 pr-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                              Mask Supplier Identity
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Replaces exact factory names and URLs with generic IDs (e.g., <em>"Verified Factory Partner"</em>) in client catalogs and search results.
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                            <input 
                              type="checkbox" 
                              checked={maskSupplierInfo} 
                              onChange={(e) => handleToggleOption("maskSupplierInfo", e.target.checked)}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        </div>
                      </div>

                      {/* Escrow Payments */}
                      <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 pr-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                              Enforce Platform Escrow
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Hide direct factory pricing. All active negotiations are routed as platform contracts where clients pay you, and you fulfill the B2B logistics.
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                            <input 
                              type="checkbox" 
                              checked={escrowEnabled} 
                              onChange={(e) => handleToggleOption("escrowEnabled", e.target.checked)}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time B2B Gateway Configuration Dashboard */}
                  <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-left space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-sky-600" />
                        📡 Direct Supplier ERP & Mail Gateway (Live Integration)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Configure real-world webhooks and SMTP mail delivery. Once saved, all B2B negotiations, approvals, and accounts bypass simulation and communicate live.
                      </p>
                    </div>

                    <form onSubmit={handleSaveGatewayConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Webhook Connection Panel */}
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Send className="w-4 h-4 text-sky-500" />
                            Supplier REST API Webhook
                          </h4>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={gatewayWebhookEnabled} 
                              onChange={(e) => setGatewayWebhookEnabled(e.target.checked)}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                            <span className="ml-2 text-[10px] font-bold text-slate-500">Active</span>
                          </label>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-extrabold text-slate-500 uppercase">Supplier Webhook URL</label>
                            <input 
                              type="url" 
                              placeholder="https://webhook.site/test-integration" 
                              value={gatewayWebhookUrl} 
                              onChange={(e) => setGatewayWebhookUrl(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs focus:outline-none font-mono"
                            />
                            <p className="text-[9px] text-slate-400">
                              Every submission or resolution triggers a live POST payload to this endpoint with exact offer details.
                            </p>
                          </div>

                          <div className="pt-2 flex gap-2">
                            <button 
                              type="button" 
                              onClick={handleTestWebhook}
                              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Test Connection Ping
                            </button>
                          </div>

                          {gatewayWebhookTestLog && (
                            <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[9px] rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap">
                              {gatewayWebhookTestLog}
                            </pre>
                          )}
                        </div>
                      </div>

                      {/* SMTP Mail Connection Panel */}
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-emerald-500" />
                            SMTP Server (Direct Notifications)
                          </h4>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={gatewaySmtpEnabled} 
                              onChange={(e) => setGatewaySmtpEnabled(e.target.checked)}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-2 text-[10px] font-bold text-slate-500">Active</span>
                          </label>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[11px] font-extrabold text-slate-500 uppercase">SMTP Host</label>
                            <input 
                              type="text" 
                              placeholder="smtp.mailtrap.io" 
                              value={gatewaySmtpHost} 
                              onChange={(e) => setGatewaySmtpHost(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-extrabold text-slate-500 uppercase">Port</label>
                            <input 
                              type="text" 
                              placeholder="2525" 
                              value={gatewaySmtpPort} 
                              onChange={(e) => setGatewaySmtpPort(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-extrabold text-slate-500 uppercase">Username</label>
                            <input 
                              type="text" 
                              placeholder="smtp_user" 
                              value={gatewaySmtpUser} 
                              onChange={(e) => setGatewaySmtpUser(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-extrabold text-slate-500 uppercase">Password</label>
                            <input 
                              type="password" 
                              placeholder="••••••••" 
                              value={gatewaySmtpPass} 
                              onChange={(e) => setGatewaySmtpPass(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              * За Gmail/Google акаунти, използвайте <strong className="text-emerald-600 font-semibold">Парола за приложение (App Password)</strong>, а не основната си парола.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500 uppercase">Sender Email (From)</label>
                          <input 
                            type="email" 
                            placeholder="no-reply@procureos.com" 
                            value={gatewaySmtpFrom} 
                            onChange={(e) => setGatewaySmtpFrom(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs focus:outline-none"
                          />
                        </div>

                        <div className="pt-2 space-y-2">
                          <div className="flex gap-2">
                            <input 
                              type="email" 
                              placeholder="Test recipient email" 
                              value={gatewayTestRecipient} 
                              onChange={(e) => setGatewayTestRecipient(e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs focus:outline-none"
                            />
                            <button 
                              type="button" 
                              onClick={handleTestEmail}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Test SMTP Deliverability
                            </button>
                          </div>

                          {gatewayEmailTestLog && (
                            <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[9px] rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap">
                              {gatewayEmailTestLog}
                            </pre>
                          )}
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 flex items-center justify-between pt-2 border-t border-slate-150">
                        {gatewaySaveStatus ? (
                          <div className="text-xs font-bold text-slate-700">{gatewaySaveStatus}</div>
                        ) : (
                          <div className="text-[11px] text-slate-400">Settings are written dynamically to backend RAM. No reboot required.</div>
                        )}
                        <button 
                          type="submit" 
                          disabled={gatewayLoading}
                          className={`px-5 py-2.5 ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {gatewayLoading ? "Saving..." : "Apply & Activate Gateway"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Real Gemini Sourcing AI Chatbot Module */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-left">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <MessageSquare className={`w-4.5 h-4.5 ${themePresets[themeColor].accentText}`} />
                AI Procurement & Sourcing Assistant (Gemini 3.5 Flash)
              </h3>
              <p className="text-xs text-slate-400">Ask about freight rates, customs regulations, EU customs duties, VAT, or multi-batch cost calculations.</p>
            </div>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100 px-2.5 py-0.5 rounded-full">
              LIVE CONNECTION
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 h-56 overflow-y-auto space-y-3 border border-slate-150 flex flex-col">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                  msg.role === "user" 
                    ? `${themePresets[themeColor].primaryBg} text-white self-end rounded-tr-none shadow-sm` 
                    : "bg-white text-slate-700 border border-slate-200 self-start rounded-tl-none shadow-sm/5"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-white border border-slate-200 text-slate-400 rounded-xl p-3 text-xs leading-relaxed self-start rounded-tl-none flex items-center gap-2 shadow-sm/5">
                <RefreshCw className={`w-3.5 h-3.5 animate-spin ${themePresets[themeColor].accentText}`} />
                <span>AI assistant is analyzing shipping, tax, and landed costs...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} className="mt-3.5 flex gap-2">
            <input 
              type="text" 
              placeholder="e.g., What are the customs regulations for importing electronics from China to the EU?"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className={`flex-1 px-3.5 py-2 border border-slate-200 bg-slate-50 rounded-lg text-xs placeholder-slate-400 focus:outline-none ${themePresets[themeColor].borderFocus}`}
            />
            <button 
              type="submit"
              disabled={chatLoading}
              className={`px-4 py-2 ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center shadow-sm`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </main>

      {/* Dynamic Product Form Modal (for Add & Edit) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl relative overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setShowProductModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Sparkle className={`w-4.5 h-4.5 ${themePresets[themeColor].accentText}`} />
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h3>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">SKU Code (Unique)</label>
                  <input 
                    type="text" 
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    disabled={!!editingProduct}
                    className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none ${themePresets[themeColor].borderFocus}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none ${themePresets[themeColor].borderFocus}`}
                  >
                    <option value="Furniture">Furniture</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Decor">Decor</option>
                    <option value="Import">General Import</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Product Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ergonomic Office Chair"
                  className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none ${themePresets[themeColor].borderFocus}`}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Factory Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.factoryPrice}
                    onChange={(e) => setFormData({ ...formData, factoryPrice: e.target.value })}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none ${themePresets[themeColor].borderFocus}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Retail Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none ${themePresets[themeColor].borderFocus}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none ${themePresets[themeColor].borderFocus}`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Factory / Supplier</label>
                  <input 
                    type="text" 
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="e.g., Dongguan Furniture Ltd"
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none ${themePresets[themeColor].borderFocus}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Lead Time (Days)</label>
                  <input 
                    type="number" 
                    value={formData.leadTimeDays}
                    onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none ${themePresets[themeColor].borderFocus}`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Supplier Trust Score (10-100)</label>
                  <input 
                    type="number" 
                    min="10"
                    max="100"
                    value={formData.supplierTrust}
                    onChange={(e) => setFormData({ ...formData, supplierTrust: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Partnership Years</label>
                  <input 
                    type="number" 
                    value={formData.supplierYears}
                    onChange={(e) => setFormData({ ...formData, supplierYears: e.target.value })}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none ${themePresets[themeColor].borderFocus}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Certifications</label>
                  <input 
                    type="text" 
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    placeholder="CE, RoHS, FDA"
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none ${themePresets[themeColor].borderFocus}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Product Description</label>
                <textarea 
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional manufacturing notes or material specifications..."
                  className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none ${themePresets[themeColor].borderFocus}`}
                />
              </div>

              <button 
                type="submit"
                className={`w-full py-2.5 ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer`}
              >
                {editingProduct ? "Save Changes" : "Create New Catalog Entry"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Product CSV Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl relative overflow-y-auto max-h-[90vh] space-y-4">
            <button 
              onClick={() => setShowBulkUploadModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                Bulk Import Products via CSV
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload or paste a comma-separated text file of products to initialize or extend your B2B sourcing catalog instantly. If a SKU already exists, its details will be updated automatically (Upsert).
              </p>
            </div>

            {/* Template Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Standard CSV Column Headers</span>
                <button 
                  onClick={() => {
                    const sample = `sku,name,category,factoryPrice,retailPrice,weightKg,supplier,supplierTrust,supplierYears,certifications,leadTimeDays,description
PROD-CHAIR-X,"Modern Ergonomic Mesh Chair",Furniture,75.00,220.00,12,"Sofia Ergonomics Ltd",95,4,"CE, ISO9001",15,"Breathable mesh, high-back ergonomic chair with adjustable armrests"
PROD-LAMP-Y,"Smart Desk Lamp 10W",Electronics,12.50,39.99,0.85,"BrightTech Guangdong",90,3,"CE, RoHS",10,"Dimmable LED desk lamp with touch controls and built-in USB charging"`;
                    navigator.clipboard.writeText(sample);
                    alert("Sample CSV copied to clipboard!");
                  }}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                >
                  <FileDown className="w-3 h-3" />
                  Copy Sample Template
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Required columns: <strong className="text-slate-800">sku</strong>, <strong className="text-slate-800">name</strong>, <strong className="text-slate-800">factoryPrice</strong>. Optional columns: <em>category, retailPrice, weightKg, supplier, supplierTrust, supplierYears, certifications, leadTimeDays, description</em>.
              </p>
            </div>

            {/* Drag and Drop and File Selection */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 bg-white hover:bg-slate-50/50"
              }`}
            >
              <input 
                type="file" 
                id="csv-file-upload" 
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden" 
              />
              <label htmlFor="csv-file-upload" className="cursor-pointer space-y-2 block">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-700 font-bold">
                  Drag and drop your .csv file here, or <span className="text-indigo-600 underline">browse</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Accepts standard comma-separated text files (.csv)
                </div>
              </label>
            </div>

            {/* CSV Raw Text Area */}
            <div className="space-y-1.5">
              <label className="block text-slate-600 font-bold text-xs">Or Paste Raw CSV Data Directly</label>
              <textarea 
                rows={5}
                value={bulkCsvText}
                onChange={(e) => setBulkCsvText(e.target.value)}
                placeholder="sku,name,category,factoryPrice,retailPrice,weightKg,supplier,supplierTrust,supplierYears,certifications,leadTimeDays,description&#10;PROD-001,Premium Bamboo Toothbrush,Cosmetics,1.80,5.99,0.1,Bamboo World,90,3,CE,12,Natural biodegradable..."
                className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 placeholder-slate-400"
              />
            </div>

            {/* Results Alert / Error List */}
            {bulkUploadResult && (
              <div className={`p-4 border rounded-xl text-xs space-y-2 ${
                bulkUploadResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  {bulkUploadResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Bulk Catalog Setup Succeeded!
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      Bulk Setup Failed / Blocked
                    </>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 py-1.5 border-y border-emerald-200/50 text-center font-semibold text-[11px] text-slate-700">
                  <div>
                    Inserted: <span className="text-emerald-600 block text-sm font-extrabold">{bulkUploadResult.insertedCount}</span>
                  </div>
                  <div>
                    Updated: <span className="text-blue-600 block text-sm font-extrabold">{bulkUploadResult.updatedCount}</span>
                  </div>
                  <div>
                    Total Processed: <span className="text-slate-800 block text-sm font-extrabold">{bulkUploadResult.totalCount}</span>
                  </div>
                </div>

                {bulkUploadResult.errors.length > 0 && (
                  <div className="space-y-1 pt-1 text-[11px]">
                    <span className="font-extrabold text-slate-700 block uppercase tracking-wider text-[9px]">Encountered Issues / Skipped Rows:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-red-700 max-h-24 overflow-y-auto font-mono">
                      {bulkUploadResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setShowBulkUploadModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button 
                type="button"
                onClick={() => handleParseAndUploadCSV(bulkCsvText)}
                disabled={bulkLoading || !bulkCsvText.trim()}
                className={`px-5 py-2 ${themePresets[themeColor].primaryBg} ${themePresets[themeColor].primaryHover} text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {bulkLoading ? "Uploading & Processing..." : "Import Catalog Items"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-400 mt-auto border-t border-slate-200/80 bg-white">
        <div>ProcureOS © 2026. All rights reserved. Real B2B ERP-compatible management system for importers and global distributors.</div>
      </footer>
    </div>
  );
}
