import React, { useState } from 'react';
import { 
  Globe, 
  Activity
} from 'lucide-react';

interface MarketItem {
  id: string;
  name: string;
  symbol: string;
  category?: string;
  value: string;
  change: string;
  isUp: boolean;
  position: number;
  active: boolean;
}

interface GlobalMarketsProps {
  markets: MarketItem[];
  onUpdateMarkets?: (updated: MarketItem[]) => void;
  settings?: any;
}

// Map categories to list of premium symbols
const CATEGORY_SYMBOLS: Record<string, Array<{ name: string; symbol: string }>> = {
  'United States': [
    { name: 'Dow Jones (DJIA)', symbol: 'FOREXCOM:DJI' },
    { name: 'NASDAQ Composite', symbol: 'INDEX:IXIC' },
    { name: 'S&P 500', symbol: 'FOREXCOM:SPX500' }
  ],
  'India': [
    { name: 'NIFTY 50', symbol: 'NSE:NIFTY' },
    { name: 'SENSEX', symbol: 'BSE:SENSEX' },
    { name: 'BANK NIFTY', symbol: 'NSE:BANKNIFTY' }
  ],
  'United Kingdom': [
    { name: 'FTSE 100', symbol: 'INDEX:UKX' }
  ],
  'Japan': [
    { name: 'Nikkei 225', symbol: 'INDEX:NKY' }
  ],
  'China': [
    { name: 'Shanghai Composite', symbol: 'SSE:000001' },
    { name: 'Hang Seng Index', symbol: 'HSI:HSI' }
  ],
  'Europe': [
    { name: 'EURO STOXX 50', symbol: 'INDEX:SX5E' },
    { name: 'DAX Performance Index', symbol: 'INDEX:DAX' }
  ],
  'Crypto Market': [
    { name: 'Bitcoin (BTC/USD)', symbol: 'COINBASE:BTCUSD' },
    { name: 'Ethereum (ETH/USD)', symbol: 'COINBASE:ETHUSD' },
    { name: 'Solana (SOL/USD)', symbol: 'COINBASE:SOLUSD' },
    { name: 'BNB (BNB/USD)', symbol: 'BINANCE:BNBUSD' },
    { name: 'XRP (XRP/USD)', symbol: 'COINBASE:XRPUSD' }
  ],
  'Forex Market': [
    { name: 'USD / INR', symbol: 'FX_IDC:USDINR' },
    { name: 'USD / EUR', symbol: 'FX:USDEUR' },
    { name: 'USD / GBP', symbol: 'FX:USDGBP' },
    { name: 'USD / JPY', symbol: 'FX:USDJPY' },
    { name: 'EUR / USD', symbol: 'FX:EURUSD' }
  ],
  'Commodities': [
    { name: 'Gold Spot', symbol: 'TVC:GOLD' },
    { name: 'Silver Spot', symbol: 'TVC:SILVER' },
    { name: 'Crude Oil', symbol: 'TVC:USOIL' },
    { name: 'Natural Gas', symbol: 'TVC:UKOIL' }
  ]
};

export default function GlobalMarkets({ markets, onUpdateMarkets, settings }: GlobalMarketsProps) {
  // Determine enabled categories from Admin panel settings
  const categories = [
    { id: 'all', label: 'All Assets', enabled: true },
    { id: 'United States', label: 'United States', enabled: settings?.usMarketsEnabled !== false },
    { id: 'India', label: 'India', enabled: settings?.indiaMarketsEnabled !== false },
    { id: 'United Kingdom', label: 'United Kingdom', enabled: settings?.ukMarketsEnabled !== false },
    { id: 'Japan', label: 'Japan', enabled: settings?.japanMarketsEnabled !== false },
    { id: 'China', label: 'China', enabled: settings?.chinaMarketsEnabled !== false },
    { id: 'Europe', label: 'Europe', enabled: settings?.europeMarketsEnabled !== false },
    { id: 'Crypto Market', label: 'Crypto Market', enabled: settings?.cryptoMarketEnabled !== false },
    { id: 'Forex Market', label: 'Forex Market', enabled: settings?.forexMarketEnabled !== false },
    { id: 'Commodities', label: 'Commodities', enabled: settings?.commoditiesEnabled !== false }
  ];

  const activeCategories = categories.filter(c => c.enabled);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('FOREXCOM:SPX500');
  const [selectedName, setSelectedName] = useState<string>('S&P 500');

  // Gather active tickers matching enabled settings
  const activeTickers = Object.entries(CATEGORY_SYMBOLS)
    .filter(([cat]) => {
      const match = categories.find(c => c.id === cat);
      return match ? match.enabled : true;
    })
    .flatMap(([cat, items]) => items.map(item => ({ ...item, category: cat })));

  // Filtered symbols based on active UI Category Tab
  const displayedTickers = activeTickers.filter(t => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  // Determine active chart position from settings
  const chartLayoutPos = settings?.chartPosition || 'Side';

  // Build dynamic safe Ticker Tape SrcDoc
  const tapeSymbols = activeTickers.slice(0, 15).map(t => ({
    proName: t.symbol,
    title: t.name.split(' (')[0]
  }));

  const tickerTapeConfig = {
    symbols: tapeSymbols.length > 0 ? tapeSymbols : [
      { proName: 'FOREXCOM:SPX500', title: 'S&P 500' },
      { proName: 'NSE:NIFTY', title: 'NIFTY 50' },
      { proName: 'COINBASE:BTCUSD', title: 'BTC/USD' },
      { proName: 'TVC:GOLD', title: 'GOLD' }
    ],
    showSymbolLogo: true,
    colorTheme: 'dark',
    isTransparent: true,
    displayMode: 'adaptive',
    locale: 'en'
  };

  const tickerTapeSrcDoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body, html { margin: 0; padding: 0; overflow: hidden; background: transparent; }
      </style>
    </head>
    <body>
      <div class="tradingview-widget-container">
        <div class="tradingview-widget-container__widget"></div>
        <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" async>
          ${JSON.stringify(tickerTapeConfig)}
        </script>
      </div>
    </body>
    </html>
  `;

  // Advanced Chart native secure URL
  const chartIframeUrl = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(selectedSymbol)}&theme=dark&style=1&timezone=exchange&locale=en`;

  return (
    <div id="live-tradingview-terminal" className="w-full bg-[#030303] text-zinc-100 border border-zinc-900 rounded-xl p-5 md:p-6 font-sans select-none shadow-2xl relative">
      {/* Background dark grid line accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-25 rounded-xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* TOP LEVEL NEWS HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-600 text-white font-mono uppercase font-black text-[9px] px-1.5 py-0.5 rounded tracking-widest flex items-center gap-1 shadow-md shadow-emerald-950">
                <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping"></span> REAL-TIME TV TICKERS
              </span>
              <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">SECURE TRADINGVIEW GATEWAY</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase font-mono flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-emerald-500" />
              <span>LIVE GLOBAL MARKET TERMINAL</span>
            </h1>
          </div>

          <div className="text-right text-[10px] text-zinc-500 hidden sm:block font-mono">
            <div className="font-bold uppercase text-zinc-400">INSTANT DATA SYNCED</div>
            <div>STREAMS PROVIDER: TRADINGVIEW INC.</div>
          </div>
        </div>

        {/* 1. TRADINGVIEW TICKER TAPE BANNER */}
        <div className="w-full bg-[#09090b] border border-zinc-900/80 rounded-lg overflow-hidden h-[46px] flex items-center relative">
          <iframe
            srcDoc={tickerTapeSrcDoc}
            style={{ width: '100%', height: '46px', border: 'none', overflow: 'hidden' }}
            title="TradingView Ticker Tape Widget"
            scrolling="no"
          />
        </div>

        {/* 2. TAB CONTROLS */}
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-900/60 pb-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded text-[10px] font-black uppercase font-mono tracking-wider transition ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800'
            }`}
          >
            All Live Tickers ({activeTickers.length})
          </button>
          {activeCategories.slice(1).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded text-[10px] font-black uppercase font-mono tracking-wider transition ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800'
              }`}
            >
              {cat.label} ({activeTickers.filter(t => t.category === cat.id).length})
            </button>
          ))}
        </div>

        {/* CHART TOP PLACEMENT */}
        {chartLayoutPos === 'Top' && (
          <div className="w-full bg-[#09090b] border border-zinc-900 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest">ADVANCED TECHNICAL CHART - {selectedName}</span>
              <span className="text-[9px] font-mono font-bold text-zinc-500">{selectedSymbol}</span>
            </div>
            <div className="w-full h-[420px] bg-zinc-950 rounded-lg overflow-hidden">
              <iframe
                src={chartIframeUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={`TradingView Advanced Chart for ${selectedName}`}
              />
            </div>
          </div>
        )}

        {/* 3. CORE MULTI-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* LEFT INDEX SELECTOR SHEET */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase font-mono">FINANCIAL ASSET INDEXES</span>
              <span className="text-[10px] text-zinc-500 font-mono font-bold">SYMBOLS: {displayedTickers.length}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto pr-1 no-scrollbar">
              {displayedTickers.map((t, idx) => {
                const isSelected = selectedSymbol === t.symbol;
                return (
                  <div
                    key={`${t.symbol}-${idx}`}
                    onClick={() => {
                      setSelectedSymbol(t.symbol);
                      setSelectedName(t.name);
                    }}
                    className={`p-4 rounded-lg border text-left cursor-pointer transition relative group overflow-hidden flex flex-col justify-between h-[100px] ${
                      isSelected
                        ? 'bg-zinc-950 border-emerald-500 shadow-xl shadow-emerald-950/20'
                        : 'bg-[#050505] hover:bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    {isSelected && <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>}
                    
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase tracking-wider">{t.category}</span>
                      <span className="text-xs font-black text-white uppercase tracking-tight group-hover:text-emerald-500 transition line-clamp-2 mt-0.5">{t.name}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 font-mono">
                      <span className="text-[9px] font-bold text-zinc-500">{t.symbol}</span>
                      <span className="text-[9px] text-emerald-400 font-black uppercase flex items-center gap-0.5">
                        <Activity className="w-2.5 h-2.5 text-emerald-500 animate-pulse" /> LIVE STREAM
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDE CHART PLACEMENT */}
          {chartLayoutPos === 'Side' && (
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="bg-[#09090b] border border-zinc-900 p-4 rounded-xl flex flex-col gap-3 h-full justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 mb-2">
                    <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest">{selectedName}</span>
                    <span className="text-[9px] font-mono font-bold text-zinc-500">{selectedSymbol}</span>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-400 bg-[#040405] p-2.5 rounded border border-zinc-900 flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">FEED INTERVAL:</span>
                      <span className="text-white font-bold">1 DAY TICK</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">TRADING VIEW ID:</span>
                      <span className="text-white font-bold font-mono">{selectedSymbol}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-[320px] bg-zinc-950 rounded-lg overflow-hidden my-3 relative">
                  <iframe
                    src={chartIframeUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={`TradingView Advanced Chart for ${selectedName}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-900 font-mono">
                  <span>REAL-TIME ANALYSIS</span>
                  <span className="font-mono text-[9px] font-black text-emerald-500">CONNECTED</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CHART BOTTOM PLACEMENT */}
        {chartLayoutPos === 'Bottom' && (
          <div className="w-full bg-[#09090b] border border-zinc-900 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest">ADVANCED TECHNICAL CHART - {selectedName}</span>
              <span className="text-[9px] font-mono font-bold text-zinc-500">{selectedSymbol}</span>
            </div>
            <div className="w-full h-[420px] bg-zinc-950 rounded-lg overflow-hidden">
              <iframe
                src={chartIframeUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={`TradingView Advanced Chart for ${selectedName}`}
              />
            </div>
          </div>
        )}



      </div>
    </div>
  );
}
