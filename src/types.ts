export interface B2BProduct {
  sku: string;
  name: string;
  category: string;
  retailPrice: number;
  factoryPrice: number;
  weightKg: number;
  supplier: string;
  supplierTrust: number; // 0 - 100
  supplierYears: number;
  certifications: string[];
  leadTimeDays: number;
  description: string;
  landedCost?: number;
}

export interface NegotiationOffer {
  id: string;
  sku: string;
  productName: string;
  factoryPrice: number;
  retailPrice: number;
  proposedPrice: number;
  status: "accepted" | "pending" | "rejected";
  timestamp: string;
  customerEmail: string;
  landedCost: number;
  marginSimulated: number;
}

export interface OCRItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OCRData {
  vendor: string;
  invoiceNumber: string;
  date: string;
  items: OCRItem[];
  subtotal: number;
  shippingEstimate: number;
  totalAmount: number;
}

export interface GlobalSearchItem {
  id: string;
  productName: string;
  supplier: string;
  unitPriceUsd: number;
  tenUnitsPriceUsd: number;
  deliveryTimeDays: number;
  shippingMethod: string;
  country: string;
  sourceUrl: string;
  descriptionBg: string;
}

