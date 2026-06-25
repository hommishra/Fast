import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck, 
  Activity, 
  Globe, 
  Coins, 
  Briefcase, 
  HelpCircle,
  Play,
  Pause,
  Clock,
  ArrowRight
} from "lucide-react";

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  description: string;
  category: "Indices" | "Crypto" | "US Stocks" | "Commodities";
}

const STOCK_DB: StockItem[] = [
  {
    symbol: "SPX",
    name: "S&P 500 Index",
    price: 5431.60,
    change: 17.35,
    changePercent: 0.32,
    volume: "2.1B",
    prevClose: 5414.25,
    open: 5418.90,
    high: 5440.10,
    low: 5402.50,
    description: "Standard & Poor's 500 Index tracking the 500 largest US publicly traded companies.",
    category: "Indices",
  },
  {
    symbol: "DJI",
    name: "Dow Jones Industrial",
    price: 39127.14,
    change: -46.95,
    changePercent: -0.12,
    volume: "1.4B",
    prevClose: 39174.09,
    open: 39165.20,
    high: 39210.50,
    low: 39080.00,
    description: "The Dow Jones Industrial Average is a stock market index of 30 prominent companies.",
    category: "Indices",
  },
  {
    symbol: "IXIC",
    name: "Nasdaq Composite",
    price: 17722.66,
    change: 142.30,
    changePercent: 0.81,
    volume: "3.2B",
    prevClose: 17580.36,
    open: 17595.60,
    high: 17750.20,
    low: 17560.80,
    description: "Tech-heavy index highly representative of technology, internet, and biotechnology sectors.",
    category: "Indices",
  },
  {
    symbol: "RUT",
    name: "Russell 2000 Index",
    price: 2024.15,
    change: 11.20,
    changePercent: 0.56,
    volume: "980M",
    prevClose: 2012.95,
    open: 2014.20,
    high: 2030.50,
    low: 2008.10,
    description: "A subset of the Russell 3000 Index measuring performance of the small-cap segment.",
    category: "Indices",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 127.40,
    change: 5.65,
    changePercent: 4.64,
    volume: "240M",
    prevClose: 121.75,
    open: 122.10,
    high: 128.50,
    low: 121.50,
    description: "NVIDIA designs graphics processing units (GPUs) for gaming and professional markets, and system on a chip units for mobile computing and automotive.",
    category: "US Stocks",
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 214.38,
    change: -1.22,
    changePercent: -0.57,
    volume: "54M",
    prevClose: 215.60,
    open: 215.10,
    high: 216.40,
    low: 213.20,
    description: "Designs, manufactures and markets smartphones, personal computers, tablets, wearables and accessories worldwide.",
    category: "US Stocks",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 184.86,
    change: -3.42,
    changePercent: -1.82,
    volume: "76M",
    prevClose: 188.28,
    open: 187.50,
    high: 189.20,
    low: 183.10,
    description: "Tesla, Inc. designs, develops, manufactures, sells and leases fully electric vehicles, energy generation and storage systems.",
    category: "US Stocks",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc. Cl A",
    price: 176.45,
    change: 1.85,
    changePercent: 1.06,
    volume: "28M",
    prevClose: 174.60,
    open: 174.90,
    high: 177.10,
    low: 174.20,
    description: "Alphabet Inc. focuses on search, advertising, maps, YouTube, cloud infrastructure, and other technology sectors globally.",
    category: "US Stocks",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 446.34,
    change: 4.12,
    changePercent: 0.93,
    volume: "22M",
    prevClose: 442.22,
    open: 443.10,
    high: 448.20,
    low: 441.50,
    description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
    category: "US Stocks",
  },
  {
    symbol: "BTC",
    name: "Bitcoin / USD",
    price: 65410.20,
    change: 1532.50,
    changePercent: 2.40,
    volume: "28.4B",
    prevClose: 63877.70,
    open: 63905.00,
    high: 65890.00,
    low: 63650.00,
    description: "The primary digital, decentralized cryptocurrency designed to act as money and a form of payment.",
    category: "Crypto",
  },
  {
    symbol: "ETH",
    name: "Ethereum / USD",
    price: 3524.80,
    change: 62.40,
    changePercent: 1.80,
    volume: "14.1B",
    prevClose: 3462.40,
    open: 3465.10,
    high: 3560.00,
    low: 3440.00,
    description: "Ethereum is a decentralized technology platform enabling smart contracts and decentralized applications.",
    category: "Crypto",
  },
  {
    symbol: "XAU",
    name: "Gold Spot",
    price: 2330.45,
    change: 3.50,
    changePercent: 0.15,
    volume: "180K",
    prevClose: 2326.95,
    open: 2327.20,
    high: 2338.20,
    low: 2321.10,
    description: "Gold physical commodity traded spots in US Dollars representing classical safe-haven global assets.",
    category: "Commodities",
  },
  {
    symbol: "CL",
    name: "Crude Oil WTI",
    price: 85.24,
    change: 0.41,
    changePercent: 0.48,
    volume: "340K",
    prevClose: 84.83,
    open: 84.95,
    high: 85.60,
    low: 84.50,
    description: "West Texas Intermediate light sweet crude oil spot price benchmark representing energy supply trends.",
    category: "Commodities",
  }
];

interface SectorItem {
  name: string;
  performance: number; // percent
}

const INITIAL_SECTORS: SectorItem[] = [
  { name: "Tech & Software", performance: 2.85 },
  { name: "Semiconductors", performance: 4.12 },
  { name: "Financials", performance: -0.42 },
  { name: "Energy & Utilities", performance: 0.88 },
  { name: "Healthcare & Biotech", performance: 1.15 },
  { name: "Real Estate", performance: -1.25 },
  { name: "Consumer Cyclicals", performance: -0.85 }
];

export default function MarketDashboard() {
  const [stocks, setStocks] = useState<StockItem[]>(STOCK_DB);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("SPX");
  const [chartPeriod, setChartPeriod] = useState<"1D" | "5D" | "1M" | "1Y">("1D");
  const [sectors, setSectors] = useState<SectorItem[]>(INITIAL_SECTORS);
  const [searchQuery, setSearchQuery] = useState("");
  const [useTradingViewChart, setUseTradingViewChart] = useState(true);

  const tvSymbol = useMemo(() => {
    switch (selectedSymbol.toUpperCase()) {
      case "SPX": return "FOREXCOM:SPX500";
      case "DJI": return "FOREXCOM:DJI";
      case "IXIC": return "FOREXCOM:NSXUSD";
      case "RUT": return "INDEX:RUT";
      case "BTC": return "COINBASE:BTC-USD";
      case "ETH": return "COINBASE:ETH-USD";
      case "SOL": return "COINBASE:SOL-USD";
      case "XAU": return "TVC:GOLD";
      case "CL": return "TVC:USOIL";
      case "EURUSD": return "OANDA:EURUSD";
      case "GBPUSD": return "OANDA:GBPUSD";
      default:
        return `NASDAQ:${selectedSymbol.toUpperCase()}`;
    }
  }, [selectedSymbol]);

  const chartSrcDoc = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              overflow: hidden;
              background: #ffffff;
              height: 100%;
              width: 100%;
            }
            .tradingview-widget-container {
              width: 100%;
              height: 100%;
              overflow: hidden;
              position: relative;
            }
            /* Completely strip and suppress any copyright links, brand logos, or 1% watermarks */
            .tradingview-widget-copyright,
            [class*="copyright"],
            [class*="branding"],
            [class*="watermark"],
            a[href*="tradingview.com"],
            iframe[src*="logo"],
            div[class*="logo"] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              height: 0 !important;
              pointer-events: none !important;
            }
          </style>
        </head>
        <body>
          <div class="tradingview-widget-container">
            <div class="tradingview-widget-container__widget" style="height: 100%; width: 100%;"></div>
            <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>
            {
              "autosize": true,
              "symbol": "${tvSymbol}",
              "interval": "D",
              "timezone": "Etc/UTC",
              "theme": "light",
              "style": "1",
              "locale": "en",
              "enable_publishing": false,
              "allow_symbol_change": true,
              "calendar": false,
              "support_host": "https://www.tradingview.com"
            }
            </script>
          </div>
        </body>
      </html>
    `;
  }, [tvSymbol]);

  const feedMode = "Real-World";
  const [isFetching, setIsFetching] = useState(false);

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

        setStocks((prev) =>
          prev.map((s) => {
            const liveItem = liveMap.get(s.symbol);
            if (!liveItem) return s;

            return {
              ...s,
              price: liveItem.price,
              change: liveItem.change,
              changePercent: liveItem.changePercent,
              volume: liveItem.volume,
              open: liveItem.open,
              high: Math.max(s.high, liveItem.high, liveItem.price),
              low: s.low === s.price ? liveItem.low : Math.min(s.low, liveItem.low, liveItem.price),
              prevClose: liveItem.prevClose
            };
          })
        );
      }
    } catch (err) {
      console.warn("Real-world stock desk offline:", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchLiveQuotes();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveQuotes();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const activeStock = useMemo(() => {
    return stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];
  }, [stocks, selectedSymbol]);

  // Generate realistic historical data based on current price, symbol volatility, and selected period
  const chartData = useMemo(() => {
    const symbol = activeStock.symbol;
    const price = activeStock.price;
    const changePct = activeStock.changePercent;
    
    // Choose length based on period
    let dataPoints = 24;
    let formatLabel = (i: number) => {
      const hour = (9 + Math.floor(i / 3.5)) % 12 || 12;
      const min = Math.floor((i % 3.5) * 17);
      return `${hour}:${min < 10 ? "0" + min : min} ${i >= 10 ? "PM" : "AM"}`;
    };

    if (chartPeriod === "5D") {
      dataPoints = 35;
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
      formatLabel = (i: number) => {
        const dayIdx = Math.floor(i / 7) % 5;
        const hr = 9 + (i % 7);
        return `${days[dayIdx]} ${hr}:00`;
      };
    } else if (chartPeriod === "1M") {
      dataPoints = 30;
      formatLabel = (i: number) => `Day ${i + 1}`;
    } else if (chartPeriod === "1Y") {
      dataPoints = 50;
      const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      formatLabel = (i: number) => {
        const monthIdx = Math.floor(i / 4.2) % 12;
        const wk = 1 + Math.floor(i % 4);
        return `${months[monthIdx]} W${wk}`;
      };
    }

    // Deterministic simulation generator based on symbol name to make curves distinct & stable
    const seed = symbol.charCodeAt(0) + (symbol.charCodeAt(1) || 0);
    const initialPrice = price * (1 - changePct / 100);
    const data = [];

    for (let i = 0; i < dataPoints; i++) {
      const progress = i / (dataPoints - 1);
      
      // Multi-frequency wave formula containing trend + cyclic waves + noise
      const trendTerm = progress * (price - initialPrice);
      const wave1 = Math.sin(progress * Math.PI * 2.5 + seed) * (price * 0.015);
      const wave2 = Math.cos(progress * Math.PI * 6.0 - seed) * (price * 0.004);
      
      // Introduce slight noise
      const noise = (Math.sin(i * 12.5 + seed) * 0.25) * (price * 0.002);
      
      let pVal = initialPrice + trendTerm + wave1 + wave2 + noise;
      
      // Make final point fit the current real-time state exactly
      if (i === dataPoints - 1) {
        pVal = price;
      }

      // Formatting decimal places correctly
      const dec = symbol.includes("USD") && !symbol.includes("BTC") && !symbol.includes("ETH") ? 4 : 2;
      pVal = parseFloat(pVal.toFixed(dec));

      data.push({
        timeLabel: formatLabel(i),
        price: pVal,
        baseline: initialPrice
      });
    }

    return data;
  }, [activeStock, chartPeriod]);

  const filteredStocks = stocks.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  });

  const topGainers = useMemo(() => {
    return [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  }, [stocks]);

  const topLosers = useMemo(() => {
    return [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  }, [stocks]);

  const activeColor = activeStock.changePercent >= 0 ? "#10B981" : "#EF4444";
  const activeBgGradient = activeStock.changePercent >= 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)";

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-8 font-sans text-neutral-800" id="market_dashboard_layout">
      
      {/* Dynamic Header Information Block */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        {/* Abstract design elements to look like CNN Business */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/5 rounded-full blur-xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white font-sans font-black text-xs px-2.5 py-0.5 rounded tracking-widest uppercase">
              FC BUSINESS
            </span>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>MARKETS & ASSETS REAL-TIME HUB</span>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-sans uppercase">
            Global Market Intelligence
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Live quote streams, asset statistics, sector heatmaps, and customizable trend vectors. Track indicators, indexes, popular stocks, commodities, and major cryptocurrencies in one spot.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10 w-full md:w-auto">
          {/* Real-World Live quotes refresh button */}
          <button
            onClick={() => fetchLiveQuotes()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-semibold bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/40 transition duration-200 cursor-pointer disabled:opacity-50"
            title="Refresh Yahoo Finance live stock feeds"
          >
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </div>
            <span>REFRESH REAL LIVE (YFIN)</span>
            {isFetching && <RefreshCw size={11} className="animate-spin shrink-0 text-slate-400 ml-1" />}
          </button>

          {/* Quick info text indicator */}
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Clock size={11} className="text-red-500" />
            <span>EST: 9:30 AM - 4:00 PM</span>
          </div>
        </div>
      </div>

      {/* QUICK SELECT INDICES TICKER LIST */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {stocks.slice(0, 6).map((item) => {
          const isSelected = selectedSymbol === item.symbol;
          const isUp = item.changePercent >= 0;
          return (
            <div
              key={item.symbol}
              onClick={() => setSelectedSymbol(item.symbol)}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none relative overflow-hidden ${
                isSelected
                  ? "bg-white text-slate-900 border-red-600 shadow-md transform -translate-y-0.5"
                  : "bg-white hover:bg-slate-50 text-slate-850 border-slate-200 hover:border-slate-350"
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
              )}
              <div className="flex justify-between items-start">
                <span className="font-mono font-black text-xs text-slate-450 tracking-wider">
                  {item.symbol}
                </span>
                <span className={`text-[10px] font-black ${isUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"} rounded px-1.5 py-0.5`}>
                  {isUp ? "+" : ""}{item.changePercent}%
                </span>
              </div>
              <h4 className="font-sans font-black text-sm text-slate-800 mt-2 truncate">
                {item.name}
              </h4>
              <p className="font-mono text-base font-black text-slate-900 mt-1">
                {item.price.toLocaleString(undefined, { minimumFractionDigits: item.symbol.includes("USD") ? 4 : 2 })}
              </p>
            </div>
          );
        })}
      </div>

      {/* MID-PORTION: CORE GRAPH ROOM AND TICKER SYMBOL SEARCH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1 & 2: Large Visual Interactive Spot Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between" id="market_graph_stage">
          <div>
            {/* Header of Spot Curve */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-650 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                    {activeStock.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    INDEX VOL: {activeStock.volume} / 24H
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 font-sans tracking-tight uppercase flex items-center gap-2">
                  {activeStock.name}
                  <span className="text-slate-400 text-base font-normal">({activeStock.symbol})</span>
                </h2>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {/* Chart Mode Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/40 select-none text-[11px] font-bold">
                  <button
                    onClick={() => setUseTradingViewChart(true)}
                    className={`px-3 py-1.5 rounded-md transition duration-150 flex items-center gap-1 cursor-pointer ${
                      useTradingViewChart
                        ? "bg-emerald-600 text-white shadow-xs font-black"
                        : "text-slate-500 hover:text-slate-950"
                    }`}
                  >
                    <Globe size={11} />
                    <span>TRADINGVIEW (LIVE)</span>
                  </button>
                  <button
                    onClick={() => setUseTradingViewChart(false)}
                    className={`px-3 py-1.5 rounded-md transition duration-150 flex items-center gap-1 cursor-pointer ${
                      !useTradingViewChart
                        ? "bg-slate-900 text-white shadow-xs font-black"
                        : "text-slate-500 hover:text-slate-950"
                    }`}
                  >
                    <Activity size={11} />
                    <span>LOCAL STREAM</span>
                  </button>
                </div>

                {/* Chart range selectors */}
                {!useTradingViewChart && (
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/40 select-none">
                    {(["1D", "5D", "1M", "1Y"] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setChartPeriod(period)}
                        className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition ${
                          chartPeriod === period
                            ? "bg-slate-900 text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-950 cursor-pointer"
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quote details banner details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 mb-6">
              <div>
                <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">CURRENT VALUE</span>
                <p className="text-lg font-mono font-black text-slate-900">
                  {activeStock.price.toLocaleString(undefined, { minimumFractionDigits: activeStock.symbol.includes("USD") ? 4 : 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">NET CHANGE</span>
                <p className={`text-base font-mono font-black flex items-center gap-0.5 ${activeStock.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {activeStock.changePercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {activeStock.changePercent >= 0 ? "+" : ""}{activeStock.change.toLocaleString(undefined, { minimumFractionDigits: activeStock.symbol.includes("USD") ? 4 : 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">TODAY'S HIGHEST</span>
                <p className="text-base font-mono font-semibold text-slate-800">
                  {activeStock.high.toLocaleString(undefined, { minimumFractionDigits: activeStock.symbol.includes("USD") ? 4 : 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">TODAY'S LOWEST</span>
                <p className="text-base font-mono font-semibold text-slate-800">
                  {activeStock.low.toLocaleString(undefined, { minimumFractionDigits: activeStock.symbol.includes("USD") ? 4 : 2 })}
                </p>
              </div>
            </div>

            {/* Actual Recharts Area Chart or TradingView Widget */}
            <div className="h-80 w-full mt-4 relative overflow-hidden rounded-xl border border-slate-200 bg-white" id="cnn_stock_chart_container">
              {useTradingViewChart ? (
                <>
                  <iframe
                    srcDoc={chartSrcDoc}
                    className="w-full h-full overflow-hidden border-none relative z-0"
                    title={`TradingView Advanced Chart for ${tvSymbol}`}
                    sandbox="allow-scripts allow-same-origin"
                  />
                  {/* Seamless overlay cover to mask all bottom-left branding, logo and watermarks completely */}
                  <div className="absolute bottom-0 left-0 w-[150px] h-[65px] bg-white pointer-events-none z-10" />
                </>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorStockCurve" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeColor} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={activeColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="timeLabel" 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748B", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis 
                      domain={["auto", "auto"]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748B", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "#0F172A", 
                        color: "#F8FAFC", 
                        borderRadius: "10px", 
                        border: "none",
                        fontSize: "12px",
                        fontFamily: "sans-serif"
                      }}
                      labelStyle={{ opacity: 0.6 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={activeColor} 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorStockCurve)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-3">
            <HelpCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-normal select-none">
              {activeStock.description} Global parameters dynamically fluctuate matching market sentiment under the synthetic FC ticker program. Historical metrics are derived deterministically.
            </p>
          </div>
        </div>

        {/* Column 3: Asset Search Navigator & Active Movers lists */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6" id="market_movers_stage">
          
          {/* Asset Search Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 font-mono flex items-center gap-1.5 select-none">
              <Search size={13} className="text-red-700" />
              Lookup Ticker Symbol
            </label>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search symbol e.g. NVDA, BTC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 rounded-lg py-2.5 pl-9 pr-4 text-xs text-slate-900 focus:outline-none focus:border-red-700 focus:bg-white transition"
              />
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={14} />
              </span>
            </div>

            {/* List lookup suggestions */}
            {searchQuery && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                {filteredStocks.length === 0 ? (
                  <p className="text-[11px] text-slate-400 font-mono py-2 text-center select-none">No matched asset. Try NVDA or SPX</p>
                ) : (
                  filteredStocks.map((s) => (
                    <div
                      key={s.symbol}
                      onClick={() => {
                        setSelectedSymbol(s.symbol);
                        setSearchQuery("");
                      }}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-white transition cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-900 font-mono">{s.symbol}</span>
                        <span className="text-[9px] text-slate-500 truncate max-w-[120px]">{s.name}</span>
                      </div>
                      <span className={`text-[10px] font-semibold ${s.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        ${s.price.toLocaleString()} ({s.changePercent >= 0 ? "+" : ""}{s.changePercent}%)
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* S&P / Nasdaq movers scoreboard tabulations */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-900 border-l-2 border-red-600 pl-2.5 flex items-center gap-1 font-sans select-none">
              <Activity size={13} className="text-red-700" />
              Top Movers Scoreboard
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* TOP GAINERS */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded text-center select-none">
                  Top Gainers
                </div>
                <div className="space-y-1.5 flex flex-col">
                  {topGainers.slice(0, 3).map((tg) => (
                    <div 
                      key={tg.symbol}
                      onClick={() => setSelectedSymbol(tg.symbol)}
                      className="p-1 px-2 rounded hover:bg-neutral-100 transition cursor-pointer flex justify-between items-center text-xs"
                    >
                      <span className="font-mono font-bold text-slate-900">{tg.symbol}</span>
                      <span className="font-mono font-bold text-emerald-600">+{tg.changePercent}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP LOSERS */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-red-800 bg-red-50 px-2 py-1 rounded text-center select-none">
                  Top Losers
                </div>
                <div className="space-y-1.5 flex flex-col">
                  {topLosers.slice(0, 3).map((tl) => (
                    <div 
                      key={tl.symbol}
                      onClick={() => setSelectedSymbol(tl.symbol)}
                      className="p-1 px-2 rounded hover:bg-neutral-100 transition cursor-pointer flex justify-between items-center text-xs"
                    >
                      <span className="font-mono font-bold text-slate-900">{tl.symbol}</span>
                      <span className="font-mono font-bold text-red-650">{tl.changePercent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mini active update logs visual queue */}
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex items-center justify-between text-[11px] h-[34px] overflow-hidden select-none">
            <span className="text-slate-450 font-mono text-[9px] uppercase tracking-wider font-extrabold shrink-0">Quote stream</span>
            {isFetching ? (
              <span className="text-emerald-500 font-mono text-[10px] truncate ml-3 font-bold animate-pulse flex items-center gap-1">
                <RefreshCw size={8} className="animate-spin" />
                Syncing exchange quotes...
              </span>
            ) : (
              <span className="text-slate-400 font-mono ml-3 truncate text-[10px] font-bold">
                Connected: Live exchange polling active (20s)
              </span>
            )}
          </div>

        </div>

      </div>

      {/* LOWER LEVEL: SECTOR STRENGTHS BAR GRAPH */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Sector Strength bars Recharts display */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="sectors_dashboard_stage">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2 select-none font-sans">
              <Briefcase size={14} className="text-red-700" />
              Sector Performance Heat
            </h3>
            <span className="text-[10px] text-slate-400 font-mono select-none block">Change indexing across industries</span>
          </div>

          <div className="h-56 w-full" id="sectors_recharts_chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sectors}
                layout="vertical"
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <XAxis 
                  type="number" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748B", fontSize: 9, fontFamily: "monospace" }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#334155", fontSize: 9, fontWeight: "bold" }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: "#1E293B", 
                    color: "#F8FAFC", 
                    borderRadius: "8px", 
                    border: "none",
                    fontSize: "11px"
                  }}
                />
                <Bar dataKey="performance" radius={[0, 4, 4, 0]}>
                  {sectors.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.performance >= 0 ? "#10B981" : "#EF4444"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
