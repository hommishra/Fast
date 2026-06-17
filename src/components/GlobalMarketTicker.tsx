import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw, X, Award, ChevronLeft, ChevronRight } from "lucide-react";

interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  sparkline: number[];
  high: number;
  low: number;
  volume: string;
  category: "Indices" | "Commodities" | "Crypto" | "Forex";
}

const INITIAL_MARKETS: MarketIndex[] = [
  {
    symbol: "SPX",
    name: "S&P 500",
    value: 5431.60,
    change: 17.35,
    changePercent: 0.32,
    sparkline: [5410, 5415, 5408, 5422, 5420, 5418, 5428, 5431.60],
    high: 5440.10,
    low: 5402.50,
    volume: "2.1B",
    category: "Indices"
  },
  {
    symbol: "DJI",
    name: "Dow Jones",
    value: 39127.14,
    change: -46.95,
    changePercent: -0.12,
    sparkline: [39180, 39160, 39170, 39130, 39145, 39110, 39120, 39127.14],
    high: 39210.50,
    low: 39080.00,
    volume: "1.4B",
    category: "Indices"
  },
  {
    symbol: "IXIC",
    name: "Nasdaq Comp",
    value: 17722.66,
    change: 142.30,
    changePercent: 0.81,
    sparkline: [17580, 17610, 17600, 17640, 17660, 17690, 17705, 17722.66],
    high: 17750.20,
    low: 17560.80,
    volume: "3.2B",
    category: "Indices"
  },
  {
    symbol: "BTC",
    name: "Bitcoin / USD",
    value: 65410.20,
    change: 1532.50,
    changePercent: 2.40,
    sparkline: [63878, 64120, 64500, 64230, 64800, 65100, 65230, 65410.20],
    high: 65890.00,
    low: 63650.00,
    volume: "28.4B",
    category: "Crypto"
  },
  {
    symbol: "ETH",
    name: "Ethereum / USD",
    value: 3524.80,
    change: 62.40,
    changePercent: 1.80,
    sparkline: [3462, 3470, 3485, 3450, 3495, 3510, 3515, 3524.80],
    high: 3560.00,
    low: 3440.00,
    volume: "14.1B",
    category: "Crypto"
  },
  {
    symbol: "XAU",
    name: "Gold Spot",
    value: 2330.45,
    change: 3.50,
    changePercent: 0.15,
    sparkline: [2326, 2328, 2325, 2329, 2332, 2328, 2331, 2330.45],
    high: 2338.20,
    low: 2321.10,
    volume: "180K",
    category: "Commodities"
  },
  {
    symbol: "CL",
    name: "Crude Oil",
    value: 85.24,
    change: 0.41,
    changePercent: 0.48,
    sparkline: [84.80, 84.95, 84.75, 85.10, 85.05, 85.20, 85.18, 85.24],
    high: 85.60,
    low: 84.50,
    volume: "340K",
    category: "Commodities"
  },
  {
    symbol: "N225",
    name: "Nikkei 225",
    value: 38780.11,
    change: 422.31,
    changePercent: 1.10,
    sparkline: [38357, 38450, 38400, 38620, 38580, 38700, 38720, 38780.11],
    high: 38890.00,
    low: 38320.00,
    volume: "1.8B",
    category: "Indices"
  },
  {
    symbol: "EURUSD",
    name: "EUR / USD",
    value: 1.0738,
    change: -0.0012,
    changePercent: -0.11,
    sparkline: [1.0750, 1.0748, 1.0742, 1.0745, 1.0739, 1.0741, 1.0735, 1.0738],
    high: 1.0762,
    low: 1.0728,
    volume: "45K",
    category: "Forex"
  },
  {
    symbol: "GBPUSD",
    name: "GBP / USD",
    value: 1.2709,
    change: 0.0024,
    changePercent: 0.19,
    sparkline: [1.2685, 1.2690, 1.2680, 1.2695, 1.2702, 1.2698, 1.2705, 1.2709],
    high: 1.2725,
    low: 1.2672,
    volume: "32K",
    category: "Forex"
  }
];

export default function GlobalMarketTicker() {
  const [markets, setMarkets] = useState<MarketIndex[]>(INITIAL_MARKETS);
  const [selectedAsset, setSelectedAsset] = useState<MarketIndex | null>(null);
  const [activeTab, setActiveTab] = useState<"All" | "Indices" | "Crypto" | "Commodities" | "Forex">("All");
  const [tickingItem, setTickingItem] = useState<{ symbol: string; direction: "up" | "down" } | null>(null);

  // Update dynamic ticking data realistically
  useEffect(() => {
    const timer = setInterval(() => {
      // Pick a random index to update
      const randomIndex = Math.floor(Math.random() * markets.length);
      const target = markets[randomIndex];

      // Walk percentage (either positive or negative)
      const isUp = Math.random() > 0.42; // slight positive bias
      const changeMagnitude = (Math.random() * 0.12 + 0.01) / 100; // 0.01% - 0.13%
      const multiplier = isUp ? 1 + changeMagnitude : 1 - changeMagnitude;

      const newValue = target.value * multiplier;
      const originalValue = target.value;
      const diff = newValue - originalValue;

      setMarkets((prev) =>
        prev.map((m, idx) => {
          if (idx === randomIndex) {
            const updatedChange = m.change + diff;
            const percentageFromBase = (updatedChange / (m.value - m.change)) * 100;

            // Keep sparkline length to max 10
            const newSparkline = [...m.sparkline.slice(1), parseFloat(newValue.toFixed(4))];

            return {
              ...m,
              value: parseFloat(newValue.toFixed(m.symbol.includes("USD") && !m.symbol.includes("BTC") && !m.symbol.includes("ETH") ? 4 : 2)),
              change: parseFloat(updatedChange.toFixed(m.symbol.includes("USD") && !m.symbol.includes("BTC") && !m.symbol.includes("ETH") ? 4 : 2)),
              changePercent: parseFloat(percentageFromBase.toFixed(2)),
              sparkline: newSparkline,
              high: parseFloat(Math.max(m.high, newValue).toFixed(m.symbol.includes("USD") && !m.symbol.includes("BTC") && !m.symbol.includes("ETH") ? 4 : 2)),
              low: parseFloat(Math.min(m.low, newValue).toFixed(m.symbol.includes("USD") && !m.symbol.includes("BTC") && !m.symbol.includes("ETH") ? 4 : 2)),
            };
          }
          return m;
        })
      );

      // Flash active item
      setTickingItem({ symbol: target.symbol, direction: isUp ? "up" : "down" });
      const flashTimeout = setTimeout(() => setTickingItem(null), 1000);
      return () => clearTimeout(flashTimeout);

    }, 3500);

    return () => clearInterval(timer);
  }, [markets]);

  const filteredMarkets = markets.filter(m => activeTab === "All" || m.category === activeTab);

  // SVG Sparkline generator
  const drawSparkline = (points: number[], isPositive: boolean) => {
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    
    const width = 60;
    const height = 18;
    const padding = 1;

    const coordinates = points.map((p, i) => {
      const x = (i / (points.length - 1)) * (width - 2 * padding) + padding;
      const y = height - ((p - min) / range) * (height - 2 * padding) - padding;
      return `${x},${y}`;
    });

    return (
      <svg className="w-[60px] h-[18px] opacity-80" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={`M ${coordinates.join(" L ")}`}
          fill="none"
          stroke={isPositive ? "#10B981" : "#EF4444"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="bg-slate-900 border-b border-slate-950 font-sans select-none" id="global_market_block">
      {/* Upper sub-segment filter + metadata info */}
      <div className="max-w-7xl mx-auto px-6 py-1.5 flex flex-col sm:flex-row justify-between items-center gap-2 border-b border-slate-950 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 text-blue-400">
            <Activity size={12} className="animate-pulse" />
            LIVE WORLD INDICES
          </span>
          <span className="text-slate-800">|</span>
          <div className="flex gap-2">
            {(["All", "Indices", "Crypto", "Commodities", "Forex"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-1.5 py-0.5 rounded transition ${
                  activeTab === tab 
                    ? "bg-slate-800 text-white" 
                    : "hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-[9px] font-mono">
          <span className="flex items-center gap-1">
            <RefreshCw size={9} className="animate-spin" style={{ animationDuration: "5s" }} />
            Streaming socket feedback active
          </span>
        </div>
      </div>

      {/* Financial horizontal slider container */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-none py-2.5 px-6">
          <div className="flex gap-4 min-w-max">
            {filteredMarkets.map((m) => {
              const isPositive = m.changePercent >= 0;
              const isCurrentlyTicking = tickingItem?.symbol === m.symbol;
              const tickBorder = isCurrentlyTicking
                ? tickingItem.direction === "up"
                  ? "border-emerald-500 shadow-sm shadow-emerald-900/30"
                  : "border-rose-500 shadow-sm shadow-rose-900/30"
                : "border-slate-800 hover:border-slate-700";

              return (
                <div
                  key={m.symbol}
                  onClick={() => setSelectedAsset(m)}
                  className={`bg-slate-950 p-2 rounded-lg border text-xs cursor-pointer flex items-center gap-4 transition-all duration-300 w-52 select-none ${tickBorder}`}
                >
                  <div className="flex flex-col flex-1 truncate">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-200 font-sans tracking-wide">{m.symbol}</span>
                      <span className="text-[9px] text-slate-500 uppercase shrink-0">{m.category}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-400 mt-0.5 whitespace-nowrap">
                      {m.value.toLocaleString(undefined, { minimumFractionDigits: m.symbol.includes("USD") && !m.symbol.includes("BTC") && !m.symbol.includes("ETH") ? 4 : 2 })}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {isPositive ? (
                        <TrendingUp size={11} className="text-emerald-400 shrink-0" />
                      ) : (
                        <TrendingDown size={11} className="text-rose-400 shrink-0" />
                      )}
                      <span className={`font-mono text-[10px] font-extrabold ${isPositive ? "text-emerald-400" : "text-rose-450"}`}>
                        {isPositive ? "+" : ""}{m.changePercent}%
                      </span>
                    </div>
                  </div>
                  {/* Miniature SVG charts sparklines */}
                  <div className="shrink-0 flex items-center justify-center">
                    {drawSparkline(m.sparkline, isPositive)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Asset Expansion Detail Window Popover Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="asset_detail_window">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scaleIn">
            <div className="bg-slate-950 p-4 border-b border-slate-850 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white font-mono font-black text-xs px-2 py-0.5 rounded">
                  {selectedAsset.symbol}
                </span>
                <h4 className="font-black text-white text-sm tracking-tight">{selectedAsset.name}</h4>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-full hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Massive live tick price values */}
              <div className="text-center py-4 bg-slate-950/60 rounded-xl border border-slate-850">
                <span className="text-3xl font-mono font-black text-white leading-none tracking-tight block">
                  {selectedAsset.value.toLocaleString(undefined, { minimumFractionDigits: selectedAsset.symbol.includes("USD") && !selectedAsset.symbol.includes("BTC") && !selectedAsset.symbol.includes("ETH") ? 4 : 2 })}
                </span>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {selectedAsset.changePercent >= 0 ? (
                    <TrendingUp size={16} className="text-emerald-400" />
                  ) : (
                    <TrendingDown size={16} className="text-rose-400" />
                  )}
                  <span className={`font-mono font-black text-sm ${selectedAsset.changePercent >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                    {selectedAsset.changePercent >= 0 ? "+" : ""}{selectedAsset.change.toLocaleString()}({selectedAsset.changePercent}%)
                  </span>
                </div>
              </div>

              {/* Grid indices stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/30 border border-slate-850 p-2.5 rounded-lg flex flex-col">
                  <span className="text-slate-500 font-bold uppercase text-[9px]">24h High</span>
                  <span className="font-mono font-bold text-slate-300 mt-0.5">{selectedAsset.high.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950/30 border border-slate-850 p-2.5 rounded-lg flex flex-col">
                  <span className="text-slate-500 font-bold uppercase text-[9px]">24h Low</span>
                  <span className="font-mono font-bold text-slate-300 mt-0.5">{selectedAsset.low.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950/30 border border-slate-850 p-2.5 rounded-lg flex flex-col">
                  <span className="text-slate-500 font-bold uppercase text-[9px]">Volume / 24h</span>
                  <span className="font-mono font-bold text-slate-300 mt-0.5">{selectedAsset.volume}</span>
                </div>
                <div className="bg-slate-950/30 border border-slate-850 p-2.5 rounded-lg flex flex-col">
                  <span className="text-slate-500 font-bold uppercase text-[9px]">Trading Instrument</span>
                  <span className="font-bold text-blue-400 mt-0.5 uppercase text-[10px]">{selectedAsset.category}</span>
                </div>
              </div>

              {/* Graphical big index history placeholder curve path */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Fluctuation Curve Path</span>
                <div className="bg-slate-950 border border-slate-850 h-28 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
                  {/* Custom scaled SVG graph of sparkline */}
                  <svg className="w-full h-full absolute inset-0 p-4" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={selectedAsset.changePercent >= 0 ? "#10B981" : "#EF4444"} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={selectedAsset.changePercent >= 0 ? "#10B981" : "#EF4444"} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Fill Area */}
                    <path
                      d={`M 0,50 L ${selectedAsset.sparkline.map((p, i) => {
                        const x = (i / (selectedAsset.sparkline.length - 1)) * 100;
                        const min = Math.min(...selectedAsset.sparkline);
                        const max = Math.max(...selectedAsset.sparkline);
                        const range = max - min || 1;
                        const y = 50 - ((p - min) / range) * 44 - 3;
                        return `${x},${y}`;
                      }).join(" L ")} L 100,50 Z`}
                      fill="url(#gradient-area)"
                    />
                    {/* Stroke Path */}
                    <path
                      d={`M ${selectedAsset.sparkline.map((p, i) => {
                        const x = (i / (selectedAsset.sparkline.length - 1)) * 100;
                        const min = Math.min(...selectedAsset.sparkline);
                        const max = Math.max(...selectedAsset.sparkline);
                        const range = max - min || 1;
                        const y = 50 - ((p - min) / range) * 44 - 3;
                        return `${x},${y}`;
                      }).join(" L ")}`}
                      fill="none"
                      stroke={selectedAsset.changePercent >= 0 ? "#10B981" : "#EF4444"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="absolute top-2 left-3 text-[8px] font-sans text-neutral-500 font-bold uppercase">24h Continuous Feed</div>
                </div>
              </div>

              <div className="bg-blue-950/25 border border-blue-900/60 p-3 rounded-lg flex items-start gap-2 text-[11px] text-blue-300">
                <Award size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Fast Coverage financial feeds are integrated through real-time index streams for continuous coverage.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
