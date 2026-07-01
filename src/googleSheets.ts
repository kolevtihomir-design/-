import { B2BProduct, NegotiationOffer } from "./types";

interface SyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}

// Create a new spreadsheet with separate sheets for Products, Negotiations, and Client Registrations
export const createSourcingSpreadsheet = async (
  accessToken: string,
  products: B2BProduct[],
  offers: NegotiationOffer[]
): Promise<SyncResult> => {
  try {
    const createResponse = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          title: "ProcureOS B2B Sourcing & Margins Ledger",
        },
        sheets: [
          {
            properties: {
              title: "B2B Product Catalog",
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
          {
            properties: {
              title: "Negotiations & Deals Ledger",
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
          {
            properties: {
              title: "Client Registrations & Payments",
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!createResponse.ok) {
      const errText = await createResponse.text();
      throw new Error(`Failed to create spreadsheet: ${errText}`);
    }

    const spreadsheet = await createResponse.json();
    const spreadsheetId = spreadsheet.spreadsheetId;
    const spreadsheetUrl = spreadsheet.spreadsheetUrl;

    // Save linked sheet in localStorage
    localStorage.setItem("procureos_linked_spreadsheet_id", spreadsheetId);
    localStorage.setItem("procureos_linked_spreadsheet_url", spreadsheetUrl);

    // Sync initial data immediately
    await syncSpreadsheetData(accessToken, spreadsheetId, products, offers);

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
    };
  } catch (error: any) {
    console.error("Error creating spreadsheet:", error);
    return {
      success: false,
      error: error.message || "Unknown error creating spreadsheet",
    };
  }
};

// Sync latest products, negotiations, and client registrations to the existing spreadsheet
export const syncSpreadsheetData = async (
  accessToken: string,
  spreadsheetId: string,
  products: B2BProduct[],
  offers: NegotiationOffer[]
): Promise<SyncResult> => {
  try {
    // 1. Prepare Product rows
    const productHeaders = [
      "SKU",
      "Product Name",
      "Category",
      "Factory Price ($)",
      "Landed Cost ($)",
      "Retail Price ($)",
      "Weight (kg)",
      "Supplier",
      "Supplier Trust (%)",
      "Lead Time (Days)",
      "Description"
    ];

    const productRows = products.map((p) => [
      p.sku,
      p.name,
      p.category,
      p.factoryPrice,
      p.landedCost || (p.factoryPrice * 1.08 + 1.65),
      p.retailPrice,
      p.weightKg,
      p.supplier,
      `${p.supplierTrust}%`,
      p.leadTimeDays,
      p.description
    ]);

    // 2. Prepare Negotiation Offers rows
    const offerHeaders = [
      "Deal ID",
      "SKU",
      "Product Name",
      "Factory Price ($)",
      "Proposed Price ($)",
      "Landed Cost ($)",
      "Margin Simulated (%)",
      "Profit per Unit ($)",
      "Customer Email",
      "Status",
      "Timestamp"
    ];

    const offerRows = offers.map((o) => {
      const profitPerUnit = o.retailPrice - o.landedCost;
      return [
        o.id,
        o.sku,
        o.productName,
        o.factoryPrice,
        o.proposedPrice,
        o.landedCost,
        `${o.marginSimulated}%`,
        profitPerUnit.toFixed(2),
        o.customerEmail,
        o.status.toUpperCase(),
        o.timestamp
      ];
    });

    // 3. Fetch Registered Clients and Payment statuses from the Express backend
    let clientRows: any[][] = [];
    const clientHeaders = [
      "Client Name",
      "Email Address",
      "Company Name",
      "Phone Number",
      "Email Verified",
      "Payment Status",
      "Active Subscription Plan",
      "Total Amount Paid (€)",
      "Payment Card (Last 4)",
      "Registration Date"
    ];

    try {
      const userRes = await fetch("/api/admin/users");
      if (userRes.ok) {
        const users = await userRes.json();
        clientRows = users.map((u: any) => [
          u.name,
          u.email,
          u.company,
          u.phone,
          u.isEmailVerified ? "YES" : "NO",
          u.isPaid ? "PAID" : "UNPAID",
          u.planSelected,
          u.paymentAmount,
          u.paymentCardLast4,
          u.regDate
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch registered clients for Sheets sync:", err);
    }

    // 4. Clear existing values and write new values in batch
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ranges: [
          "'B2B Product Catalog'!A1:Z1000",
          "'Negotiations & Deals Ledger'!A1:Z1000",
          "'Client Registrations & Payments'!A1:Z1000"
        ],
      }),
    });

    // 5. Batch update values
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valueInputOption: "USER_ENTERED",
          data: [
            {
              range: "'B2B Product Catalog'!A1",
              majorDimension: "ROWS",
              values: [productHeaders, ...productRows],
            },
            {
              range: "'Negotiations & Deals Ledger'!A1",
              majorDimension: "ROWS",
              values: [offerHeaders, ...offerRows],
            },
            {
              range: "'Client Registrations & Payments'!A1",
              majorDimension: "ROWS",
              values: [clientHeaders, ...clientRows],
            },
          ],
        }),
      }
    );

    if (!updateResponse.ok) {
      const errText = await updateResponse.text();
      throw new Error(`Failed to write values: ${errText}`);
    }

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl: localStorage.getItem("procureos_linked_spreadsheet_url") || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    };
  } catch (error: any) {
    console.error("Error syncing spreadsheet:", error);
    return {
      success: false,
      error: error.message || "Unknown error syncing spreadsheet",
    };
  }
};

// Import B2B products from the linked Google Sheet back into ProcureOS B2B Catalog
export const importProductsFromSpreadsheet = async (
  accessToken: string,
  spreadsheetId: string
): Promise<{ success: boolean; products?: B2BProduct[]; error?: string }> => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'B2B%20Product%20Catalog'!A2:K1000`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch spreadsheet values: ${errText}`);
    }

    const data = await response.json();
    const rows: string[][] = data.values || [];

    const products: B2BProduct[] = rows
      .filter((row) => row && row[0] && row[1]) // must have SKU and Name
      .map((row) => {
        // Clean up numeric inputs
        const factoryPrice = parseFloat(row[3]?.replace(/[$,\s]/g, "") || "0") || 0;
        const retailPrice = parseFloat(row[5]?.replace(/[$,\s]/g, "") || "0") || factoryPrice * 3;
        const weightKg = parseFloat(row[6]?.replace(/[kKgG\s]/g, "") || "1.0") || 1.0;
        const supplierTrust = parseInt(row[8]?.replace(/[%,\s]/g, "") || "90") || 90;
        const leadTimeDays = parseInt(row[9] || "15") || 15;

        return {
          sku: row[0].trim(),
          name: row[1].trim(),
          category: row[2]?.trim() || "General",
          factoryPrice,
          retailPrice,
          weightKg,
          supplier: row[7]?.trim() || "Imported Supplier",
          supplierTrust,
          supplierYears: 3, // default
          certifications: ["CE"],
          leadTimeDays,
          description: row[10]?.trim() || ""
        };
      });

    return {
      success: true,
      products,
    };
  } catch (error: any) {
    console.error("Error importing spreadsheet data:", error);
    return {
      success: false,
      error: error.message || "Unknown error during spreadsheet import",
    };
  }
};

