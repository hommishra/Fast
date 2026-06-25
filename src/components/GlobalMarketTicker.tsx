import React, { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";

export default function GlobalMarketTicker() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic srcDoc template loading the official real-time TradingView widget
  // We keep the widget height strictly 46px (the natural tape height) so it renders perfectly.
  const tickerSrcDoc = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              overflow: hidden;
              background: #000000;
              height: 46px;
              width: 100%;
            }
            .tradingview-widget-container {
              width: 100%;
              height: 46px;
              overflow: hidden;
            }
            .tradingview-widget-container__widget {
              width: 100% !important;
              height: 46px !important;
            }
          </style>
        </head>
        <body>
          <div class="tradingview-widget-container">
            <div class="tradingview-widget-container__widget"></div>
            <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" async>
            {
              "symbols": [
                { "proName": "TVC:GOLD", "title": "GOLD SPOT" },
                { "proName": "TVC:USOIL", "title": "CRUDE OIL" },
                { "proName": "FX_IDC:USDINR", "title": "USD / INR" },
                { "proName": "FX:EURUSD", "title": "EUR / USD" },
                { "proName": "COINBASE:BTCUSD", "title": "BITCOIN USD" }
              ],
              "showSymbolLogo": false,
              "colorTheme": "dark",
              "isTransparent": true,
              "displayMode": "adaptive",
              "locale": "en"
            }
            </script>
          </div>
        </body>
      </html>
    `;
  }, []);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    // Force reload the iframe by incrementing key
    setRefreshKey((prev) => prev + 1);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  return (
    <div 
      className="bg-black border-y border-zinc-950 select-none relative z-20 w-full h-[60px] flex items-center overflow-hidden font-sans group" 
      id="global_market_tv_slider_container"
    >
      {/* 
        We render the iframe with a natural height of 46px (where TradingView doesn't render any logo)
        inside our normal sized 60px container, keeping it perfectly crisp and standard sized.
      */}
      <div className="relative w-full h-[46px] flex items-center overflow-hidden pointer-events-auto">
        <iframe
          key={refreshKey}
          srcDoc={tickerSrcDoc}
          style={{
            width: "100%",
            height: "46px",
          }}
          className="overflow-hidden border-none"
          title="TradingView Live Ticker Tape Feed"
          sandbox="allow-scripts allow-same-origin"
          id="global_market_tv_iframe"
        />
      </div>

      {/* Sleek Hover Manual Refresh Button */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center p-2 rounded-full bg-zinc-900/95 border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
          title="Refresh live asset indices"
          id="global_market_refresh_button"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin text-emerald-400" : ""} />
        </button>
      </div>
    </div>
  );
}
