import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import Stripe from "stripe";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

// Direct Supplier Webhook and SMTP Configurations
let SUPPLIER_INTEGRATION_SETTINGS = {
  webhookUrl: process.env.DEFAULT_SUPPLIER_WEBHOOK_URL || "https://webhook.site/4a2141a9-5059-4210-805a-40569eda554e",
  webhookEnabled: true,
  smtpHost: "smtp.gmail.com",
  smtpPort: 465,
  smtpUser: "kolev.tihomir@gmail.com",
  smtpPass: "qdvxjzwuwnbgfcbz",
  smtpFrom: "kolev.tihomir@gmail.com",
  smtpEnabled: true,
  maskSupplierInfo: true,
  escrowEnabled: true
};

// Helper: Broadcast Webhook events live to active supplier endpoints/ERP
async function triggerSupplierWebhook(event: string, payload: any) {
  const { webhookUrl, webhookEnabled } = SUPPLIER_INTEGRATION_SETTINGS;
  if (!webhookEnabled || !webhookUrl) {
    return {
      success: false,
      log: "Supplier Webhook integration is disabled or URL is empty."
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ProcureOS-Event": event,
        "X-ProcureOS-Signature": "sha256=" + Math.random().toString(36).substr(2, 9)
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload
      })
    });

    const text = await response.text();
    return {
      success: response.ok,
      status: response.status,
      data: text.slice(0, 500),
      log: `Direct webhook broadcasted to ${webhookUrl}. Supplier ERP responded with HTTP ${response.status}.`
    };
  } catch (err: any) {
    console.error("Webhook trigger error:", err);
    return {
      success: false,
      log: `Webhook broadcast failed: ${err.message}`
    };
  }
}

// Helper: Dispatch actual SMTP Emails to buyers and suppliers
async function sendRealEmail(to: string, subject: string, htmlContent: string) {
  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpEnabled } = SUPPLIER_INTEGRATION_SETTINGS;
  if (!smtpEnabled || !smtpHost || !smtpUser || !smtpPass) {
    return {
      success: false,
      log: "SMTP is not fully configured (falling back to secure console simulation log)."
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html: htmlContent,
    });

    return {
      success: true,
      log: `Real email successfully transmitted to ${to}. ID: ${info.messageId}`
    };
  } catch (err: any) {
    console.error("Nodemailer dispatch error:", err);
    let friendlyError = `SMTP transmission failed: ${err.message}`;
    if (
      err.message.includes("534-5.7.9") || 
      err.message.toLowerCase().includes("application-specific password") || 
      err.message.toLowerCase().includes("invalidsecondfactor") ||
      err.message.includes("534")
    ) {
      friendlyError = `🔴 SMTP ГРЕШКА (534-5.7.9) - Изисква се Парола за конкретно Приложение!\n\n` +
        `ПРИЧИНА:\n` +
        `Вашият Google акаунт има активирано двуфакторно удостоверяване (2-Step Verification). Поради това Google НЕ позволява използването на обикновената ви парола за директна SMTP връзка.\n\n` +
        `СТЪПКИ ЗА РЕШАВАНЕ (КЪДЕ ДА НАТИСНЕТЕ):\n` +
        `1️⃣ Отидете в настройките на вашия Google профил (https://myaccount.google.com).\n` +
        `2️⃣ Натиснете върху раздел "Сигурност" (Security) в лявото или горното меню.\n` +
        `3️⃣ Превъртете надолу до секция "Как влизате в Google" (How you sign in to Google).\n` +
        `4️⃣ Натиснете върху "Пароли за достъп през приложение" (App passwords) - ако не го виждате, използвайте търсачката най-горе на страницата и напишете "Пароли за приложение".\n` +
        `5️⃣ Създайте нова парола: изберете приложение "Поща" (Mail), изберете устройство "Друго" (напишете напр. "ProcureOS") и натиснете "Създаване".\n` +
        `6️⃣ Копирайте генерирания жълт 16-буквен код (без интервали, напр. "abcd efgh ijkl mnop").\n` +
        `7️⃣ Поставете този код в полето "Password" на SMTP настройките в това приложение, натиснете "Save Gateway Configurations" долу и стартирайте теста отново!`;
    }
    return {
      success: false,
      log: friendlyError
    };
  }
}


// Initialize GoogleGenAI Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "MOCK_KEY",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Mock Database of Products
let B2B_CATALOG = [
  {
    sku: "FUR-ERGO-001",
    name: "Premium Ergonomic Office Chair",
    category: "Furniture",
    retailPrice: 299.00,
    factoryPrice: 75.00,
    weightKg: 15,
    supplier: "Shenzhen Ergonomics Ltd",
    supplierTrust: 95,
    supplierYears: 8,
    certifications: ["ISO9001", "CE", "BIFMA"],
    leadTimeDays: 25,
    description: "High-back mesh office chair with full lumbar support and dynamic 3D armrests."
  },
  {
    sku: "ECO-TOOTH-002",
    name: "Eco-Friendly Bamboo Toothbrush Pack",
    category: "Cosmetics",
    retailPrice: 15.99,
    factoryPrice: 1.80,
    weightKg: 0.1,
    supplier: "Zhejiang Bamboo Co.",
    supplierTrust: 88,
    supplierYears: 4,
    certifications: ["FSC", "FDA Approved", "CE"],
    leadTimeDays: 15,
    description: "100% biodegradable organic bamboo toothbrushes with charcoal-infused nylon bristles."
  },
  {
    sku: "ELE-PWR-003",
    name: "Ultra-thin Power Bank 10000mAh",
    category: "Electronics",
    retailPrice: 39.99,
    factoryPrice: 8.50,
    weightKg: 0.25,
    supplier: "Guangdong WattPower Corp",
    supplierTrust: 92,
    supplierYears: 6,
    certifications: ["CE", "RoHS", "FCC", "UL"],
    leadTimeDays: 20,
    description: "Sleek aluminum casing power bank with fast charging delivery and dual USB ports."
  },
  {
    sku: "DEC-VASE-004",
    name: "Modern Minimalist Ceramic Vase",
    category: "Decor",
    retailPrice: 54.00,
    factoryPrice: 12.00,
    weightKg: 1.2,
    supplier: "Chaozhou Claymasters",
    supplierTrust: 91,
    supplierYears: 12,
    certifications: ["ISO14001"],
    leadTimeDays: 30,
    description: "Handcrafted matte ceramic vase featuring a Nordic geometric silhouette."
  },
  {
    sku: "ELE-HP-005",
    name: "Noise Cancelling Wireless Headphones",
    category: "Electronics",
    retailPrice: 189.99,
    factoryPrice: 38.00,
    weightKg: 0.35,
    supplier: "Dongguan AcousticTech",
    supplierTrust: 94,
    supplierYears: 5,
    certifications: ["CE", "RoHS", "FCC"],
    leadTimeDays: 18,
    description: "Active Noise Cancellation over-ear headphones with 40-hour battery life and Bluetooth 5.2."
  }
];

// PROGRAMMATIC GENERATOR FOR 20,000 WORLDWIDE TRENDING HIGH-DEMAND COMMODITIES
(() => {
  const CATEGORIES = [
    "Electronics", "Furniture", "Cosmetics", "Decor", "Kitchenware",
    "Sports & Outdoors", "Apparel", "Office Supplies", "Automotive", "Toys & Games"
  ];

  const ADJECTIVES = [
    "Premium", "Eco-Friendly", "Smart", "Ultra", "Portable", "Sleek", "Professional", "Wireless", "Ergonomic",
    "Organic", "Waterproof", "Compact", "Heavy-Duty", "Modern", "Handcrafted", "High-Speed", "Rechargeable",
    "Foldable", "Durable", "Minimalist", "Tactical", "Luxury", "Quantum", "Sonic", "Thermal", "Biodegradable"
  ];

  const PRODUCTS_BY_CAT: Record<string, { nouns: string[]; weightRange: [number, number]; priceRange: [number, number]; suppliers: string[] }> = {
    "Electronics": {
      nouns: ["Smart Watch", "Wireless Earbuds", "LED Strip Lights", "Bluetooth Speaker", "Phone Case", "Power Bank", "Tablet Stand", "Charging Station", "Mechanical Keyboard", "USB-C Hub", "Ring Light", "Action Camera", "Security Camera", "Smart Plug", "Fast Charger"],
      weightRange: [0.05, 1.5],
      priceRange: [3, 120],
      suppliers: ["Shenzhen AcousticTech", "Dongguan ElecLink", "Guangdong WattPower", "Ningbo GadgetWorld", "Wenzhou Circuits"]
    },
    "Furniture": {
      nouns: ["Ergonomic Chair", "Standing Desk", "Minimalist Bookshelf", "Bedside Nightstand", "Footrest", "Modular Sofa", "Accent Chair", "Coffee Table", "Laptop Lap Desk", "Monitor Riser"],
      weightRange: [2.0, 35.0],
      priceRange: [15, 350],
      suppliers: ["Anji Seating Industry", "Foshan ComfortFurniture", "Zhejiang Woodcrafts", "Shunde Steel & Timber", "Dongguan DecoWood"]
    },
    "Cosmetics": {
      nouns: ["Bamboo Toothbrush Pack", "Organic Essential Oil Set", "Hyaluronic Acid Serum", "Facial Cleansing Brush", "Beard Grooming Kit", "Herbal Shampoo Bar", "Mineral Sunscreen", "Silk Sleep Mask", "Jade Facial Roller", "Anti-Aging Cream"],
      weightRange: [0.05, 0.4],
      priceRange: [1.5, 35],
      suppliers: ["Zhejiang BioCosmetics", "Guangzhou BeautyLab", "Ningbo OrganicCare", "Fujian Herbals", "Yiwu DailyNecessities"]
    },
    "Decor": {
      nouns: ["Ceramic Vase", "Scented Soy Candle", "Area Rug", "Decorative Throw Pillow", "Self-Watering Planter", "LED Moon Lamp", "Canvas Wall Art", "Preserved Flower Bouquet", "Macrame Hanging", "Wall Clock"],
      weightRange: [0.1, 4.0],
      priceRange: [2, 75],
      suppliers: ["Chaozhou CeramicMasters", "Yiwu DecoCrafts", "Xiamen Arts & Gifts", "Quanzhou StoneCarvers", "Fujian BambooWeave"]
    },
    "Kitchenware": {
      nouns: ["Air Fryer Liner Set", "Stainless Steel Bottle", "Silicone Baking Mats", "Electric Milk Frother", "Bamboo Cutting Board", "Manual Coffee Grinder", "Vacuum Sealer", "Reusable Storage Bags", "Double-Walled Mug", "Knife Sharpener"],
      weightRange: [0.1, 3.0],
      priceRange: [1.8, 85],
      suppliers: ["Yangjiang MetalWorks", "Yongkang KitchenTech", "Ningbo Glassware", "Zhejiang SiliconeCraft", "Chaozhou Tableware"]
    },
    "Sports & Outdoors": {
      nouns: ["Non-Slip Yoga Mat", "Resistance Bands Set", "Adjustable Dumbbell", "Deep Tissue Massage Gun", "Foam Roller", "Hydration Backpack", "Ab Roller Wheel", "Microfiber Towel", "Waterproof Dry Bag", "Camping Lantern"],
      weightRange: [0.1, 10.0],
      priceRange: [2.5, 140],
      suppliers: ["Yongkang FitnessPower", "Ningbo OutdoorGear", "Shaoxing TextileTech", "Xiamen SportMasters", "Wenzhou Adventure"]
    },
    "Apparel": {
      nouns: ["Gym Leggings", "Cotton Hoodie", "Sports Sunglasses", "Leather Wallet", "Travel Duffel Bag", "Laptop Backpack", "Arch Support Insoles", "Bamboo Socks Pack", "Windbreaker", "Compression Sleeves"],
      weightRange: [0.05, 1.2],
      priceRange: [1.2, 55],
      suppliers: ["Shaoxing ApparelCorp", "Quanzhou Leathercraft", "Guangzhou TextileLabs", "Yiwu FashionLink", "Ningbo Knitwear"]
    },
    "Office Supplies": {
      nouns: ["Weekly Planner", "Gel Pens Pack", "Desk Pad Mat", "Cable Organizer", "Whiteboard", "Expanding File Folder", "Mesh Letter Tray", "Reusable Notebook", "Paper Shredder", "Gel Wrist Rest"],
      weightRange: [0.05, 5.0],
      priceRange: [0.8, 95],
      suppliers: ["Ningbo Stationers", "Wenzhou PaperCorp", "Shenzhen OfficeTech", "Yiwu StationeryHub", "Foshan MetalMesh"]
    },
    "Automotive": {
      nouns: ["Phone Mount", "USB Car Charger", "Portable Tire Inflator", "Seat Organizer", "Microfiber Cloths Pack", "Car Trash Can", "Windshield Sun Shade", "OBD2 Scanner", "Scratch Repair Kit", "Blind Spot Mirrors"],
      weightRange: [0.03, 2.5],
      priceRange: [0.9, 80],
      suppliers: ["Wenzhou AutoParts", "Ningbo DriveTech", "Shenzhen CarSmart", "Dongguan PlasticMolding", "Yongkang Tools"]
    },
    "Toys & Games": {
      nouns: ["Wooden Building Blocks", "Magnetic Tiles Set", "Rubiks Speed Cube", "Fidget Sensory Toy", "Adult Coloring Books", "Tabletop Board Game", "Card Game Deck", "Chess & Checkers Set", "Fossil Dig Kit", "Slime Making Kit"],
      weightRange: [0.1, 2.0],
      priceRange: [1.0, 45],
      suppliers: ["Shantou ToyFactory", "Yiwu PlayZone", "Yunhe WoodenToys", "Dongguan VinylFigures", "Ningbo Gamecraft"]
    }
  };

  const CERTIFICATIONS_POOL = [
    ["CE", "RoHS", "FCC"],
    ["ISO9001", "CE"],
    ["FDA Approved", "CE"],
    ["FSC", "REACH"],
    ["UL", "FCC", "RoHS"],
    ["ISO14001", "CE"],
    ["CE", "RoHS", "REACH"]
  ];

  const targetCount = 20000;
  let currentCount = B2B_CATALOG.length;
  let idCounter = 1;

  while (currentCount < targetCount) {
    const catIdx = idCounter % CATEGORIES.length;
    const category = CATEGORIES[catIdx];
    const catData = PRODUCTS_BY_CAT[category];
    
    const adjIdx = (idCounter * 7) % ADJECTIVES.length;
    const adjective = ADJECTIVES[adjIdx];
    
    const nounIdx = (idCounter * 13) % catData.nouns.length;
    const noun = catData.nouns[nounIdx];
    
    const name = `${adjective} ${noun} (Model V${100 + (idCounter % 900)})`;
    const catPrefix = category.slice(0, 3).toUpperCase();
    const sku = `${catPrefix}-${adjective.slice(0, 4).toUpperCase()}-${10000 + idCounter}`;
    
    const minPrice = catData.priceRange[0];
    const maxPrice = catData.priceRange[1];
    const priceDelta = maxPrice - minPrice;
    const factoryPrice = Number((minPrice + ((idCounter * 17) % 100) / 100 * priceDelta).toFixed(2));
    const retailPrice = Number((factoryPrice * (1.8 + ((idCounter * 3) % 15) / 10)).toFixed(2));
    
    const minW = catData.weightRange[0];
    const maxW = catData.weightRange[1];
    const wDelta = maxW - minW;
    const weightKg = Number((minW + ((idCounter * 23) % 100) / 100 * wDelta).toFixed(2));
    
    const suppIdx = (idCounter * 31) % catData.suppliers.length;
    const supplier = catData.suppliers[suppIdx];
    
    const supplierTrust = 80 + (idCounter * 3) % 20;
    const supplierYears = 2 + (idCounter * 7) % 14;
    
    const certIdx = (idCounter * 37) % CERTIFICATIONS_POOL.length;
    const certifications = CERTIFICATIONS_POOL[certIdx];
    
    const leadTimeDays = 10 + (idCounter * 9) % 31;
    const description = `Direct wholesale source for highly requested ${adjective.toLowerCase()} ${noun.toLowerCase()} from top factory partners. Exceptional high-demand world-market commodity featuring premium ${certifications.join("/")} grade specifications.`;

    B2B_CATALOG.push({
      sku,
      name,
      category,
      retailPrice,
      factoryPrice,
      weightKg,
      supplier,
      supplierTrust,
      supplierYears,
      certifications,
      leadTimeDays,
      description
    });
    
    currentCount++;
    idCounter++;
  }
  console.log(`Successfully compiled and generated ${B2B_CATALOG.length} high-demand B2B catalog items programmatically!`);
})();

// Mock database for CRM/Negotiations in memory
let negotiationOffers = [
  {
    id: "neg_1",
    sku: "FUR-ERGO-001",
    productName: "Premium Ergonomic Office Chair",
    factoryPrice: 75.00,
    retailPrice: 299.00,
    proposedPrice: 65.00, // 86.6% -> approved
    status: "accepted",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    customerEmail: "john@chairworld.com",
    landedCost: 81.38,
    marginSimulated: 45
  },
  {
    id: "neg_2",
    sku: "ELE-PWR-003",
    productName: "Ultra-thin Power Bank 10000mAh",
    factoryPrice: 8.50,
    retailPrice: 39.99,
    proposedPrice: 6.80, // 80% -> pending
    status: "pending",
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    customerEmail: "techgoods@b2bhub.net",
    landedCost: 9.32,
    marginSimulated: 55
  }
];

// Mock Database of Registered Users and Payment Logs
interface RegisteredUser {
  email: string;
  name: string;
  company: string;
  phone: string;
  passwordHash: string;
  isEmailVerified: boolean;
  verificationCode: string;
  isPaid: boolean;
  planSelected?: string;
  paymentAmount?: number;
  paymentCardLast4?: string;
  regDate: string;
  isDeputyAdmin?: boolean;
}

let REGISTERED_USERS: RegisteredUser[] = [
  {
    email: "kolev.tihomir@gmail.com",
    name: "Tihomir Kolev",
    company: "ProcureOS Admin",
    phone: "+359888123456",
    passwordHash: "303094Thk@@@",
    isEmailVerified: true,
    verificationCode: "123456",
    isPaid: true,
    planSelected: "Enterprise Freight Logistics Hub",
    paymentAmount: 149,
    paymentCardLast4: "4242",
    regDate: "2026-06-28T12:00:00.000Z"
  },
  {
    email: "client@test.com",
    name: "Ivan Petrov",
    company: "Petrov Imports Ltd",
    phone: "+359899111222",
    passwordHash: "client123",
    isEmailVerified: true,
    verificationCode: "654321",
    isPaid: false,
    planSelected: "B2B Essential Sourcing",
    paymentAmount: 49,
    paymentCardLast4: "1111",
    regDate: "2026-06-29T15:30:00.000Z"
  }
];

// Calculation utility for landed cost
// To represent automatic calculations:
// Clustered transport: 5% of factory price
// Insurance: 1%
// Customs/Mita: 2%
// Processing fee: 1.5 EUR (simulated as $1.65 USD or just 1.5 in calculations)
function calculateLandedCost(factoryPrice: number): number {
  const transport = factoryPrice * 0.05;
  const insurance = factoryPrice * 0.01;
  const customs = factoryPrice * 0.02;
  const processing = 1.65; // Approx 1.5 EUR in USD
  return Number((factoryPrice + transport + insurance + customs + processing).toFixed(2));
}

// 1. API: List products
app.get("/api/products", (req, res) => {
  res.json(B2B_CATALOG.map(p => ({
    ...p,
    landedCost: calculateLandedCost(p.factoryPrice)
  })));
});

// API: Create new product
app.post("/api/products", (req, res) => {
  const { sku, name, category, retailPrice, factoryPrice, weightKg, supplier, supplierTrust, supplierYears, certifications, leadTimeDays, description } = req.body;
  if (!sku || !name || !factoryPrice) {
    return res.status(400).json({ error: "SKU, Name and Factory price are required." });
  }

  const exists = B2B_CATALOG.some(p => p.sku === sku);
  if (exists) {
    return res.status(400).json({ error: `Product with SKU "${sku}" already exists.` });
  }

  const newProduct = {
    sku,
    name,
    category: category || "General",
    retailPrice: Number(retailPrice) || Number(factoryPrice) * 3,
    factoryPrice: Number(factoryPrice),
    weightKg: Number(weightKg) || 1,
    supplier: supplier || "Unknown Supplier",
    supplierTrust: Number(supplierTrust) || 90,
    supplierYears: Number(supplierYears) || 1,
    certifications: certifications || ["CE"],
    leadTimeDays: Number(leadTimeDays) || 15,
    description: description || ""
  };

  B2B_CATALOG.push(newProduct);
  res.status(201).json({ ...newProduct, landedCost: calculateLandedCost(newProduct.factoryPrice) });
});

// API: Delete product
app.delete("/api/products/:sku", (req, res) => {
  const { sku } = req.params;
  const index = B2B_CATALOG.findIndex(p => p.sku === sku);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found." });
  }
  B2B_CATALOG.splice(index, 1);
  res.json({ success: true, message: `Product with SKU "${sku}" was deleted.` });
});

// API: Edit product
app.put("/api/products/:sku", (req, res) => {
  const { sku } = req.params;
  const product = B2B_CATALOG.find(p => p.sku === sku);
  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }

  const { name, category, retailPrice, factoryPrice, weightKg, supplier, supplierTrust, supplierYears, certifications, leadTimeDays, description } = req.body;
  
  if (name) product.name = name;
  if (category) product.category = category;
  if (retailPrice !== undefined) product.retailPrice = Number(retailPrice);
  if (factoryPrice !== undefined) product.factoryPrice = Number(factoryPrice);
  if (weightKg !== undefined) product.weightKg = Number(weightKg);
  if (supplier) product.supplier = supplier;
  if (supplierTrust !== undefined) product.supplierTrust = Number(supplierTrust);
  if (supplierYears !== undefined) product.supplierYears = Number(supplierYears);
  if (certifications) product.certifications = certifications;
  if (leadTimeDays !== undefined) product.leadTimeDays = Number(leadTimeDays);
  if (description !== undefined) product.description = description;

  res.json({ ...product, landedCost: calculateLandedCost(product.factoryPrice) });
});

// API: Bulk upload products (JSON format parsed from CSV or client)
app.post("/api/products/bulk", (req, res) => {
  const { products } = req.body;
  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ error: "Invalid products list provided. Expected an array." });
  }

  let insertedCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  products.forEach((p, idx) => {
    const sku = p.sku ? String(p.sku).trim() : "";
    const name = p.name ? String(p.name).trim() : "";
    const factoryPrice = p.factoryPrice !== undefined && p.factoryPrice !== "" ? Number(p.factoryPrice) : null;

    if (!sku || !name) {
      errors.push(`Row ${idx + 1}: SKU and Name are required fields.`);
      return;
    }
    if (factoryPrice === null || isNaN(factoryPrice)) {
      errors.push(`Row ${idx + 1} ("${name || "Unnamed"}"): Factory Price is missing or invalid.`);
      return;
    }

    const index = B2B_CATALOG.findIndex(item => item.sku === sku);

    // Certifications field conversion: could be string, array or undefined
    let certs: string[] = ["CE"];
    if (p.certifications) {
      if (Array.isArray(p.certifications)) {
        certs = p.certifications.map(c => String(c).trim());
      } else if (typeof p.certifications === "string") {
        certs = p.certifications.split(",").map(c => c.trim()).filter(Boolean);
      }
    }

    const productData = {
      sku,
      name,
      category: p.category ? String(p.category).trim() : "General",
      retailPrice: p.retailPrice !== undefined && p.retailPrice !== "" && !isNaN(Number(p.retailPrice)) ? Number(p.retailPrice) : Number(factoryPrice) * 3,
      factoryPrice: Number(factoryPrice),
      weightKg: p.weightKg !== undefined && p.weightKg !== "" && !isNaN(Number(p.weightKg)) ? Number(p.weightKg) : 1,
      supplier: p.supplier ? String(p.supplier).trim() : "Unknown Supplier",
      supplierTrust: p.supplierTrust !== undefined && p.supplierTrust !== "" && !isNaN(Number(p.supplierTrust)) ? Number(p.supplierTrust) : 90,
      supplierYears: p.supplierYears !== undefined && p.supplierYears !== "" && !isNaN(Number(p.supplierYears)) ? Number(p.supplierYears) : 1,
      certifications: certs,
      leadTimeDays: p.leadTimeDays !== undefined && p.leadTimeDays !== "" && !isNaN(Number(p.leadTimeDays)) ? Number(p.leadTimeDays) : 15,
      description: p.description ? String(p.description).trim() : ""
    };

    if (index !== -1) {
      B2B_CATALOG[index] = productData;
      updatedCount++;
    } else {
      B2B_CATALOG.push(productData);
      insertedCount++;
    }
  });

  res.json({
    success: true,
    insertedCount,
    updatedCount,
    totalCount: insertedCount + updatedCount,
    errors
  });
});

// API: Global Supplier Search (uses Gemini with Google Search grounding)
app.post("/api/global-search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Search query is required." });
    }

    const systemInstruction = `You are a B2B sourcing search bot. 
Find 10 different actual global wholesale suppliers or product variations for the user's query: "${query}".
Search the live web for real B2B products and wholesale suppliers (like Alibaba, Global Sources, ThomasNet, Europages, or local factories).

For EACH of the 10 results, provide:
1. Product name (specific, e.g. "Wholesale Organic Bamboo Toothbrush Pack of 10")
2. Supplier Name (e.g. "Zhejiang Bamboo Co.")
3. Unit Price in USD (must be a realistic number)
4. Total price for 10 units in USD (Price for 10 units = unit price * 10)
5. Delivery time in days (e.g., 10, 15, 25, 30)
6. Shipping method (e.g., "Air Express", "Sea Freight", "Express Mail")
7. Origin country (e.g. "China", "India", "Germany", "Poland", "Bulgaria")
8. Source website/URL or search reference (e.g. https://alibaba.com)
9. Brief product description / wholesale notes in English.

Return ONLY a valid JSON array of objects conforming to the response schema. 
Do NOT include any markdown code blocks, backticks, or comments. Just raw JSON string.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Search globally for 10 wholesale products/variants for: "${query}". Return the 10 cheapest variants. Price them realistically.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              productName: { type: Type.STRING },
              supplier: { type: Type.STRING },
              unitPriceUsd: { type: Type.NUMBER },
              tenUnitsPriceUsd: { type: Type.NUMBER },
              deliveryTimeDays: { type: Type.INTEGER },
              shippingMethod: { type: Type.STRING },
              country: { type: Type.STRING },
              sourceUrl: { type: Type.STRING },
              descriptionBg: { type: Type.STRING },
            },
            required: ["id", "productName", "supplier", "unitPriceUsd", "tenUnitsPriceUsd", "deliveryTimeDays", "shippingMethod", "country", "sourceUrl", "descriptionBg"]
          }
        }
      },
    });

    let jsonText = response.text || "[]";
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(jsonText);
    
    if (Array.isArray(parsed)) {
      // Sort by unitPriceUsd ascending (cheapest first) to guarantee the cheapest 10 items are returned
      parsed.sort((a, b) => (a.unitPriceUsd || 0) - (b.unitPriceUsd || 0));
      res.json({ results: parsed.slice(0, 10), grounding: response.candidates?.[0]?.groundingMetadata || null });
    } else {
      throw new Error("Response is not an array");
    }

  } catch (err: any) {
    console.error("Global search error:", err);
    const mockQuery = req.body.query || "Product";
    const fallbacks = Array.from({ length: 10 }).map((_, i) => {
      const unitPrice = Number((1.5 + i * 2.3).toFixed(2));
      return {
        id: String(i + 1),
        productName: `Wholesale ${mockQuery} Variant ${i + 1}`,
        supplier: `Global Supplier ${String.fromCharCode(65 + i)} Ltd.`,
        unitPriceUsd: unitPrice,
        tenUnitsPriceUsd: Number((unitPrice * 10).toFixed(2)),
        deliveryTimeDays: 10 + i * 3,
        shippingMethod: i % 2 === 0 ? "Air Express" : "Sea Freight",
        country: ["China", "India", "Vietnam", "Turkey", "Poland", "Germany", "Bulgaria"][i % 7],
        sourceUrl: "https://www.alibaba.com",
        descriptionBg: `Robust wholesale model for bulk batches of ${mockQuery} with excellent technical specifications and rapid processing.`
      };
    });
    res.json({ results: fallbacks, isFallback: true, error: err.message });
  }
});

// 2. API: AI Sourcing Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Ground Gemini with B2B knowledge and our catalog so it doesn't hallucinate pricing
    const systemPrompt = `You are ProcureOS Sourcing Assistant, an expert AI specialized in B2B importing, supply chain optimization, and margin calculations.
Your primary audience are online store owners and importers.
You have access to our direct catalog of wholesale factory products:
${JSON.stringify(B2B_CATALOG, null, 2)}

For any pricing queries, calculate landed cost by adding "invisible" fees:
- Transport/Mita: 5% of factory price
- Insurance: 1%
- Customs: 2%
- Fixed handling: $1.65 (approx 1.5 EUR)
Formula: Landed Cost = Factory Price * 1.08 + 1.65

Guide users gracefully, write professional responses in English, and use structured bullet points if helpful. Keep answers highly informative, focusing on helping them maximize profit margins. Since the frontend uses automatic Google Translate, your responses MUST be entirely in English so they can be translated automatically. Use clear English terminology like "Landed Cost", "Margin", "Supplier Trust Score".
Provide numerical calculations to prove your reliability. Let's optimize their operations.`;

    const chatSession = [];
    // Convert history
    for (const turn of history) {
      chatSession.push({
        role: turn.role === "user" ? "user" : "model",
        parts: [{ text: turn.content }]
      });
    }
    chatSession.push({
      role: "user",
      parts: [{ text: message }]
    });

    let aiResponseText = "";
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatSession,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });
      aiResponseText = response.text || "I cannot generate a response at this moment.";
    } else {
      // High-quality mock simulation when API key is missing
      const query = message.toLowerCase();
      if (query.includes("chair") || query.includes("chair") || query.includes("ergo")) {
        aiResponseText = `**ProcureOS Sourcing Agent [Simulation Mode]**

I found a manufacturer factory for **Premium Ergonomic Office Chair (FUR-ERGO-001)**:
*   **Direct Factory Price:** $75.00
*   **Supplier Trust Rating:** 95/100 (Shenzhen Ergonomics Ltd, 8 years on the market)
*   **Certifications:** ISO9001, CE, BIFMA

**Landed Cost Calculation (Hidden Fees Breakdown):**
- Freight/Transport (5%): $3.75
- Logistics Insurance (1%): $0.75
- Customs Duty (2%): $1.50
- Fixed Handling (1.5 EUR): $1.65
- **Final Landed Cost:** **$82.65** (compared to $299.00 retail!)

**Margin Simulator:**
If you sell this chair at the recommended retail price of **$299.00**:
*   **Net Profit per unit:** **$216.35**
*   **Your Net Margin:** **72.3%**

I can prepare an auto-negotiation contract or extract details from a proforma invoice if you upload one!`;
      } else if (query.includes("power") || query.includes("battery") || query.includes("pwr")) {
        aiResponseText = `**ProcureOS Sourcing Agent [Simulation Mode]**

Here is the sourcing data for **Ultra-thin Power Bank 10000mAh (ELE-PWR-003)**:
*   **Factory Price:** $8.50
*   **Supplier:** Guangdong WattPower Corp (Trust Rating 92/100)
*   **Lead Time:** 20 days

**Landed Cost Calculation:**
- Factory Price: $8.50
- Freight + Duties + Handling (8% + $1.65): $0.68 + $0.17 + $1.65 = $2.50
- **Landed Cost:** **$11.00**

If you sell it for **$39.99** retail, your margin is **72.5%**! Would you like to start a batch negotiation procedure?`;
      } else {
        aiResponseText = `Hello! I am your **ProcureOS AI Sourcing Assistant**. 

I can help you scan the global market for products and automatically calculate all hidden costs (freight, duties, processing fees) so you understand your real net profit margin.

**Catalog Examples:**
1. **Premium Ergonomic Office Chair** (Factory: $75 | Retail: $299)
2. **Ultra-thin Power Bank 10000mAh** (Factory: $8.50 | Retail: $39.99)
3. **Noise Cancelling Wireless Headphones** (Factory: $38.00 | Retail: $189.99)

*Type a product name to calculate Landed Cost and Margin, or drag a proforma invoice into the OCR Module!*`;
      }
    }

    res.json({ text: aiResponseText });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "An error occurred while connecting to Gemini AI." });
  }
});

// 3. API: Negotiation Submission
app.post("/api/negotiate", async (req, res) => {
  const { sku, proposedPrice, customerEmail, marginSimulated } = req.body;

  const product = B2B_CATALOG.find(p => p.sku === sku);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const factoryPrice = product.factoryPrice;
  const ratio = proposedPrice / factoryPrice;
  const landedCost = calculateLandedCost(proposedPrice);

  let status: "accepted" | "pending" | "rejected" = "pending";
  let message = "";
  let emailSentSimulation = "";

  // Negotiation Logic: Fast-Track Auto-Approve if offer >= 85% of factory base price
  if (ratio >= 0.85) {
    status = "accepted";
    message = `Deal auto-approved! Proposed price of $${proposedPrice} is above the 85% limit ($${(factoryPrice * 0.85).toFixed(2)}) of the base factory price.`;
    emailSentSimulation = `
    FROM: noreply@procureos.com
    TO: ${customerEmail || "client@importstore.com"}
    SUBJECT: [ProcureOS] Your B2B Sourcing Offer is Approved!

    Hello,

    We are pleased to inform you that your offer for "${product.name}" at $${proposedPrice} per unit has been auto-approved by our system.

    Details:
    - Product: ${product.name} (SKU: ${product.sku})
    - Base Factory Price: $${factoryPrice}
    - Your Approved Price: $${proposedPrice}
    - Landed Cost: $${landedCost}
    
    You can now download your contract from the platform and import it directly into your Odoo/SAP ERP systems.
    
    Best regards,
    ProcureOS Sourcing Agent
    `;
  } else {
    status = "pending";
    message = `Proposed price of $${proposedPrice} is below the 85% base limit ($${(factoryPrice * 0.85).toFixed(2)}). Offer forwarded to human review.`;
    emailSentSimulation = `
    [Local Email Simulation - Pending Status]
    Offer for "${product.name}" at $${proposedPrice} requires manual Human-in-the-loop approval. The admin has been notified.
    `;
  }

  const newOffer = {
    id: "neg_" + Math.random().toString(36).substr(2, 9),
    sku,
    productName: product.name,
    factoryPrice,
    retailPrice: product.retailPrice,
    proposedPrice,
    status,
    timestamp: new Date().toISOString(),
    customerEmail: customerEmail || "client@importstore.com",
    landedCost,
    marginSimulated: marginSimulated || 30
  };

  negotiationOffers.unshift(newOffer);

  // --- Real-world Integrations ---
  const webhookResult = await triggerSupplierWebhook("NEW_NEGOTIATION_SUBMITTED", {
    offer: newOffer,
    product: {
      sku: product.sku,
      name: product.name,
      supplier: product.supplier,
      factoryPrice: product.factoryPrice
    }
  });

  const emailHtml = `
    <div style="font-family: sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
      <h2 style="color: #0369a1; margin-bottom: 8px; font-weight: 800;">B2B Sourcing Proposal Received</h2>
      <p style="font-size: 13px; color: #475569; line-height: 1.5;">Hello,</p>
      <p style="font-size: 13px; color: #475569; line-height: 1.5;">A new sourcing proposal has been logged on the ProcureOS B2B network:</p>
      
      <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 12px; color: #334155;">
        <div style="margin-bottom: 6px;"><b>Product Name:</b> ${product.name}</div>
        <div style="margin-bottom: 6px;"><b>SKU / Code:</b> ${sku}</div>
        <div style="margin-bottom: 6px;"><b>Direct Base Price:</b> $${factoryPrice} USD</div>
        <div style="margin-bottom: 6px;"><b>Proposed Offer Price:</b> <span style="color: #0284c7; font-weight: bold;">$${proposedPrice} USD</span></div>
        <div style="margin-bottom: 6px;"><b>Calculated Landed Cost:</b> $${landedCost} USD</div>
        <div style="margin-bottom: 6px;"><b>Current Gateway Status:</b> <span style="font-weight: bold; text-transform: uppercase;">${status}</span></div>
        <div><b>Buyer Link Email:</b> ${newOffer.customerEmail}</div>
      </div>
      
      <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">ProcureOS Secure Supplier API Gateway has logged this transaction live. All system counters are in sync.</p>
    </div>
  `;

  const emailResult = await sendRealEmail(
    newOffer.customerEmail,
    `[ProcureOS] Sourcing Proposal for ${product.name} - Status: ${status.toUpperCase()}`,
    emailHtml
  );

  res.json({
    offer: newOffer,
    message,
    emailSentSimulation,
    ratio: Number((ratio * 100).toFixed(1)),
    liveIntegration: {
      webhook: webhookResult,
      email: emailResult
    }
  });
});

// 4. API: Admin get all offers
app.get("/api/admin/offers", (req, res) => {
  res.json(negotiationOffers);
});

// 5. API: Admin resolve pending offer
app.post("/api/admin/resolve", async (req, res) => {
  const { id, action, counterPrice } = req.body; // action: 'accepted' | 'rejected' | 'counter'
  const offer = negotiationOffers.find(o => o.id === id);

  if (!offer) {
    return res.status(404).json({ error: "Offer not found" });
  }

  if (action === "accepted") {
    offer.status = "accepted";
  } else if (action === "rejected") {
    offer.status = "rejected";
  } else if (action === "counter") {
    offer.status = "accepted"; // Represent counter-offer acceptance
    offer.proposedPrice = counterPrice || offer.proposedPrice;
    offer.landedCost = calculateLandedCost(offer.proposedPrice);
  }

  // --- Real-world Integrations ---
  const webhookResult = await triggerSupplierWebhook("NEGOTIATION_RESOLVED", {
    offerId: offer.id,
    sku: offer.sku,
    productName: offer.productName,
    finalPrice: offer.proposedPrice,
    status: offer.status,
    customerEmail: offer.customerEmail,
    landedCost: offer.landedCost
  });

  const emailHtml = `
    <div style="font-family: sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
      <h2 style="color: #0284c7; margin-bottom: 8px; font-weight: 800;">ProcureOS B2B Offer Status Update</h2>
      <p style="font-size: 13px; color: #475569; line-height: 1.5;">Hello,</p>
      <p style="font-size: 13px; color: #475569; line-height: 1.5;">Your active B2B sourcing proposal has been manually reviewed and resolved by the administrator:</p>
      
      <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 12px; color: #334155;">
        <div style="margin-bottom: 6px;"><b>Product Name:</b> ${offer.productName}</div>
        <div style="margin-bottom: 6px;"><b>SKU / Code:</b> ${offer.sku}</div>
        <div style="margin-bottom: 6px;"><b>Sourcing Status:</b> <span style="font-weight: 800; color: ${offer.status === "accepted" ? "#10b981" : "#ef4444"}; text-transform: uppercase;">${offer.status.toUpperCase()}</span></div>
        <div style="margin-bottom: 6px;"><b>Final Sourcing Price:</b> <span style="font-weight: bold; color: #0284c7;">$${offer.proposedPrice} USD</span> per unit</div>
        <div><b>Final Landed Cost:</b> $${offer.landedCost} USD</div>
      </div>
      
      <p style="font-size: 12px; color: #475569; line-height: 1.5;">You can now view this deal in your sourcing manager dashboard and download the finalized contract terms.</p>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">ProcureOS Gateway ERP Sync: <b>Active</b> • Supplier Live Channel: <b>Online</b></p>
    </div>
  `;

  const emailResult = await sendRealEmail(
    offer.customerEmail,
    `[ProcureOS] B2B Sourcing Deal Resolution: ${offer.productName} is ${offer.status.toUpperCase()}`,
    emailHtml
  );

  res.json({
    success: true,
    offer,
    emailSimulation: `
    FROM: admin@procureos.com
    TO: ${offer.customerEmail}
    SUBJECT: [ProcureOS Admin] Status Update on your B2B Sourcing Offer

    Hello,

    Your B2B offer for "${offer.productName}" was manually reviewed by our sourcing administrator.
    Status: ${action.toUpperCase()}
    ${action === "counter" ? `New Negotiated Price: $${counterPrice}` : `Price per Unit: $${offer.proposedPrice}`}
    
    Thank you for negotiating with us!
    `,
    liveIntegration: {
      webhook: webhookResult,
      email: emailResult
    }
  });
});

// 6. API: Simulated Document OCR PDF Parser using Gemini
app.post("/api/ocr", async (req, res) => {
  try {
    const { fileBase64, fileName, fileText } = req.body;

    // Use Gemini to parse PDF text or image proforma invoice if possible, otherwise mock it with great detail
    let extractedData = {
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

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && fileText) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Extract structured fields from the following proforma invoice text. Return ONLY a valid JSON object matching the exact schema:
        {
          "vendor": "Supplier Name",
          "invoiceNumber": "Invoice Reference",
          "date": "Date YYYY-MM-DD",
          "items": [
            { "sku": "Item Code/SKU", "description": "Item Description", "quantity": 100, "unitPrice": 12.50, "total": 1250 }
          ],
          "subtotal": 1250,
          "shippingEstimate": 50,
          "totalAmount": 1300
        }

        Invoice Text:
        ${fileText}`,
        config: {
          responseMimeType: "application/json"
        }
      });

      try {
        if (response.text) {
          extractedData = JSON.parse(response.text.trim());
        }
      } catch (jsonErr) {
        console.error("Failed to parse Gemini OCR response", jsonErr);
      }
    }

    res.json({
      success: true,
      fileName: fileName || "proforma_invoice.pdf",
      data: extractedData
    });
  } catch (error) {
    console.error("OCR Error:", error);
    res.status(500).json({ error: "Failed to extract structured data from document." });
  }
});

// 7. API: CSV Export of Negotiated Offers
app.get("/api/export", (req, res) => {
  let csvContent = "ID,SKU,Product Name,Factory Price,Proposed Price,Landed Cost,Margin Simulated,Customer Email,Status,Timestamp\n";
  negotiationOffers.forEach(o => {
    csvContent += `"${o.id}","${o.sku}","${o.productName}",${o.factoryPrice},${o.proposedPrice},${o.landedCost},${o.marginSimulated},"${o.customerEmail}","${o.status}","${o.timestamp}"\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=procureos_negotiated_deals.csv");
  res.status(200).send(csvContent);
});

// 8. API: Live Supplier & SMTP Integration Configurations
app.get("/api/supplier/config", (req, res) => {
  res.json({
    webhookUrl: SUPPLIER_INTEGRATION_SETTINGS.webhookUrl,
    webhookEnabled: SUPPLIER_INTEGRATION_SETTINGS.webhookEnabled,
    smtpHost: SUPPLIER_INTEGRATION_SETTINGS.smtpHost,
    smtpPort: SUPPLIER_INTEGRATION_SETTINGS.smtpPort,
    smtpUser: SUPPLIER_INTEGRATION_SETTINGS.smtpUser,
    smtpPass: SUPPLIER_INTEGRATION_SETTINGS.smtpPass ? "••••••••" : "", // Mask password
    smtpFrom: SUPPLIER_INTEGRATION_SETTINGS.smtpFrom,
    smtpEnabled: SUPPLIER_INTEGRATION_SETTINGS.smtpEnabled,
    maskSupplierInfo: SUPPLIER_INTEGRATION_SETTINGS.maskSupplierInfo,
    escrowEnabled: SUPPLIER_INTEGRATION_SETTINGS.escrowEnabled
  });
});

app.post("/api/supplier/config", (req, res) => {
  const { webhookUrl, webhookEnabled, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpEnabled, maskSupplierInfo, escrowEnabled } = req.body;
  
  SUPPLIER_INTEGRATION_SETTINGS.webhookUrl = webhookUrl !== undefined ? webhookUrl : SUPPLIER_INTEGRATION_SETTINGS.webhookUrl;
  SUPPLIER_INTEGRATION_SETTINGS.webhookEnabled = webhookEnabled !== undefined ? !!webhookEnabled : SUPPLIER_INTEGRATION_SETTINGS.webhookEnabled;
  SUPPLIER_INTEGRATION_SETTINGS.smtpHost = smtpHost !== undefined ? smtpHost : SUPPLIER_INTEGRATION_SETTINGS.smtpHost;
  SUPPLIER_INTEGRATION_SETTINGS.smtpPort = smtpPort !== undefined ? parseInt(smtpPort) : SUPPLIER_INTEGRATION_SETTINGS.smtpPort;
  SUPPLIER_INTEGRATION_SETTINGS.smtpUser = smtpUser !== undefined ? smtpUser : SUPPLIER_INTEGRATION_SETTINGS.smtpUser;
  
  if (smtpPass !== undefined && smtpPass !== "••••••••") {
    SUPPLIER_INTEGRATION_SETTINGS.smtpPass = smtpPass;
  }
  
  SUPPLIER_INTEGRATION_SETTINGS.smtpFrom = smtpFrom !== undefined ? smtpFrom : SUPPLIER_INTEGRATION_SETTINGS.smtpFrom;
  SUPPLIER_INTEGRATION_SETTINGS.smtpEnabled = smtpEnabled !== undefined ? !!smtpEnabled : SUPPLIER_INTEGRATION_SETTINGS.smtpEnabled;
  
  if (maskSupplierInfo !== undefined) SUPPLIER_INTEGRATION_SETTINGS.maskSupplierInfo = !!maskSupplierInfo;
  if (escrowEnabled !== undefined) SUPPLIER_INTEGRATION_SETTINGS.escrowEnabled = !!escrowEnabled;
  
  res.json({ success: true, message: "Supplier Integration Settings updated dynamically!" });
});

app.post("/api/supplier/test-webhook", async (req, res) => {
  const payload = {
    test: true,
    message: "This is a real-time integration test ping from ProcureOS Gateway.",
    clientEmail: "kolev.tihomir@gmail.com",
    sampleOffer: {
      sku: "FUR-ERGO-001",
      name: "Premium Ergonomic Office Chair",
      targetPrice: 65.00,
      timestamp: new Date().toISOString()
    }
  };
  
  const result = await triggerSupplierWebhook("INTEGRATION_TEST_PING", payload);
  res.json(result);
});

app.post("/api/supplier/test-email", async (req, res) => {
  const { testRecipient } = req.body;
  const recipient = testRecipient || SUPPLIER_INTEGRATION_SETTINGS.smtpFrom;
  
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; max-width: 600px;">
      <h2 style="color: #4f46e5; margin-bottom: 8px;">ProcureOS Secure Gateway Connection Verified</h2>
      <p style="font-size: 14px; line-height: 1.5;">This email confirms that your SMTP Mail Server has been successfully linked with <b>ProcureOS</b> and is ready to deliver B2B alerts and notifications directly.</p>
      <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 16px;">
        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Integration Status</span>
        <div style="font-size: 16px; font-weight: bold; color: #10b981; margin-top: 4px;">Active & Verified (Live Environment)</div>
      </div>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 24px;">This is an automated system check. Do not reply to this email.</p>
    </div>
  `;
  
  const result = await sendRealEmail(recipient, "ProcureOS Direct Mail Gateway Verification", htmlContent);
  res.json(result);
});

// Client Authentication & Payment Lifecycle APIs
app.post("/api/auth/register", (req, res) => {
  const { name, email, company, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const exists = REGISTERED_USERS.some(u => u.email === normalizedEmail);
  if (exists) {
    return res.status(400).json({ error: "User with this email already exists." });
  }

  // Generate a random 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser: RegisteredUser = {
    name,
    email: normalizedEmail,
    company: company || "",
    phone: phone || "",
    passwordHash: password, // Simple plain text for mock demo environment
    isEmailVerified: false,
    verificationCode,
    isPaid: false,
    regDate: new Date().toISOString()
  };

  REGISTERED_USERS.push(newUser);

  // Send real email alert asynchronously if SMTP is configured
  const emailHtml = `
    <div style="font-family: sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
      <h2 style="color: #0f172a; margin-bottom: 8px; font-weight: 800;">Welcome to ProcureOS Sourcing Portal</h2>
      <p style="font-size: 13px; line-height: 1.6; color: #475569;">Hello ${name},</p>
      <p style="font-size: 13px; line-height: 1.6; color: #475569;">Thank you for registering with us. To verify your partner profile and unlock your B2B sourcing analytics, please enter the following 6-digit security code:</p>
      <div style="background-color: #ffffff; padding: 20px; text-align: center; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
        <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Security Verification Code</span>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0284c7; margin-top: 8px; font-family: monospace;">${verificationCode}</div>
      </div>
      <p style="font-size: 11px; color: #94a3b8;">If you did not create a partner account with ProcureOS, you can safely ignore this automated message.</p>
    </div>
  `;
  sendRealEmail(newUser.email, "ProcureOS - Verify Your Partner Account", emailHtml).then((result) => {
    console.log("Real Registration Email Dispatch Log:", result.log);
  });

  res.status(201).json({
    success: true,
    message: "Registration successful. A 6-digit verification code has been generated.",
    verificationCode, // Sent back so front-end can simulate or display the notification safely
    email: newUser.email
  });
});

app.post("/api/auth/verify", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and verification code are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = REGISTERED_USERS.find(u => u.email === normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  if (user.verificationCode !== code.trim()) {
    return res.status(400).json({ error: "Invalid verification code." });
  }

  user.isEmailVerified = true;
  res.json({
    success: true,
    message: "Email successfully verified!",
    user: {
      name: user.name,
      email: user.email,
      company: user.company,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPaid: user.isPaid,
      planSelected: user.planSelected,
      isDeputyAdmin: user.isDeputyAdmin || false
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = REGISTERED_USERS.find(u => u.email === normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: "No user found with this email." });
  }

  if (user.passwordHash !== password) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  res.json({
    success: true,
    user: {
      name: user.name,
      email: user.email,
      company: user.company,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPaid: user.isPaid,
      planSelected: user.planSelected,
      isDeputyAdmin: user.isDeputyAdmin || false
    }
  });
});

app.post("/api/auth/forgot", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = REGISTERED_USERS.find(u => u.email === normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: "No user found with this email." });
  }

  // Generate a recovery code
  const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = recoveryCode; // Reuse the verification slot for resetting

  // Send actual email if SMTP configured
  const emailHtml = `
    <div style="font-family: sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
      <h2 style="color: #0f172a; margin-bottom: 8px; font-weight: 800;">Password Reset Request</h2>
      <p style="font-size: 13px; line-height: 1.6; color: #475569;">Hello ${user.name || "User"},</p>
      <p style="font-size: 13px; line-height: 1.6; color: #475569;">We received a request to reset your password for your ProcureOS partner account. Use the following security code to finalize your recovery:</p>
      <div style="background-color: #ffffff; padding: 20px; text-align: center; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
        <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Recovery Code</span>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0284c7; margin-top: 8px; font-family: monospace;">${recoveryCode}</div>
      </div>
      <p style="font-size: 11px; color: #94a3b8;">If you did not request a password reset, you can safely ignore this email. Your current password remains secure.</p>
    </div>
  `;
  sendRealEmail(user.email, "ProcureOS - Password Reset Request", emailHtml).then((result) => {
    console.log("Real Reset Password Email Dispatch Log:", result.log);
  });

  res.json({
    success: true,
    message: "Password recovery code generated successfully.",
    recoveryCode // Provided for testing
  });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Email, verification code, and new password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = REGISTERED_USERS.find(u => u.email === normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  if (user.verificationCode !== code.trim()) {
    return res.status(400).json({ error: "Invalid recovery code." });
  }

  user.passwordHash = newPassword;
  user.isEmailVerified = true; // Mark verified as they proved ownership
  res.json({
    success: true,
    message: "Password reset successfully! You can now log in."
  });
});

app.post("/api/auth/pay", (req, res) => {
  const { email, planName, amount, cardLast4 } = req.body;
  if (!email || !planName || !amount) {
    return res.status(400).json({ error: "Email, plan, and amount are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = REGISTERED_USERS.find(u => u.email === normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  user.isPaid = true;
  user.planSelected = planName;
  user.paymentAmount = Number(amount);
  user.paymentCardLast4 = cardLast4 || "4242";

  res.json({
    success: true,
    message: `Payment of €${amount} for ${planName} processed successfully. Welcome aboard!`,
    user: {
      name: user.name,
      email: user.email,
      company: user.company,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPaid: user.isPaid,
      planSelected: user.planSelected,
      isDeputyAdmin: user.isDeputyAdmin || false
    }
  });
});

// Admin-Only Route to audit all users and track payment statuses
app.get("/api/admin/users", (req, res) => {
  res.json(REGISTERED_USERS.map(u => ({
    name: u.name,
    email: u.email,
    company: u.company,
    phone: u.phone,
    isEmailVerified: u.isEmailVerified,
    isPaid: u.isPaid,
    planSelected: u.planSelected || "None",
    paymentAmount: u.paymentAmount || 0,
    paymentCardLast4: u.paymentCardLast4 || "N/A",
    regDate: u.regDate,
    isDeputyAdmin: u.isDeputyAdmin || false
  })));
});

// Admin-Only Route to toggle status for testing
app.post("/api/admin/toggle-user", (req, res) => {
  const { email, field } = req.body;
  if (!email || !field) {
    return res.status(400).json({ error: "Email and field are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = REGISTERED_USERS.find(u => u.email === normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  if (field === "isPaid") {
    user.isPaid = !user.isPaid;
    if (user.isPaid) {
      user.planSelected = "B2B Essential Sourcing";
      user.paymentAmount = 49;
      user.paymentCardLast4 = "9999";
    } else {
      user.planSelected = undefined;
      user.paymentAmount = undefined;
      user.paymentCardLast4 = undefined;
    }
  } else if (field === "isEmailVerified") {
    user.isEmailVerified = !user.isEmailVerified;
  } else if (field === "isDeputyAdmin") {
    user.isDeputyAdmin = !user.isDeputyAdmin;
  }

  res.json({
    success: true,
    message: `Updated ${field} status for ${user.email}`,
    user: {
      name: user.name,
      email: user.email,
      company: user.company,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPaid: user.isPaid,
      planSelected: user.planSelected,
      isDeputyAdmin: user.isDeputyAdmin || false
    }
  });
});

// Store paid subscription session IDs in memory for the demo/live active states
let activeSubscriptions = new Set<string>();

// Helper to get Stripe client safely
function getStripe() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && stripeKey !== "sk_test_..." && stripeKey.trim() !== "") {
    try {
      return new Stripe(stripeKey, {
        apiVersion: "2025-01-27.acacia" as any,
      });
    } catch (e) {
      console.error("Stripe initialization failed:", e);
    }
  }
  return null;
}

// 8. API: Create Stripe Checkout Session for Subscription ($49/month)
app.post("/api/stripe/create-checkout-session", async (req, res) => {
  try {
    const { email } = req.body;
    const stripe = getStripe();
    const referer = req.headers.referer || "http://localhost:3000/";

    if (stripe) {
      // Real Stripe subscription session creation (dynamic pricing to work out-of-the-box on any account)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: email || undefined,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "ProcureOS Pro Monthly Subscription",
                description: "Full access to VIP supply routes, unlimited AI-driven negotiations, OCR invoice extraction, and native ERP export.",
              },
              unit_amount: 4900, // $49.00 USD
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${referer}?session_id={CHECKOUT_SESSION_ID}&payment=success`,
        cancel_url: `${referer}?payment=cancel`,
      });

      res.json({ url: session.url, isReal: true });
    } else {
      // High-fidelity fallback simulated Stripe flow for sandbox previewing
      const mockSessionId = "mock_sub_" + Math.random().toString(36).substring(2, 15);
      const simulatedCheckoutUrl = `#/stripe-checkout-mock?session_id=${mockSessionId}&email=${encodeURIComponent(email || "")}`;
      res.json({ url: simulatedCheckoutUrl, isReal: false });
    }
  } catch (err: any) {
    console.error("Stripe Checkout Session Error:", err);
    res.status(500).json({ error: "An error occurred while creating the Stripe session: " + err.message });
  }
});

// 9. API: Verify Stripe Checkout Session Status
app.get("/api/stripe/verify-session", async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const sessionIdStr = session_id as string;

    if (sessionIdStr.startsWith("mock_sub_")) {
      activeSubscriptions.add(sessionIdStr);
      return res.json({ status: "complete", customer_email: "demo@procureos.com", plan: "Pro Monthly ($49)" });
    }

    const stripe = getStripe();
    if (stripe) {
      const session = await stripe.checkout.sessions.retrieve(sessionIdStr);
      if (session.payment_status === "paid" || session.status === "complete") {
        activeSubscriptions.add(sessionIdStr);
        return res.json({ 
          status: "complete", 
          customer_email: session.customer_details?.email || "subscriber@procureos.com",
          plan: "Pro Monthly ($49)"
        });
      }
      return res.json({ status: session.status, payment_status: session.payment_status });
    } else {
      return res.status(400).json({ error: "Stripe is not configured on the server, and session is not compatible." });
    }
  } catch (err: any) {
    console.error("Verify Stripe Session Error:", err);
    res.status(500).json({ error: "Session verification failed: " + err.message });
  }
});

// 10. API: Quick check of active subscription session IDs
app.get("/api/stripe/active-subscriptions", (req, res) => {
  res.json({ active_sessions: Array.from(activeSubscriptions) });
});

async function startServer() {
  // Mount Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ProcureOS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
