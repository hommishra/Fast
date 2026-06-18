import React, { useState } from "react";
import { CoverageZone } from "../types";
import { Globe, ShieldAlert, CheckCircle, Radio, Trash2, MapPin, Plus, User, Info, Crosshair } from "lucide-react";

interface ActiveSectionsMapProps {
  zones: CoverageZone[];
  isAdmin?: boolean;
  onAddZone?: (zone: Omit<CoverageZone, "id" | "createdAt">) => Promise<void>;
  onDeleteZone?: (id: string) => Promise<void>;
}

export default function ActiveSectionsMap({
  zones,
  isAdmin = false,
  onAddZone,
  onDeleteZone,
}: ActiveSectionsMapProps) {
  // Add pin form state
  const [name, setName] = useState("");
  const [x, setX] = useState<number>(50);
  const [y, setY] = useState<number>(50);
  const [status, setStatus] = useState<CoverageZone["status"]>("active");
  const [reporterName, setReporterName] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedZone, setSelectedZone] = useState<CoverageZone | null>(null);

  // Drag/click coordinates selection on the SVG map
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isAdmin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Round to 1 decimal place
    setX(Math.round(clickX * 10) / 10);
    setY(Math.round(clickY * 10) / 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !onAddZone) return;

    setSaving(true);
    try {
      await onAddZone({
        name: name.trim(),
        x,
        y,
        status,
        reporterName: reporterName.trim() || undefined,
        details: details.trim() || undefined,
      });

      // Reset
      setName("");
      setReporterName("");
      setDetails("");
      setX(50);
      setY(50);
    } catch (err) {
      console.error("Failed to append zone pin:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="coverage_sections_map_module">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Map Projection Canvas */}
        <div className="lg:col-span-2 bg-neutral-950 border border-neutral-900 rounded-xl p-4 shadow-xl relative overflow-hidden group">
          {/* technical futuristic overlay details */}
          <div className="absolute top-3 left-3 z-10 select-none pointer-events-none font-mono text-[9px] text-neutral-400 space-y-0.5">
            <p className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-650 rounded-full animate-ping" />
              SATELLITE DOWNLINK ACTIVE
            </p>
            <p className="text-neutral-600">SYS_COORDS: WGS-84 / GLOBAL GRID</p>
          </div>
          
          <div className="absolute top-3 right-3 z-10 select-none pointer-events-none font-mono text-[9px] text-neutral-500">
            <span>ZOOM: GLOBAL PROJECTION (1.0x)</span>
          </div>

          {/* SVG Map Projection */}
          <div className="relative aspect-[16/9] w-full border border-neutral-900 bg-neutral-950/60 rounded-lg overflow-hidden mt-6">
            {/* Styled Technical Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-10 pointer-events-none">
              {Array.from({ length: 72 }).map((_, i) => (
                <div key={i} className="border-t border-l border-neutral-500 text-[6px] font-mono p-0.5 text-neutral-500 select-none" />
              ))}
            </div>

            <svg
              className="w-full h-full relative cursor-crosshair select-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              onClick={handleMapClick}
            >
              {/* Continents outlines - Designed representational contour blocks */}
              {/* North America */}
              <path
                d="M 5,20 Q 15,10 25,12 T 32,25 T 30,35 T 20,40 T 10,38 Z"
                fill="#262626"
                stroke="#404040"
                strokeWidth={0.3}
                className="transition-colors duration-300 hover:fill-neutral-800"
              />
              <path
                d="M 24,12 Q 28,5 30,15 T 33,8 Z"
                fill="#262626"
                stroke="#404040"
                strokeWidth={0.3}
              />
              {/* Central/South America */}
              <path
                d="M 20,40 Q 25,48 26,55 T 32,65 T 28,82 T 26,92 T 24,80 T 18,52 T 20,40 Z"
                fill="#262626"
                stroke="#404040"
                strokeWidth={0.3}
              />
              {/* Africa */}
              <path
                d="M 40,43 Q 50,38 52,48 T 54,62 T 48,78 T 42,65 T 38,50 Z"
                fill="#262626"
                stroke="#404040"
                strokeWidth={0.3}
              />
              {/* Europe & Asia */}
              <path
                d="M 33,26 Q 40,15 50,16 T 65,12 T 80,18 T 92,26 T 85,45 T 75,48 T 60,38 T 48,32 T 33,26 Z"
                fill="#261a1a"
                stroke="#5c2626"
                strokeWidth={0.3}
              />
              <path
                d="M 68,36 Q 78,38 88,40 T 92,55 T 84,65 T 74,55 T 68,36 Z"
                fill="#262626"
                stroke="#404040"
                strokeWidth={0.3}
              />
              {/* Australia */}
              <path
                d="M 75,70 Q 82,68 88,72 T 86,85 T 74,80 T 75,70 Z"
                fill="#262626"
                stroke="#404040"
                strokeWidth={0.3}
              />
              
              {/* Click Crosshair helper for admin */}
              {isAdmin && (
                <g className="animate-pulse">
                  <line x1={x} y1={0} x2={x} y2={100} stroke="#dc2626" strokeWidth={0.15} strokeDasharray="1 1" />
                  <line x1={0} y1={y} x2={100} y2={y} stroke="#dc2626" strokeWidth={0.15} strokeDasharray="1 1" />
                  <circle cx={x} cy={y} r={1.5} fill="none" stroke="#dc2626" strokeWidth={0.3} />
                  <circle cx={x} cy={y} r={0.4} fill="#dc2626" />
                </g>
              )}

              {/* Dynamic mapped zones */}
              {zones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                let color = "#10b981"; // active
                if (zone.status === "alert") color = "#ef4444"; // alert
                if (zone.status === "offline") color = "#6b7280"; // offline

                return (
                  <g
                    key={zone.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZone(zone);
                    }}
                    className="cursor-pointer group/pin"
                  >
                    {/* Pulsing beacon circles */}
                    {zone.status !== "offline" && (
                      <circle
                        cx={zone.x}
                        cy={zone.y}
                        r={isSelected ? 4 : 2.5}
                        fill="none"
                        stroke={color}
                        strokeWidth={0.3}
                        className="animate-ping"
                        style={{ transformOrigin: `${zone.x}% ${zone.y}%`, animationDuration: "2s" }}
                      />
                    )}
                    
                    {/* Interactive Pin base */}
                    <circle
                      cx={zone.x}
                      cy={zone.y}
                      r={isSelected ? 1.6 : 1.1}
                      fill={color}
                      className="transition-all duration-300 group-hover/pin:scale-120 group-hover/pin:fill-blue-500"
                    />

                    {/* Simple Tooltip Label */}
                    <text
                      x={zone.x}
                      y={zone.y - 2.5}
                      textAnchor="middle"
                      fill="#f5f5f5"
                      fontSize="2.2"
                      fontWeight="bold"
                      className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] opacity-80 pointer-events-none select-none font-mono"
                    >
                      {zone.name}
                    </text>
                  </g>
                );
              })}
            </svg>
            
            {/* Click to pick tooltip helper */}
            {isAdmin && (
              <div className="absolute bottom-2 left-2 bg-black/85 text-white p-1 rounded border border-neutral-800 text-[8px] font-mono z-10 pointer-events-none">
                <span className="text-red-500 font-extrabold mr-1">PRO-TIP:</span>
                <span>Click anywhere on coordinates above to auto-fill location pin coordinates ({x}%, {y}%)</span>
              </div>
            )}
          </div>

          {/* Selected pin dynamic description box */}
          {selectedZone ? (
            <div className="mt-4 p-4 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3 animate-fadeIn text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedZone.status === "active" ? "bg-emerald-500" : selectedZone.status === "alert" ? "bg-red-500" : "bg-neutral-500"
                  }`} />
                  <h4 className="font-sans font-black text-sm tracking-tight">{selectedZone.name}</h4>
                  <span className="text-[9px] font-mono uppercase bg-neutral-800 px-1.5 py-0.5 text-neutral-400 rounded">
                    X:{selectedZone.x}% Y:{selectedZone.y}%
                  </span>
                </div>
                
                {selectedZone.reporterName && (
                  <p className="text-neutral-300 text-xs flex items-center gap-1 pt-1 font-sans">
                    <User size={13} className="text-red-650" />
                    <span className="font-bold text-[10px] text-neutral-400 font-mono">CORRESPONDENT:</span> {selectedZone.reporterName}
                  </p>
                )}

                {selectedZone.details ? (
                  <p className="text-neutral-400 text-xs mt-1.5 font-sans leading-relaxed flex items-start gap-1 pb-1">
                    <Info size={13} className="shrink-0 text-slate-500 mt-0.5" />
                    <span>{selectedZone.details}</span>
                  </p>
                ) : (
                  <p className="text-neutral-500 text-[11px] italic font-mono pt-1">No local incidents reported. Routine bureau patrol check complete.</p>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {isAdmin && onDeleteZone && (
                  <button
                    onClick={async () => {
                      try {
                        await onDeleteZone(selectedZone.id);
                        setSelectedZone(null);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="bg-red-950/40 hover:bg-red-950 text-red-400 p-2 border border-red-500/20 rounded-md transition text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={13} /> Remove Incident
                  </button>
                )}
                <button
                  onClick={() => setSelectedZone(null)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 text-xs font-mono uppercase rounded transition cursor-pointer"
                >
                  Close Info
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-center italic text-neutral-500 py-3 select-none font-mono mt-4">
              Click any reporting beacon pulsing above to read localized incident details, live broadcast reports, and on-scene correspondents.
            </p>
          )}
        </div>

        {/* Info panel / Admin Creation Block */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
          {isAdmin && onAddZone ? (
            <div className="space-y-4">
              <h3 className="text-xs font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 select-none font-bold flex items-center gap-1.5">
                <Crosshair size={14} className="text-red-700" />
                CREATE COVERAGE ZONE
              </h3>

              <form onSubmit={handleSubmit} className="space-y-3.5 text-neutral-850">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono">Location/Zone Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zurich Bureau, Gulf Area"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded p-2 text-xs font-sans focus:outline-none focus:border-red-655"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono">Coordinate X (%)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      step="0.1"
                      value={x}
                      onChange={(e) => setX(parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded p-2 text-xs font-mono focus:outline-none focus:border-red-655 text-center"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono">Coordinate Y (%)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      step="0.1"
                      value={y}
                      onChange={(e) => setY(parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded p-2 text-xs font-mono focus:outline-none focus:border-red-655 text-center"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono">Focal Incident Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white border border-neutral-300 rounded p-2 text-xs font-sans focus:outline-none focus:border-red-655 cursor-pointer font-bold"
                  >
                    <option value="active" className="text-emerald-600 font-bold">🟢 Active Report Station</option>
                    <option value="alert" className="text-red-600 font-bold">🔴 Red Alert Priority Corridor</option>
                    <option value="offline" className="text-neutral-500 font-bold">⚫ Standby Office Station</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono">Lead On-scene Correspondent</label>
                  <input
                    type="text"
                    placeholder="e.g. Richard Engel"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded p-2 text-xs font-sans focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono">Flash details summary</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Live telemetry feedback confirming military shifts..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded p-2 text-xs font-sans focus:outline-none leading-relaxed resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-red-700 hover:bg-red-800 text-white font-sans text-[10px] font-extrabold uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition shadow"
                >
                  <Plus size={12} /> {saving ? "Pinning Location..." : "Add Coverage Pin"}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-mono tracking-widest text-slate-900 uppercase border-b border-neutral-100 pb-3 select-none font-bold flex items-center gap-1.5">
                <Globe size={14} className="text-blue-600 animate-spin-slow" />
                GLOBAL REPORTING DEPOT
              </h3>
              
              <div className="space-y-2.5">
                <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                  Fast Coverage maintains dynamic telecommunication links across various strategic sectors globally.
                </p>
                
                <div className="divide-y divide-neutral-100 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className="py-2.5 flex items-center justify-between hover:bg-neutral-50 px-1 rounded transition cursor-pointer group"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-extrabold text-neutral-805 group-hover:text-blue-600 transition-colors block">
                          {zone.name}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-400">Coords: {zone.x}%, {zone.y}%</span>
                      </div>
                      
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase font-mono tracking-wider ${
                        zone.status === "active" ? "bg-emerald-100 text-emerald-800" : zone.status === "alert" ? "bg-red-100 text-red-800 animate-pulse" : "bg-neutral-100 text-neutral-600"
                      }`}>
                        {zone.status}
                      </span>
                    </div>
                  ))}
                  {zones.length === 0 && (
                    <p className="text-[11px] text-neutral-400 italic font-mono pt-4 text-center">No coverage locations tracked on server.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
