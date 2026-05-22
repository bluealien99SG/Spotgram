import React, { useState, useEffect } from "react";
import { MessageSquare, Sparkles, Send, MapPin, Users, Globe, ExternalLink } from "lucide-react";
import { supabase } from "../supabase";
import { DiscussionEmbed } from "disqus-react";

export default function SocialHub() {
  const [entries, setEntries] = useState<any[]>([]);
  const [spotName, setSpotName] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [crowdLevel, setCrowdLevel] = useState("moderate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch initial logs from Supabase entries table & subscribe to real-time additions
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from("entries")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);

        if (!error && data) {
          setEntries(data);
        }
      } catch (err) {
        console.warn("Could not load initial social feed database entries:", err);
      }
    };

    fetchLogs();

    // Subscribe to Postgres database stream changes via Supabase channel in real time
    const channel = supabase
      .channel("social-hub-postgres-entries")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "entries" },
        (payload) => {
          console.log("Social Hub: Postgres Realtime Insert event!", payload.new);
          setEntries((prev) => {
            if (prev.some((item) => item.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotName.trim()) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);

    // Randomized approximate scenic coordinates or fallback values for social post headers
    const latOffset = (Math.random() - 0.5) * 5;
    const lngOffset = (Math.random() - 0.5) * 5;
    const approxLat = 23.5 + latOffset; // Approximate default coords in Scenic Taiwan/Asia range
    const approxLng = 121.0 + lngOffset;

    const newRow = {
      spot_name: spotName,
      latitude: parseFloat(approxLat.toFixed(5)),
      longitude: parseFloat(approxLng.toFixed(5)),
      crowd_level: crowdLevel,
      visit_notes: visitNotes,
      planned_activities: JSON.stringify(["Sightseeing", "Photography"]),
      passport_id: `SG-POST-${Math.floor(Math.random() * 90000 + 10000)}`,
      user_email: "bisz98@gmail.com"
    };

    try {
      const { data, error } = await supabase
        .from("entries")
        .insert([newRow])
        .select();

      if (!error) {
        setSubmitSuccess(true);
        setSpotName("");
        setVisitNotes("");
        setCrowdLevel("moderate");
        if (data && data.length > 0) {
          setEntries((prev) => {
            if (prev.some((u) => u.id === data[0].id)) return prev;
            return [data[0], ...prev];
          });
        }
      } else {
        console.error("Supabase social insert error:", error.message);
      }
    } catch (err) {
      console.error("Social hub backend communication failure:", err);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitSuccess(false), 3000);
    }
  };

  // Safe mock props structure to reflect custom requirements inside Disqus React Embed
  const article = {
    url: typeof window !== "undefined" ? window.location.href : "https://spotgram-vercel.app",
    id: "spotgram-global-social-discussion",
    title: "Spotgram Photo & Travel Community Discussions"
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-3 duration-350">
      
      {/* Intro Header */}
      <div className="text-center max-w-xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-[10px] font-bold rounded-full uppercase tracking-widest font-mono mx-auto shadow-sm border border-orange-200/40">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
          WORLDWIDE SCENIC CHATROOM & DISPATCH
        </div>
        <h2 className="text-4xl font-black text-slate-950 tracking-tight leading-tight">
          Spotgram Social Forum
        </h2>
        <p className="text-slate-600 text-xs font-medium leading-relaxed max-w-lg mx-auto">
          Share your photographic discoveries, exchange sunset angle secrets, or coordinate cameras with explorers worldwide in our live discussion thread below.
        </p>
      </div>

      {/* Grid container: Post checkin / feed row */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Post a check-in interface */}
        <div className="bg-white/90 border border-orange-100 rounded-3xl p-6 shadow-sm border-t-4 border-t-orange-500/70 h-fit space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-black uppercase text-slate-950 tracking-wider">Broadcast Spot Dispatch</h3>
          </div>
          <p className="text-[10px] text-slate-450 leading-relaxed font-medium">
            Broadcast any photography spot you've researched or visited. It will immediately publish live on every traveler's feed!
          </p>

          <form onSubmit={handlePostSubmit} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Spot Name *</label>
              <input
                type="text"
                required
                value={spotName}
                onChange={(e) => setSpotName(e.target.value)}
                placeholder="e.g. Alishan Sunrise Platform, Taipei 101 Overlook"
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-150 bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Scenic Notes</label>
              <textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={3}
                placeholder="What is the magic hour here? Are there crowd alerts?"
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-150 bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Crowd Density</label>
              <select
                value={crowdLevel}
                onChange={(e) => setCrowdLevel(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-150 bg-slate-50/50 focus:bg-white focus:outline-none transition-all"
              >
                <option value="quiet">🟢 Quiet / Hidden Haven</option>
                <option value="moderate">🟡 Moderate / Standard Access</option>
                <option value="crowded">🔴 Packed / High Demand</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Transmitting...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Live to Postgres</span>
                </>
              )}
            </button>

            {submitSuccess && (
              <div className="p-2 border border-green-200 bg-green-50 text-green-700 rounded-lg text-[9px] font-bold text-center uppercase tracking-wider animate-in fade-in duration-200">
                🎉 Spot broadcasted live via Supabase!
              </div>
            )}
          </form>
        </div>

        {/* Live Postgres Stream Dispatch column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <h3 className="text-xs font-black uppercase text-slate-950 tracking-wider">Live Traveler Dispatches ({entries.length})</h3>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-orange-650 bg-orange-50 px-2 py-0.5 rounded-md font-mono">
              Live updates active
            </span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
            {entries.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white/40">
                <p className="text-slate-400 text-xs italic">Waiting for incoming traveler check-ins...</p>
              </div>
            ) : (
              entries.map((item, index) => {
                const isNew = new Date(item.created_at).getTime() > Date.now() - 30000;
                return (
                  <div
                    key={item.id || index}
                    className={`bg-white border rounded-2xl p-4 transition-all hover:shadow-xs flex flex-col justify-between space-y-2 border-slate-150/70 hover:border-orange-200 ${
                      isNew ? "border-orange-500/50 shadow-md bg-orange-50/10" : ""
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-black text-slate-900 truncate">
                          📍 {item.spot_name}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400 font-bold uppercase shrink-0">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed italic">
                        {item.visit_notes ? `"${item.visit_notes}"` : "Explored, logged and shared with the Spotgram registry."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 text-[9px] font-mono text-slate-450 uppercase tracking-wider font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.crowd_level === "quiet" ? "bg-green-500" : item.crowd_level === "moderate" ? "bg-amber-500" : "bg-red-500"
                        }`}></span>
                        {item.crowd_level || "moderate"} crowd
                      </span>
                      <span className="font-extrabold text-[8.5px] text-slate-400">
                        LAT: {parseFloat(item.latitude || 0).toFixed(3)} • LNG: {parseFloat(item.longitude || 0).toFixed(3)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Embedded Disqus Forum at the bottom of the webpage container */}
      <div id="disqus-forum-section" className="bg-white border border-slate-150/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600 shrink-0" />
              Community Discussions
            </h4>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Have a question about a photo spot or wanting to sync with local guides? Drop your comments below in Taiwan Mandarin or English.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-50/50 test-orange-850 px-3 py-1.5 rounded-full border border-orange-100/60 text-[9px] font-mono font-black uppercase tracking-widest text-orange-700">
            <Globe className="w-3.5 h-3.5 animate-pulse" />
            ZH_TW 繁體中文 
          </div>
        </div>

        {/* Disqus Embed container wrapping user's sample code */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 sm:p-6 min-h-[400px]">
          <DiscussionEmbed
            shortname="https-spotgram-vercel-app"
            config={{
              url: article.url,
              identifier: article.id,
              title: article.title,
              language: "zh_TW" // Traditional Chinese for Spotgram platform consistency
            }}
          />
        </div>
      </div>

    </div>
  );
}
