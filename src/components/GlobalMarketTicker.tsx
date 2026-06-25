import React, { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";

export default function GlobalMarketTicker() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic srcDoc template loading the official real-time TradingView widget
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
              height: 100%;
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .tradingview-widget-container {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              position: relative;
            }
            /* Scale up the TradingView widget so the price digits look massive and premium */
            .tradingview-widget-container__widget {
              width: 57.14% !important; /* 100 / 1.75 */
              height: 57.14% !important;
              transform: scale(1.75);
              transform-origin: center center;
              position: absolute;
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
      className="bg-black border-y border-zinc-950 select-none relative z-20 w-full h-[110px] overflow-hidden font-sans group" 
      id="global_market_tv_slider_container"
    >
      {/* 
        We use an absolute iframe with a larger height (170px) positioned at top: -30px 
        inside a container of height 110px. This crops 30px off both the top and bottom of the iframe, 
        completely cutting off and hiding any TradingView logo, branding watermarks, or copyrights 
        while keeping the ticker tape perfectly centered.
      */}
      <div className="relative w-full h-[110px] overflow-hidden pointer-events-auto">
        <iframe
          key={refreshKey}
          srcDoc={tickerSrcDoc}
          className="absolute left-0 w-full h-[170px] top-[-30px] overflow-hidden border-none"
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
          className="flex items-center justify-center p-3 rounded-full bg-zinc-900/95 border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
          title="Refresh live asset indices"
          id="global_market_refresh_button"
        >
          <RefreshCw size={18} className={isRefreshing ? "animate-spin text-emerald-400" : ""} />
        </button>
      </div>
    </div>
  );
}
