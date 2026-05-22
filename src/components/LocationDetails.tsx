import React, { useState, useEffect } from "react";
import { Compass, BookOpen, Clock, AlertTriangle, Eye, ArrowRight, Video, Mail, CheckCircle2, Calendar, ThumbsUp, Flame, CheckSquare, Sparkles } from "lucide-react";
import { LocationTips } from "../types";
import { MOCK_GUIDES, MOCK_OFFERS } from "../data";

interface LocationDetailsProps {
  lat: number;
  lng: number;
  spotName?: string;
}

export default function LocationDetails({ lat, lng, spotName }: LocationDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<LocationTips | null>(null);
  const [contactedGuideId, setContactedGuideId] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [showContactSuccess, setShowContactSuccess] = useState(false);

  // Spotgram interactive travel planners
  const [crowdLevel, setCrowdLevel] = useState<"quiet" | "moderate" | "busy">("moderate");
  const [plannedActivities, setPlannedActivities] = useState<string[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [visitNotes, setVisitNotes] = useState("");

  const handleToggleActivity = (activity: string) => {
    setPlannedActivities((prev) => 
      prev.includes(activity) 
        ? prev.filter((item) => item !== activity) 
        : [...prev, activity]
    );
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckedIn(true);
  };

  useEffect(() => {
    if (!lat || !lng) return;
    setLoading(true);
    setTips(null);

    fetch("/api/location-tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: spotName, lat, lng }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.tips) {
          setTips(data.tips);
        }
      })
      .catch((err) => console.error("Error fetching location tips:", err))
      .finally(() => setLoading(false));
  }, [lat, lng, spotName]);

  const handleContactGuide = (guideId: string) => {
    setContactedGuideId(guideId);
    setContactMessage(`Hi! I'm planning to visit ${spotName || "this location"} and would love to hire you for a custom photography walkabout.`);
    setShowContactSuccess(false);
  };

  const submitContact = (e: React.FormEvent) => {
    e.preventDefault();
    setShowContactSuccess(true);
    setTimeout(() => {
      setContactedGuideId(null);
      setShowContactSuccess(false);
    }, 2500);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-orange-100 p-12 shadow-sm text-center space-y-4 py-20">
        <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-slate-950">Downloading Scenic Guidebook</h4>
          <p className="text-[10px] font-bold text-orange-650 uppercase tracking-widest font-mono">Generating photography tips, local sun directions, and history markers...</p>
        </div>
      </div>
    );
  }

  if (!tips) return null;

  return (
    <div className="grid lg:grid-cols-5 gap-6 items-start max-w-6xl mx-auto">
      
      {/* Left Column: AI-Generated Sun & Photographic Recommendations */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-150 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Main heading badge for Spotgram guide */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-100 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <Compass className="w-4.5 h-4.5 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950 font-sans leading-none uppercase tracking-wider">Spotgram Visitation Guide</h3>
                <span className="text-[9px] text-orange-600 font-bold uppercase tracking-widest mt-1 block leading-none">Photographer & Traveller Intelligence handbook</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-orange-600 to-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest font-mono shadow-sm">
              <Flame className="w-3.5 h-3.5" /> High Rating Spot
            </div>
          </div>

          {/* Historical Details banner */}
          <div className="space-y-2 p-5 bg-orange-50/10 rounded-2xl border border-orange-100/30">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 leading-none">
              <BookOpen className="w-3.5 h-3.5 text-orange-500" /> Historical Background
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">{tips.history}</p>
          </div>

          {/* TWO COLUMN BENTO GRID FOR TIMES & ACTIVITIES */}
          <div className="grid md:grid-cols-2 gap-5 pt-1">
            
            {/* COLUMN 1: BEST WINDOW - WHEN TO VISIT */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-300/30 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-widest">
                      🕰️ When to Visit
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-mono text-[9px] font-black uppercase">
                    Solar Sweetspot
                  </span>
                </div>
                
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  {tips.solar}
                </p>

                {/* Simulated peak timelines */}
                <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase border-t border-amber-500/15 pt-3.5 text-amber-900">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-center">
                    <span className="block text-amber-500 text-[8px] font-mono">Golden Hour</span>
                    <span>1 Hour Near Sunset</span>
                  </div>
                  <div className="p-2 bg-amber-500/20 rounded-lg text-center">
                    <span className="block text-amber-600 text-[8px] font-mono">Blue Hour</span>
                    <span>20 min twilight</span>
                  </div>
                </div>
              </div>
              
              <div className="text-[9px] text-amber-800 font-medium pt-2 italic">
                💡 Tip: Arrive 45 mins early to secure the absolute best vantage tripod spot!
              </div>
            </div>

            {/* COLUMN 2: WHAT TO DO - THE ADVENTURES / ACTIVITIES */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-orange-600/10 to-orange-600/5 border border-orange-200/30 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-orange-600" />
                    <h4 className="text-xs font-black text-orange-950 uppercase tracking-widest">
                      🎒 Activities & Walks
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-orange-600 text-white font-mono text-[9px] font-black uppercase">
                    Spotgram Choice
                  </span>
                </div>

                <div className="space-y-3">
                  {tips.mustSee.map((spot, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <div className="w-4.5 h-4.5 rounded-md bg-orange-600 text-white text-[9px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-900 leading-none">{spot.name}</h5>
                        <p className="text-[10px] text-slate-500 leading-snug mt-0.5 font-sans">{spot.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[9px] text-orange-850 font-medium pt-1 italic">
                🎯 Best Activity: Explore the outer neighborhoods for an authentic, uncrowded experience.
              </div>
            </div>

          </div>

          {/* COMPOSITION & SETUP CHECKLIST */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-orange-600" />
              <h4 className="text-xs font-black text-slate-950 uppercase tracking-widest">
                📸 Creative Photography & Angle Missions
              </h4>
            </div>
            
            <div className="grid gap-2.5">
              {tips.tips.map((tip, idx) => {
                const activityId = `photo-assignment-${idx}`;
                const isSelected = plannedActivities.includes(activityId);
                return (
                  <div 
                    key={idx} 
                    onClick={() => handleToggleActivity(activityId)}
                    className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected 
                        ? "bg-orange-50/20 border-orange-500/80 shadow-xs" 
                        : "bg-orange-50/5 border-orange-100/30 hover:bg-orange-100/10 hover:border-orange-200"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected ? "bg-orange-600 border-orange-600 text-white animate-pulse" : "border-slate-350 bg-white"
                    }`}>
                      {isSelected && <CheckSquare className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-orange-600 font-mono">
                          Camera Angle Mission {idx + 1}
                        </span>
                        {isSelected && (
                          <span className="px-1 py-0.5 bg-orange-100 text-orange-700 text-[8px] font-bold uppercase rounded font-mono"> Added to itinerary</span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isSelected ? "text-slate-800 font-medium" : "text-slate-600"}`}>
                        {tip}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE INTERACTIVE SPOTGRAM CHECK-IN SYSTEM */}
          <div className="p-6 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 rounded-2xl border border-orange-150/40 space-y-4 pt-5">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-spin" style={{ animationDuration: '4s' }} /> Interactive Check-In Terminal
                </h4>
                <p className="text-[10px] text-slate-400">Save your Spotgram visitation itinerary and verify crowd trends!</p>
              </div>
              <span className="text-[9px] font-mono font-bold uppercase bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded-md">
                Spotgram Community Hub
              </span>
            </div>

            {isCheckedIn ? (
              <div className="bg-white rounded-xl border border-orange-200 p-5 shadow-sm space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                {/* Decorative flight coupon cutout */}
                <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-orange-50 border border-orange-200/50 -translate-y-1/2"></div>
                <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-orange-50 border border-orange-200/50 -translate-y-1/2 flex items-center justify-end"></div>

                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] font-mono text-orange-600 font-bold uppercase tracking-wider block">Official Check-In Coupon</span>
                    <h5 className="text-base font-black text-slate-950 font-sans tracking-tight">{spotName || "Verified GPS Horizon Spot"}</h5>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Lat: {lat.toFixed(5)} • Lng: {lng.toFixed(5)}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] font-mono text-slate-400 leading-none">Visits Verified</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">#{Math.floor(Math.random() * 850) + 120} Traveler</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 my-3"></div>

                <div className="grid grid-cols-2 gap-3 text-xs leading-none">
                  <div>
                    <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Selected Level Of Crowd</span>
                    <span className="font-bold text-slate-800 capitalize flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${crowdLevel === 'quiet' ? 'bg-green-500 animate-pulse' : crowdLevel === 'moderate' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
                      {crowdLevel} Density
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Itinerary Missions Selected</span>
                    <span className="font-bold text-orange-700 font-mono">{plannedActivities.length} Camera Coordinates Verified</span>
                  </div>
                </div>

                {visitNotes && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-500 italic font-medium leading-relaxed mt-2">
                    &ldquo;{visitNotes}&rdquo;
                  </div>
                )}

                <div className="flex justify-between items-center bg-orange-50/50 p-2.5 rounded-lg border border-orange-100 mt-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 animate-bounce animate-pulse" />
                    <span className="text-[10px] text-slate-700 font-semibold font-sans">Passport registered to: bisz98@gmail.com</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCheckedIn(false);
                      setVisitNotes("");
                    }}
                    className="text-[9px] font-bold uppercase text-orange-600 hover:underline cursor-pointer"
                  >
                    Edit check-in
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckInSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  
                  {/* Crowd density control */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Report Crowd Level Range
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-slate-200/85 rounded-xl">
                      {(["quiet", "moderate", "busy"] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setCrowdLevel(level)}
                          className={`py-1.5 font-bold text-[9px] rounded-lg transition-all capitalize cursor-pointer ${
                            crowdLevel === level
                              ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic checkin code */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Spotgram Passport ID
                    </label>
                    <div className="p-2 bg-white/70 border border-slate-150/70 text-slate-800 text-xs font-mono font-bold rounded-xl h-[33.5px] items-center flex justify-between px-3">
                      <span>SG-TICKET-{Math.abs(Math.sin(lat) * 10000).toFixed(0)}</span>
                      <span className="text-[9px] uppercase font-black text-green-600 animate-pulse font-sans">AVAILABLE</span>
                    </div>
                  </div>

                </div>

                {/* Visit summary notes */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Brief Field Observation Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bring ND filter, clear sun horizon with some high cloud, perfect for wide shots"
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    className="w-full text-xs font-semibold py-2 px-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold rounded-lg text-xs transition-all active:scale-95 shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-white" /> Check In & Unlock My Official Spotgram Ticket
                </button>
              </form>
            )}
          </div>

          {/* Safety Warning */}
          <div className="p-5 bg-red-50/20 rounded-2xl border border-red-100/60 flex gap-3.5 text-xs text-red-900 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold leading-none mb-1 text-red-950">Safety & Respect Etiquette</h5>
              <p className="text-[11px] text-red-900/90 font-sans">{tips.safety}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Local Guides Matching & Affiliate Partner offers */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Guides Search Suggestion */}
        <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Photography Tour Guides Nearby</h3>
            <p className="text-[10px] text-slate-400 mt-1">Hire trusted locals for camera assistance & walk itineraries</p>
          </div>

          <div className="space-y-3">
            {MOCK_GUIDES.map((guide) => (
              <div key={guide.id} className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 flex gap-3 items-start hover:border-slate-350 transition-all hover:bg-slate-50">
                <img
                  src={guide.avatar}
                  alt={guide.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-150 shrink-0"
                />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-950 truncate">{guide.name}</h4>
                    <span className="text-[10px] text-orange-600 font-bold font-mono">
                      ${guide.hourlyRate}/hr
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{guide.bio}</p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                    <span className="text-[9px] text-orange-850 font-bold bg-orange-50 border border-orange-100/80 px-1.5 py-0.5 rounded-md uppercase tracking-wider font-mono">
                      {guide.specialty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleContactGuide(guide.id)}
                      className="px-3 py-1 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-full text-[9px] font-bold transition-all cursor-pointer shadow-xs shadow-orange-500/10"
                    >
                      Book Tour
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Affiliate Offers Panel */}
        <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Special Partner Travel Benefits</h3>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">Exclusive discounts and gear selected for your shoot</p>
          </div>

          <div className="space-y-3">
            {MOCK_OFFERS.map((offer) => (
              <div key={offer.id} className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col justify-between hover:border-orange-300 hover:shadow-xs transition-all">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-orange-500 font-mono uppercase tracking-wider">{offer.provider}</span>
                    {offer.price && <span className="text-[10px] font-bold text-orange-600 font-mono bg-orange-50/50 border border-orange-100 px-1.5 py-0.5 rounded-md">{offer.price}</span>}
                  </div>
                  <h4 className="text-xs font-bold text-slate-950">{offer.title}</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{offer.description}</p>
                </div>
                
                <a
                  href={offer.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/15 text-center"
                >
                  {offer.buttonText} <ArrowRight className="w-3 h-3 text-orange-250" />
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Guide Contact Interactive Popup Dialog */}
      {contactedGuideId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-orange-100 p-6 max-w-sm w-full space-y-5 shadow-2xl">
            {showContactSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto border border-orange-100">
                  <CheckCircle2 className="w-6 h-6 animate-bounce text-orange-650" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 font-sans">Message Dispatched!</h4>
                  <p className="text-xs text-slate-400 mt-1">Elena or Kenji will reach out to you within 2 hours.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={submitContact} className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-950">
                    Contact {MOCK_GUIDES.find(g => g.id === contactedGuideId)?.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Customize your travel query to negotiate booking hours.</p>
                </div>
                
                <textarea
                  required
                  rows={3}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-850"
                ></textarea>
                
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setContactedGuideId(null)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-orange-600 rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/15"
                  >
                    <Mail className="w-3.5 h-3.5 text-orange-200" /> Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
