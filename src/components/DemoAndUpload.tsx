import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, MapPin, Search, Sparkles } from "lucide-react";
import { DEMO_PHOTOS, DemoPhoto } from "../data";
import { supabase } from "../supabase";

interface DemoAndUploadProps {
  onPhotoSelected: (file: File | null, demoPhoto: DemoPhoto | null) => void;
  credits: number;
  onOpenCheckout: () => void;
}

export default function DemoAndUpload({ onPhotoSelected, credits, onOpenCheckout }: DemoAndUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [liveEntries, setLiveEntries] = useState<any[]>([]);

  useEffect(() => {
    const fetchGlobalEntries = async () => {
      try {
        const { data, error } = await supabase
          .from("entries")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6);

        if (!error && data) {
          setLiveEntries(data);
        }
      } catch (err) {
        console.warn("Offline fallback for landing feed:", err);
      }
    };

    fetchGlobalEntries();

    // Setup real-time channel subscription for instant landing posts update
    const channel = supabase
      .channel("landing-entries-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "entries" },
        (payload) => {
          console.log("Instant feed update detected!", payload.new);
          setLiveEntries((prev) => {
            if (prev.some((item) => item.id === payload.new.id)) return prev;
            return [payload.new, ...prev.slice(0, 5)];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        triggerSelection(file, null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerSelection(e.target.files[0], null);
    }
  };

  const triggerSelection = (file: File | null, demo: DemoPhoto | null) => {
    if (credits <= 0) {
      onOpenCheckout();
    } else {
      onPhotoSelected(file, demo);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="text-center max-w-xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-[10px] font-bold rounded-full uppercase tracking-widest font-mono mx-auto shadow-sm border border-orange-200/40">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
          Find the shot. Own the moment.
        </div>
        <h2 className="text-4xl font-black text-slate-950 tracking-tight leading-tight">
          Find the Perfect Spot <br />
          with <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent italic">Spotgram</span>
        </h2>
        <p className="text-slate-600 text-xs font-medium leading-relaxed max-w-lg mx-auto">
          Drop any photo and we'll find exactly where it was taken — using hidden location data or by reading the landscape itself.
        </p>
      </div>

      {/* Main Drag-and-Drop Area & Form */}
      <div className="grid md:grid-cols-5 gap-6 items-stretch max-w-5xl mx-auto">
        <div className="md:col-span-3">
          <div
            id="dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-full border border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-orange-500 bg-orange-50/20 scale-[0.99] shadow-inner"
                : "border-slate-200 hover:border-orange-300 bg-white hover:shadow-sm"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? "bg-orange-100 text-orange-600" : "bg-orange-50/60 text-orange-500 group-hover:bg-orange-100/80 group-hover:text-orange-600"}`}>
              <UploadCloud className="w-8 h-8" />
            </div>

            <p className="text-sm font-bold text-slate-900">Drag & drop your photograph here</p>
            <p className="text-[11px] text-slate-400 mt-1 mb-6 uppercase tracking-wider font-semibold">JPEG, PNG, or WEBP (up to 15MB)</p>
            
            <button
              type="button"
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 active:scale-95 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/25 cursor-pointer"
            >
              Browse Local Files
            </button>
          </div>
        </div>

        {/* Info panel on how to grab coordinates */}
        <div className="md:col-span-2 bg-gradient-to-b from-orange-50/30 to-amber-50/10 rounded-2xl border border-orange-100/50 p-8 flex flex-col justify-between shadow-xs">
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
              How it works
            </h3>
            
            <div className="space-y-5">
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-600 to-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">1</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Decode EXIF Metadata</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">We inspect the image's embedded database markers to securely pull precise camera lat/lng fields.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-600 to-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">2</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">AI Vision Landmark Scanner</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">If metadata was stripped (like social media images), Gemini matches building contours or horizons.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-600 to-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">3</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Travel Guide & Routing</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Explore interactive maps, golden hours, sunrise targets, hire local guide matches, and chart walking routes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-orange-100 text-[10px] text-orange-650 font-mono flex items-center gap-1.5 justify-center">
            <span>Locked Secure Client Environment</span>
            <span>•</span>
            <span>Credits: {credits === Infinity ? "Unlimited" : credits}</span>
          </div>
        </div>
      </div>

      {/* Preset Demo Photos Grid */}
      <div className="max-w-5xl mx-auto space-y-6 pt-8 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-950">No photos ready? Try these beautiful presets</h3>
            <p className="text-xs text-slate-405 mt-1">Selected presets demo each of the distinct EXIF and AI workflow branches</p>
          </div>
          <span className="px-3 py-1 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-full text-[10px] font-bold text-orange-800 flex items-center gap-1">
            <Search className="w-3 h-3 text-orange-500" /> Quick Test
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-500">
          {DEMO_PHOTOS.map((demo) => (
            <div
              key={demo.id}
              onClick={() => triggerSelection(null, demo)}
              className="bg-white rounded-2xl border border-slate-150 overflow-hidden cursor-pointer hover:border-orange-300 hover:scale-[1.01] hover:shadow-md hover:shadow-orange-600/5 transition-all group"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
                <img
                  src={demo.url}
                  alt={demo.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-md ${
                  demo.hasExif ? "bg-orange-600/90" : "bg-teal-600/90"
                }`}>
                  {demo.hasExif ? "Intact EXIF" : "No GPS EXIF"}
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{demo.name}</h4>
                <p className="text-[10px] text-slate-405 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-500" />
                  {demo.country} — {demo.hasExif ? "Intact coordinates" : "Requires AI search"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Global Activity Feed Box */}
      {liveEntries.length > 0 && (
        <div className="max-w-5xl mx-auto space-y-4 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f97316] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f97316]"></span>
              </span>
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider font-sans">Live Spotgram Traveler Activity</h3>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Live updates active via Supabase
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveEntries.map((item) => {
              let comps = 0;
              try {
                const parsed = JSON.parse(item.planned_activities || "[]");
                comps = Array.isArray(parsed) ? parsed.length : 0;
              } catch {
                comps = 0;
              }

              return (
                <div 
                  key={item.id} 
                  className="bg-white/85 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-200 hover:shadow-xs transition-all animate-in fade-in scale-in duration-300"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-extrabold text-slate-905 truncate block max-w-[190px]">
                        📍 {item.spot_name}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 font-semibold uppercase">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic">
                      {item.visit_notes ? `"${item.visit_notes}"` : "Explored and logged this landmark."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-3 text-[9px] font-mono">
                    <span className="font-bold flex items-center gap-1 text-slate-600 capitalize">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.crowd_level === "quiet" ? "bg-green-500" : item.crowd_level === "moderate" ? "bg-amber-500" : "bg-red-500"}`}></span>
                      {item.crowd_level || "moderate"}
                    </span>
                    <span className="text-orange-650 font-bold">
                      {comps} camera missions
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
