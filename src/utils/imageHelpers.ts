// Custom helper to retrieve high-quality robust Unsplash fallback images
export const getFallbackImage = (title: string, categoryId: string = "politics"): string => {
  const normTitle = (title || "news").toLowerCase();
  
  // High quality static categorized photography choices
  const presets: Record<string, string[]> = {
    politics: [
      "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800"
    ],
    opinion: [
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800"
    ],
    world: [
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800"
    ],
    tech: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800"
    ],
    business: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800"
    ],
    lifestyle: [
      "https://images.unsplash.com/photo-1490481651871-7ab68de25d43?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800"
    ]
  };

  // Check custom text keywords for extra accuracy
  if (normTitle.includes("israel") || normTitle.includes("lebanon") || normTitle.includes("strike") || normTitle.includes("war") || normTitle.includes("soldier")) {
    return "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800"; // newsroom/politics style
  }
  if (normTitle.includes("meloni") || normTitle.includes("trump") || normTitle.includes("g7") || normTitle.includes("president")) {
    return "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800"; // conference/press
  }
  if (normTitle.includes("cryptocurrency") || normTitle.includes("bitcoin") || normTitle.includes("crypto") || normTitle.includes("solana")) {
    return "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=800";
  }

  let normalizedCat = (categoryId || "politics").toLowerCase();
  if (normalizedCat === "us-politics" || normalizedCat === "world-politics") {
    normalizedCat = "politics";
  } else if (normalizedCat === "technology" || normalizedCat === "ai-robots" || normalizedCat === "gadgets" || normalizedCat === "tech") {
    normalizedCat = "tech";
  } else if (normalizedCat === "markets" || normalizedCat === "business") {
    normalizedCat = "business";
  } else if (normalizedCat === "style") {
    normalizedCat = "lifestyle";
  }

  const catKey = presets[normalizedCat] ? normalizedCat : "politics";
  const list = presets[catKey];
  
  // Stable hash representation
  let hash = 0;
  for (let i = 0; i < normTitle.length; i++) {
    hash = normTitle.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % list.length;
  
  return list[idx];
};
