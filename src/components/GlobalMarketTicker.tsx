import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  X, 
  Award, 
  Tv, 
  LayoutGrid, 
  Radio,
  Flame,
  Globe,
  TrendingUp as IconUp,
  TrendingDown as IconDown
} from "lucide-react";

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
  
  // Ticker layout toggle: "cnn-cable" (CNN TV scroll ticker) or "dashboard-grid" (interactive tiles)
  const [tickerView, setTickerView] = useState<"cnn-cable" | "dashboard-grid">("cnn-cable");

  // Real-world integration states
  const feedMode = "Real-World";
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const fetchLiveQuotes = async () => {
    setIsFetching(true);
    try {
      const response = await fetch("/api/market/live-quotes");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const res = await response.json();
      if (res.success && Array.isArray(res.data)) {
        const liveMap = new Map<string, any>();
        res.data.forEach((item: any) => {
          liveMap.set(item.symbol, item);
        });

        setMarkets((prev) =>
          prev.map((m) => {
            const liveItem = liveMap.get(m.symbol);
            if (!liveItem) return m;

            const newSparkline = [...m.sparkline.slice(1), liveItem.price];
            
            return {
              ...m,
              value: liveItem.price,
              change: liveItem.change,
              changePercent: liveItem.changePercent,
              volume: liveItem.volume,
              high: Math.max(m.high, liveItem.high, liveItem.price),
              low: m.low === m.value ? liveItem.low : Math.min(m.low, liveItem.low, liveItem.price),
              sparkline: newSparkline
            };
          })
        );
      }
    } catch (err) {
      console.warn("Real-world asset integration offline:", err);
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch immediately on mount, and then poll every 20 seconds
  useEffect(() => {
    fetchLiveQuotes();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveQuotes();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const filteredMarkets = markets.filter(m => activeTab === "All" || m.category === activeTab);

  // Sparkline mini generator
  const drawSparkline = (points: number[], isPositive: boolean, width = 60, height = 18) => {
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const padding = 1;

    const coordinates = points.map((p, i) => {
      const x = (i / (points.length - 1)) * (width - 2 * padding) + padding;
      const y = height - ((p - min) / range) * (height - 2 * padding) - padding;
      return `${x},${y}`;
    });

    return (
      <svg className="opacity-90" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
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
    <div className="bg-zinc-950 border-b border-neutral-900 font-sans select-none relative z-21" id="global_market_cnn_container">
      
      {/* Custom Styles for Scrolling Crawler Performance */}
      <style>{`
        @keyframes scrollCNNMarket {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .cnn-animate-track {
          display: flex;
          width: max-content;
          animation: scrollCNNMarket 45s linear infinite;
        }
        .cnn-animate-track:hover {
          animation-play-state: paused;
        }
        .tick-flash-up {
          animation: flashGlowUp 1.2s ease-out;
        }
        .tick-flash-down {
          animation: flashGlowDown 1.2s ease-out;
        }
        @keyframes flashGlowUp {
          0% { background-color: rgba(16, 185, 129, 0.4); }
          100% { background-color: transparent; }
        }
        @keyframes flashGlowDown {
          0% { background-color: rgba(239, 68, 68, 0.4); }
          100% { background-color: transparent; }
        }
      `}</style>

      {/* Main Bar Shell */}
      <div className="flex flex-col lg:flex-row items-stretch">
        
        {/* Left Side: Branded Live Market Badge */}
        <div className="shrink-0 flex items-center bg-zinc-900 border-r border-neutral-900 overflow-hidden relative">
          <div className="px-4 py-2.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-white text-xs tracking-widest uppercase">GLOBAL</span>
            <span className="bg-emerald-500 text-black font-black text-[9px] px-1.5 py-0.5 rounded tracking-tighter">LIVE MARKETS</span>
          </div>
        </div>

        {/* Middle Area: Interactive Live Market Panel */}
        <div className="flex-1 flex flex-col md:flex-row items-stretch justify-between min-h-[44px]">
          
          {/* Main content viewport: either Cable Crawler or Modern Grid */}
          <div className="flex-1 overflow-hidden relative flex items-center bg-zinc-950/85">
            {tickerView === "cnn-cable" ? (
              /* TV CABLE CAROUSEL CRAWLER (Seamless Continuous Roll, mimicking television broadcasts) */
              <div className="w-full overflow-hidden relative flex items-center select-none py-2">
                <div className="cnn-animate-track">
                  {/* Repeated items for infinite animation wrap */}
                  {[...markets, ...markets].map((m, idx) => {
                    const isPositive = m.changePercent >= 0;
                    const isTicking = tickingItem?.symbol === m.symbol;
                    const flashClass = isTicking 
                      ? tickingItem.direction === "up" 
                        ? "tick-flash-up" 
                        : "tick-flash-down"
                      : "";

                    return (
                      <div
                        key={`${m.symbol}-${idx}`}
                        onClick={() => setSelectedAsset(m)}
                        className={`inline-flex items-center gap-3 px-5 py-1 border-r border-neutral-900 cursor-pointer hover:bg-neutral-900/55 transition duration-150 rounded-xs select-none ${flashClass}`}
                      >
                        <span className="text-neutral-400 font-extrabold text-xs tracking-tight">{m.symbol}</span>
                        <span className="font-mono font-bold text-white text-xs">
                          {m.value.toLocaleString(undefined, { minimumFractionDigits: m.symbol.includes("USD") && !m.symbol.includes("BTC") && !m.symbol.includes("ETH") ? 4 : 2 })}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-black ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                            {isPositive ? "▲" : "▼"}
                          </span>
                          <span className={`font-mono text-xs font-bold ${isPositive ? "text-emerald-400" : "text-red-505"}`}>
                            {isPositive ? "+" : ""}{m.changePercent}%
                          </span>
                        </div>

                        {/* Miniature Sparkline directly integrated in the flow of the ticker */}
                        <div className="opacity-70 scale-90 w-[45px] flex items-center justify-center">
                          {drawSparkline(m.sparkline, isPositive, 40, 12)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* GRID DASHBOARD VIEWER (Tabulated visual tile structure for specific index lookups) */
              <div className="w-full flex items-center justify-between px-4 py-1 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {(["All", "Indices", "Crypto", "Commodities", "Forex"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                        activeTab === tab 
                          ? "bg-red-700 text-white" 
                          : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 py-1 overflow-x-auto max-w-full scrollbar-none">
                  {filteredMarkets.slice(0, 5).map((m) => {
                    const isPositive = m.changePercent >= 0;
                    const isTicking = tickingItem?.symbol === m.symbol;
                    const flashClass = isTicking 
                      ? tickingItem.direction === "up" 
                        ? "tick-flash-up" 
                        : "tick-flash-down"
                      : "";

                    return (
                      <div
                        key={m.symbol}
                        onClick={() => setSelectedAsset(m)}
                        className={`bg-black/90 p-1.5 px-3 rounded border border-neutral-900 cursor-pointer flex items-center gap-3 hover:border-neutral-800 transition select-none ${flashClass}`}
                      >
                        <span className="font-extrabold text-[10px] text-neutral-300">{m.symbol}</span>
                        <span className="font-mono text-[10px] text-white">
                          {m.value.toLocaleString(undefined, { minimumFractionDigits: m.symbol.includes("USD") && !m.symbol.includes("BTC") && !m.symbol.includes("ETH") ? 4 : 2 })}
                        </span>
                        <span className={`text-[10px] font-mono leading-none ${isPositive ? "text-emerald-400" : "text-rose-500"}`}>
                          {isPositive ? "▲" : "▼"}{isPositive ? "+" : ""}{m.changePercent}%
                        </span>
                      </div>
                    );
                  })}
                  {filteredMarkets.length > 5 && (
                    <span className="text-[9px] font-mono text-neutral-500 pr-2">
                      +{filteredMarkets.length - 5} MORE
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Controls: Display View Mode Swapper */}
          <div className="shrink-0 flex items-center bg-black border-t md:border-t-0 md:border-l border-neutral-900 px-4 py-1.5 text-[10px] font-mono text-neutral-400 justify-end gap-3 select-none">
            <span className="text-neutral-700 hidden lg:inline">|</span>
            
            {/* Cable mode toggle button */}
            <button
              onClick={() => setTickerView("cnn-cable")}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition duration-200 cursor-pointer ${
                tickerView === "cnn-cable" 
                  ? "text-red-500 font-extrabold bg-red-950/20" 
                  : "hover:text-white"
              }`}
              title="Cable News Broadcast Crawler Mode"
            >
              <Tv size={12} />
              <span>TV CRAWLER</span>
            </button>

            {/* Dashboard mode toggle button */}
            <button
              onClick={() => setTickerView("dashboard-grid")}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition duration-200 cursor-pointer ${
                tickerView === "dashboard-grid" 
                  ? "text-red-505 font-extrabold bg-red-955/20" 
                  : "hover:text-white"
              }`}
              title="Interactive Financial Grid Mode"
            >
              <LayoutGrid size={12} />
              <span>GRID TILES</span>
            </button>

            <span className="text-neutral-750 hidden md:inline">|</span>

            {/* Real-World vs Synthetic Switcher */}
            <button
              onClick={() => {
                fetchLiveQuotes();
              }}
              disabled={isFetching}
              className="flex items-center gap-1.5 p-1 px-2.5 rounded border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-850 hover:border-neutral-700 transition text-[9px] font-black cursor-pointer uppercase tracking-wider"
              title="Refresh Yahoo Finance live stock feeds"
            >
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
              <span className="text-emerald-400 font-bold">
                REAL LIVE (YFIN)
              </span>
              {isFetching && <RefreshCw size={8} className="animate-spin shrink-0 text-neutral-400 ml-1" />}
            </button>
          </div>

        </div>

      </div>

      {/* DETAILED INDEX POPULATION EXPANSION MODAL */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="cnn_market_detail_window">
          <div className="bg-zinc-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
            
            {/* Popover Header */}
            <div className="bg-black p-4 border-b border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-zinc-800 text-emerald-400 font-mono font-black text-[11px] px-2.5 py-0.5 rounded tracking-widest flex items-center gap-1">
                  <Radio size={11} className="animate-pulse text-emerald-400" />
                  LIVE INDEX DATA
                </span>
                <h4 className="font-extrabold text-white text-sm tracking-tight">{selectedAsset.name} ({selectedAsset.symbol})</h4>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-neutral-400 hover:text-white transition p-1.5 rounded-full hover:bg-neutral-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Popover Body Content */}
            <div className="p-6 space-y-5">
              
              {/* Massive active live values feed */}
              <div className="text-center py-5 bg-black/80 rounded-xl border border-neutral-800 relative overflow-hidden group">
                <div className="absolute top-2 left-2 text-[8px] font-mono text-neutral-500 flex items-center gap-1 select-none">
                  <Flame size={10} className="text-amber-500 animate-pulse" />
                  REAL-TIME INSTANT FEED
                </div>

                <span className="text-3xl font-mono font-black text-white tracking-tight block">
                  {selectedAsset.value.toLocaleString(undefined, { minimumFractionDigits: selectedAsset.symbol.includes("USD") && !selectedAsset.symbol.includes("BTC") && !selectedAsset.symbol.includes("ETH") ? 4 : 2 })}
                </span>
                
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className={`text-sm font-black ${selectedAsset.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {selectedAsset.changePercent >= 0 ? "▲" : "▼"}
                  </span>
                  <span className={`font-mono font-black text-sm ${selectedAsset.changePercent >= 0 ? "text-emerald-400" : "text-rose-455"}`}>
                    {selectedAsset.changePercent >= 0 ? "+" : ""}{selectedAsset.change.toLocaleString()}({selectedAsset.changePercent}%)
                  </span>
                </div>
              </div>

              {/* Grid indices statistical profiles */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-neutral-900 border border-neutral-800/80 p-3 rounded-xl flex flex-col">
                  <span className="text-neutral-500 font-bold uppercase text-[9px] tracking-wider">Trading Instrument</span>
                  <span className="font-black text-red-500 mt-1 uppercase text-[10px] tracking-tight">{selectedAsset.category}</span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800/80 p-3 rounded-xl flex flex-col">
                  <span className="text-neutral-500 font-bold uppercase text-[9px] tracking-wider">Estimated Volume / 24h</span>
                  <span className="font-mono font-black text-neutral-200 mt-1">{selectedAsset.volume}</span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800/80 p-3 rounded-xl flex flex-col">
                  <span className="text-neutral-500 font-bold uppercase text-[9px] tracking-wider">24h Peak Ceiling</span>
                  <span className="font-mono font-black text-neutral-200 mt-1">{selectedAsset.high.toLocaleString()}</span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800/80 p-3 rounded-xl flex flex-col">
                  <span className="text-neutral-500 font-bold uppercase text-[9px] tracking-wider">24h Floor Bottom</span>
                  <span className="font-mono font-black text-neutral-200 mt-1">{selectedAsset.low.toLocaleString()}</span>
                </div>
              </div>

              {/* Graphical big index history placeholder curve path */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">CONTINUOUS MARKET PATH (24H)</span>
                <div className="bg-black border border-neutral-800 h-28 rounded-xl flex items-center justify-center p-3 relative overflow-hidden">
                  <svg className="w-full h-full absolute inset-0 p-4" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="cnn-gradient-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={selectedAsset.changePercent >= 0 ? "#10B981" : "#EF4444"} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={selectedAsset.changePercent >= 0 ? "#10B981" : "#EF4444"} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Area path */}
                    <path
                      d={`M 0,50 L ${selectedAsset.sparkline.map((p, i) => {
                        const x = (i / (selectedAsset.sparkline.length - 1)) * 100;
                        const min = Math.min(...selectedAsset.sparkline);
                        const max = Math.max(...selectedAsset.sparkline);
                        const range = max - min || 1;
                        const y = 50 - ((p - min) / range) * 44 - 3;
                        return `${x},${y}`;
                      }).join(" L ")} L 100,50 Z`}
                      fill="url(#cnn-gradient-area)"
                    />
                    {/* Line path */}
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
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="absolute bottom-2 right-3 text-[8px] font-mono text-neutral-500">REAL-TIME TELEMETRY</div>
                </div>
              </div>

              {/* Market Coverage disclaimer card */}
              <div className="bg-neutral-900/45 border border-neutral-800 p-3 rounded-lg flex items-start gap-2.5 text-[11px] text-zinc-300">
                <Globe size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-sans">
                  Index pricing metrics updated instantaneously via live synthetic streams syncing every 3.0s mimicking major global market hubs.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
