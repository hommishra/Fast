import React, { useState, useEffect } from 'react';
import { MarketItem } from '../types';
import { TrendingUp, TrendingDown, RefreshCw, BarChart2, Check, AlertCircle } from 'lucide-react';

interface GlobalMarketsProps {
  markets: MarketItem[];
  onUpdateMarkets?: (updated: MarketItem[]) => void;
}

export default function GlobalMarkets({ markets, onUpdateMarkets }: GlobalMarketsProps) {
  const [selectedMarket, setSelectedMarket] = useState<MarketItem | null>(null);
  const [chartData, setChartData] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filter active markets and sort by position
  const activeMarkets = markets
    .filter((m) => m.active)
    .sort((a, b) => a.position - b.position);

  // Generate random mock historical data for the selected chart
  const generateHistoricalData = (baseVal: string, isUp: boolean) => {
    const cleanVal = parseFloat(baseVal.replace(/[^0-9.]/g, ''));
    const dataPoints: number[] = [];
    let current = cleanVal * (isUp ? 0.96 : 1.04);
    
    for (let i = 0; i < 20; i++) {
      const changePercent = (Math.random() - 0.48) * 0.015; // Random walk
      current = current * (1 + changePercent);
      dataPoints.push(current);
    }
    // Final point matches current value
    dataPoints.push(cleanVal);
    return dataPoints;
  };

  // Select initial market
  useEffect(() => {
    if (activeMarkets.length > 0 && !selectedMarket) {
      setSelectedMarket(activeMarkets[0]);
    }
  }, [activeMarkets, selectedMarket]);

  // Update chart data when market changes
  useEffect(() => {
    if (selectedMarket) {
      setChartData(generateHistoricalData(selectedMarket.value, selectedMarket.isUp));
    }
  }, [selectedMarket]);

  // Simulated live ticker fluctuations to represent actual live markets
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setIsRefreshing(true);
      
      const updated = markets.map((m) => {
        if (!m.active) return m;
        // Float the value slightly
        const numericStr = m.value.replace(/[^0-9.]/g, '');
        const currentVal = parseFloat(numericStr);
        if (isNaN(currentVal)) return m;

        const isCurrencyOrCommodity = m.name.includes('/') || m.name === 'Gold' || m.name === 'Silver';
        const percentChange = (Math.random() - 0.5) * (isCurrencyOrCommodity ? 0.001 : 0.002); // Tame fluctuations
        const newVal = currentVal * (1 + percentChange);
        
        // Format string properly
        let formattedVal = '';
        if (m.name === 'Gold' || m.name === 'Silver') {
          formattedVal = `$${newVal.toFixed(2)}`;
        } else if (m.name.includes('/')) {
          formattedVal = newVal.toFixed(4);
        } else if (newVal > 1000) {
          formattedVal = newVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
          formattedVal = newVal.toFixed(2);
        }

        // Fluctuate the percent change too
        const oldChangeStr = m.change.replace(/[^0-9.-]/g, '');
        const currentChange = parseFloat(oldChangeStr);
        const newChangeVal = currentChange + (percentChange * 100);
        const formattedChange = `${newChangeVal >= 0 ? '+' : ''}${newChangeVal.toFixed(2)}%`;

        return {
          ...m,
          value: formattedVal,
          change: formattedChange,
          isUp: newChangeVal >= 0
        };
      });

      if (onUpdateMarkets) {
        onUpdateMarkets(updated);
      }

      // Update active chart as well
      if (selectedMarket) {
        const currentlySelected = updated.find((m) => m.id === selectedMarket.id);
        if (currentlySelected) {
          setSelectedMarket(currentlySelected);
        }
      }

      setTimeout(() => setIsRefreshing(false), 800);
    }, 4500);

    return () => clearInterval(interval);
  }, [markets, autoRefresh, selectedMarket, onUpdateMarkets]);

  if (activeMarkets.length === 0) return null;

  // Render quick sparkline using simple SVG path
  const renderSparkline = (points: number[], isPositive: boolean) => {
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 100;
    const height = 30;
    
    const svgPoints = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-20 h-8 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={isPositive ? '#10B981' : '#EF4444'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={svgPoints}
        />
      </svg>
    );
  };

  // Render the comprehensive interactive Bloomberg-style chart
  const renderBloombergChart = () => {
    if (!selectedMarket || chartData.length === 0) return null;
    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min || 1;
    const width = 500;
    const height = 150;

    const pointsPath = chartData.map((val, idx) => {
      const x = (idx / (chartData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 20) - 10;
      return `${x},${y}`;
    }).join(' L ');

    const areaPath = `${pointsPath} L ${width},${height} L 0,${height} Z`;

    return (
      <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex flex-col gap-3 font-mono relative overflow-hidden">
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 grid grid-rows-5 grid-cols-10 pointer-events-none opacity-5">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="border-t border-l border-white"></div>
          ))}
        </div>

        {/* Chart header details */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">BLOOMBERG DIRECT FEED</span>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">{selectedMarket.name}</h4>
          </div>
          <div className="text-right">
            <span className={`text-base font-black ${selectedMarket.isUp ? 'text-emerald-400' : 'text-red-500'}`}>
              {selectedMarket.value}
            </span>
            <p className={`text-[11px] font-bold ${selectedMarket.isUp ? 'text-emerald-500' : 'text-red-400'}`}>
              {selectedMarket.change}
            </p>
          </div>
        </div>

        {/* Real interactive SVG Chart */}
        <div className="w-full relative z-10 h-[150px] mt-2">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* Gradient Area Fill */}
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={selectedMarket.isUp ? '#10B981' : '#EF4444'} stopOpacity="0.25" />
                <stop offset="100%" stopColor={selectedMarket.isUp ? '#10B981' : '#EF4444'} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Helper Horizontal Lines */}
            <line x1="0" y1={height / 4} x2={width} y2={height / 4} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
            <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
            <line x1="0" y1={(height / 4) * 3} x2={width} y2={(height / 4) * 3} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />

            {/* Gradient path */}
            <path d={`M 0,${height} L ${areaPath}`} fill="url(#chartGrad)" />

            {/* Main Sparkline Polyline */}
            <path
              d={`M ${pointsPath}`}
              fill="none"
              stroke={selectedMarket.isUp ? '#10B981' : '#EF4444'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Tracking Circle at latest point */}
            <circle
              cx={width}
              cy={height - ((chartData[chartData.length - 1] - min) / range) * (height - 20) - 10}
              r="4"
              fill={selectedMarket.isUp ? '#10B981' : '#EF4444'}
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* Chart Footer metadata */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-neutral-800 relative z-10">
          <span className="font-bold flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block"></span>
            LIVE TICKING
          </span>
          <span>INTERVAL: 4.5S • AUTO</span>
          <span>UTC: {new Date().toISOString().substring(11, 19)}</span>
        </div>
      </div>
    );
  };

  return (
    <div id="live-global-markets" className="w-full bg-[#0a0a0a] text-zinc-100 border-b border-zinc-800 p-4 md:p-6 font-sans relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-5">
        
        {/* Header containing metadata, buttons & live indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="bg-red-700 text-white font-mono uppercase font-black text-[9px] px-2 py-0.5 rounded tracking-[0.2em] flex items-center gap-1 shadow-md shadow-red-700/20">
              <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse"></span> BLOOMBERG FEED
            </span>
            <h2 className="text-xs md:text-sm font-black uppercase text-white tracking-[0.25em] font-mono flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-red-600" />
              <span>LIVE GLOBAL MARKET LEADERBOARD</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <label className="flex items-center gap-2 text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-red-600 rounded cursor-pointer"
              />
              <span>AUTO REFRESH</span>
            </label>
            <div className="flex items-center gap-1.5 text-zinc-500">
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-500' : ''}`} />
              <span>{isRefreshing ? 'REFRESHING...' : 'LIVE FEED'}</span>
            </div>
          </div>
        </div>

        {/* Primary View: Flex Row of spark cards + Bloomberg details panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Scrollable grid list of market cards (takes 2 cols on lg) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 no-scrollbar max-h-[340px] overflow-y-auto pr-1">
              {activeMarkets.map((m) => {
                const isSelected = selectedMarket?.id === m.id;
                const mockHistory = generateHistoricalData(m.value, m.isUp);
                
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMarket(m)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition flex flex-col gap-2 relative group overflow-hidden ${
                      isSelected
                        ? 'bg-neutral-900 border-red-700 shadow-md shadow-red-950/20'
                        : 'bg-neutral-950 hover:bg-neutral-900/65 border-zinc-800'
                    }`}
                  >
                    {/* Glowing highlight bar on select */}
                    {isSelected && <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>}

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight truncate">
                        {m.name}
                      </span>
                      <span className="text-xs md:text-sm font-black text-white font-mono tracking-tight">
                        {m.value}
                      </span>
                    </div>

                    {/* Sparkline & percentage */}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span
                        className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded ${
                          m.isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {m.change}
                      </span>
                      {renderSparkline(mockHistory, m.isUp)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Large interactive chart side card (takes 1 col on lg) */}
          <div className="lg:col-span-1 flex flex-col justify-between">
            {selectedMarket ? (
              renderBloombergChart()
            ) : (
              <div className="bg-neutral-950 border border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2 h-full">
                <AlertCircle className="w-8 h-8 text-zinc-600 animate-pulse" />
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider font-mono">
                  SELECT A TICKER TO INSPECT LIVE CHART
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
