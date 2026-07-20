import { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, Wind, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface WeatherItem {
  city: string;
  temp: string;
  desc: string;
}

interface MarketItem {
  name: string;
  value: string;
  change: string;
  isUp: boolean;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherItem[]>([
    { city: "New York", temp: "22°C", desc: "Sunny" },
    { city: "London", temp: "15°C", desc: "Rainy" },
    { city: "New Delhi", temp: "34°C", desc: "Humid" },
    { city: "Tokyo", temp: "20°C", desc: "Cloudy" }
  ]);

  const [markets, setMarkets] = useState<MarketItem[]>([
    { name: "DOW", value: "39,122.40", change: "+1.31%", isUp: true },
    { name: "NASDAQ", value: "16,274.94", change: "+1.82%", isUp: true },
    { name: "S&P 500", value: "5,211.49", change: "+0.89%", isUp: true },
    { name: "NIFTY 50", value: "22,513.70", change: "+1.15%", isUp: true },
    { name: "GOLD", value: "$2,342.10", change: "+0.45%", isUp: true }
  ]);

  useEffect(() => {
    // Attempt load from express endpoints
    fetch('/api/weather')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setWeather(data.slice(0, 4)); })
      .catch(() => {}); // Fallback cleanly to default state

    fetch('/api/markets')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setMarkets(data); })
      .catch(() => {}); // Fallback cleanly to default state
  }, []);

  const getWeatherIcon = (desc: string) => {
    switch (desc.toLowerCase()) {
      case 'sunny': return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'rainy': return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
      case 'windy': return <Wind className="w-3.5 h-3.5 text-slate-400" />;
      default: return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div id="weather-market-strip" className="w-full bg-slate-50 dark:bg-editorial-dark border-b border-slate-200 dark:border-white/5 text-slate-700 dark:text-editorial-text py-1.5 px-4 text-xs flex flex-wrap items-center justify-between gap-4 font-sans selection:bg-editorial-accent shrink-0">
      
      {/* Financial indices ticker strip */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-0.5 max-w-full md:max-w-[60%]">
        <span className="text-[10px] uppercase font-black text-slate-400 dark:text-editorial-text/40 font-mono tracking-wider shrink-0 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-editorial-accent" /> Markets:
        </span>
        <div className="flex items-center gap-3.5 shrink-0">
          {markets.map((m) => (
            <div key={m.name} className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
              <span className="font-bold text-slate-600 dark:text-editorial-text/70">{m.name}</span>
              <span className="text-slate-900 dark:text-editorial-text font-medium">{m.value}</span>
              <span className={`flex items-center gap-0.5 font-bold ${m.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-editorial-accent'}`}>
                {m.isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {m.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Global cities weather strip */}
      <div className="hidden md:flex items-center gap-4 py-0.5 shrink-0">
        <span className="text-[10px] uppercase font-black text-slate-400 dark:text-editorial-text/40 font-mono tracking-wider">Bureaus:</span>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          {weather.map((w) => (
            <div key={w.city} className="flex items-center gap-1.5 border-r border-slate-200 dark:border-white/5 pr-3 last:border-0 last:pr-0">
              <span className="text-slate-600 dark:text-editorial-text/70 font-bold">{w.city}</span>
              {getWeatherIcon(w.desc)}
              <span className="text-slate-900 dark:text-editorial-text font-bold">{w.temp}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
