// High-quality carefully selected B2B stock images from Unsplash to match categories and product keywords
export const getProductImage = (sku: string, category: string, name: string): string => {
  const normName = name.toLowerCase();
  const normCat = category.toLowerCase();

  // 1. Check for specific common products
  if (normName.includes("chair") || normName.includes("стол")) {
    return "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80"; // Ergonomic chair
  }
  if (normName.includes("desk") || normName.includes("бюро")) {
    return "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80"; // Standing desk
  }
  if (normName.includes("toothbrush") || normName.includes("четка")) {
    return "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80"; // Bamboo toothbrush
  }
  if (normName.includes("earbuds") || normName.includes("слушалки") || normName.includes("headphone")) {
    return "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80"; // Wireless earbuds
  }
  if (normName.includes("watch") || normName.includes("часовник")) {
    return "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=600&q=80"; // Smartwatch
  }
  if (normName.includes("power bank") || normName.includes("батерия")) {
    return "https://images.unsplash.com/photo-1609592424109-dd7739502967?auto=format&fit=crop&w=600&q=80"; // Power bank
  }
  if (normName.includes("speaker") || normName.includes("колона")) {
    return "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80"; // Speaker
  }
  if (normName.includes("vase") || normName.includes("ваза")) {
    return "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=600&q=80"; // Minimalist vase
  }
  if (normName.includes("serum") || normName.includes("крем") || normName.includes("cream")) {
    return "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80"; // Face serum
  }
  if (normName.includes("lamp") || normName.includes("лампа") || normName.includes("light")) {
    return "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80"; // Desk lamp / LED strip
  }

  // 2. Fallbacks based on category
  switch (normCat) {
    case "electronics":
      return "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80"; // Gadgets
    case "furniture":
      return "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80"; // Minimal interior
    case "cosmetics":
      return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80"; // Beauty products
    case "decor":
      return "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80"; // Ceramic decor
    case "kitchenware":
      return "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80"; // Premium pans / chef knife
    case "sports & outdoors":
    case "sports":
      return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80"; // Dumbbells / bottle
    case "apparel":
      return "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80"; // Clothes hanger
    case "office supplies":
      return "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80"; // Notebook and pen
    case "automotive":
      return "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80"; // Sport car wheel / charger
    case "toys & games":
    case "toys":
      return "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=600&q=80"; // Wooden toys
    default:
      // Hash-based random beautiful product picture to make each item unique and lovely
      const hash = sku.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const images = [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80", // White smart watch
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80", // Yellow sunglasses
        "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80", // Leather shoes
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80", // Red sneaker
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"  // Headphones
      ];
      return images[hash % images.length];
  }
};
