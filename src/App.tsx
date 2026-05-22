import { useState, useEffect, useRef } from "react";
import ExifReader from "exifreader";
import { MapPin, Sparkles } from "lucide-react";

import Header from "./components/Header";
import CheckoutModal from "./components/CheckoutModal";
import DemoAndUpload from "./components/DemoAndUpload";
import AIExplanation from "./components/AIExplanation";
import LocationDetails from "./components/LocationDetails";
import DirectionsPanel from "./components/DirectionsPanel";
import SimpleMap from "./components/SimpleMap";
import { DemoPhoto } from "./data";
import SocialHub from "./components/SocialHub";

// Safe REGEX or float EXIF converter
function parseExifGPS(tags: any): { lat: number; lng: number } | null {
  try {
    if (!tags.GPSLatitude || !tags.GPSLongitude) return null;

    const latDesc = tags.GPSLatitude.description;
    const lngDesc = tags.GPSLongitude.description;

    let lat = parseFloat(latDesc);
    let lng = parseFloat(lngDesc);

    // If string formatted as degrees minutes seconds, e.g. "48 deg 51' 30.24\" N"
    if (isNaN(lat) || isNaN(lng)) {
      const parseDMS = (desc: string) => {
        const dmsRegex = /(\d+)\s*deg\s*(\d+)'\s*([\d\.]+)"\s*([NSEW])/i;
        const match = desc.match(dmsRegex);
        if (match) {
          const deg = parseFloat(match[1]);
          const min = parseFloat(match[2]);
          const sec = parseFloat(match[3]);
          const dir = match[4].toUpperCase();
          let decimal = deg + min / 65 + sec / 3600; // degrees formula
          if (dir === "S" || dir === "W") {
            decimal = -decimal;
          }
          return decimal;
        }
        return null;
      };

      const parsedLat = parseDMS(latDesc);
      const parsedLng = parseDMS(lngDesc);
      
      if (parsedLat !== null && parsedLng !== null) {
        return { lat: parsedLat, lng: parsedLng };
      }
    } else {
      // Decode NSEW identifiers
      let latRef = tags.GPSLatitudeRef?.description || tags.GPSLatitudeRef?.value?.[0];
      let lngRef = tags.GPSLongitudeRef?.description || tags.GPSLongitudeRef?.value?.[0];

      if (typeof latRef === "string") latRef = latRef.trim().toUpperCase();
      if (typeof lngRef === "string") lngRef = lngRef.trim().toUpperCase();

      if (latRef === "S" || latRef === "SOUTH" && lat > 0) lat = -lat;
      if (lngRef === "W" || lngRef === "WEST" && lng > 0) lng = -lng;

      return { lat, lng };
    }
  } catch (err) {
    console.error("GPS Coordinate Parsing Error:", err);
  }
  return null;
}

export default function App() {
  // Balanced credits stored in browser localStorage
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem("photo_finder_credits");
    return saved ? JSON.parse(saved) : 3; // Starts with 3 credits by default
  });

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [demoSelection, setDemoSelection] = useState<DemoPhoto | null>(null);
  const [activeTab, setActiveTab] = useState<"finder" | "social">("finder");
  
  // Transition steps: "landing" | "checking" | "ai_scantrack" | "results"
  const [step, setStep] = useState<"landing" | "checking" | "ai_scantrack" | "results">("landing");
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto scroll to results section once decoded GPS landmarks loaded
  useEffect(() => {
    if (step === "results" && resultsRef.current) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [step]);
  
  // Decoded coordinates
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvedSpotName, setResolvedSpotName] = useState("");
  
  // Calculated Route Origin
  const [routeOrigin, setRouteOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [travelMode, setTravelMode] = useState<"DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT">("DRIVING");
  
  // Route Metrics display data
  const [routeMetrics, setRouteMetrics] = useState<{ distance: string; duration: string } | null>(null);

  // Sync credit updates to client storage
  useEffect(() => {
    localStorage.setItem("photo_finder_credits", JSON.stringify(credits));
  }, [credits]);

  const handlePurchased = (count: number) => {
    if (count === Infinity) {
      setCredits(Infinity);
    } else {
      setCredits((prev) => (prev === Infinity ? Infinity : prev + count));
    }
  };

  const handleReset = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setDemoSelection(null);
    setCoordinates(null);
    setResolvedSpotName("");
    setRouteOrigin(null);
    setRouteMetrics(null);
    setStep("landing");
  };

  const consumeCredit = () => {
    if (credits !== Infinity) {
      setCredits((prev) => Math.max(0, prev - 1));
    }
  };

  const processPhotoSelection = async (file: File | null, demo: DemoPhoto | null) => {
    if (credits <= 0) {
      setCheckoutOpen(true);
      return;
    }

    setStep("checking");
    consumeCredit();

    // If preset demo photo selected
    if (demo) {
      setDemoSelection(demo);
      setPhotoPreview(demo.url);
      
      // Simulate light analytical delay
      setTimeout(() => {
        if (demo.hasExif && demo.lat && demo.lng) {
          setCoordinates({ lat: demo.lat, lng: demo.lng });
          setResolvedSpotName(demo.name);
          setStep("results");
        } else {
          // Preset Kyoyo photo has no EXIF, triggers AI Scanning subview
          setStep("ai_scantrack");
        }
      }, 1000);
      return;
    }

    // If local user file uploaded
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const tags = ExifReader.load(arrayBuffer);
        const parsed = parseExifGPS(tags);

        setTimeout(() => {
          if (parsed) {
            setCoordinates(parsed);
            setResolvedSpotName("Selected Photograph Position");
            setStep("results");
          } else {
            setStep("ai_scantrack");
          }
        }, 1200);
      } catch (err) {
        console.error("EXIF Load crash:", err);
        // Exif error usually means no custom markers found, jump to AI vision option
        setTimeout(() => {
          setStep("ai_scantrack");
        }, 1200);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 flex flex-col font-sans">
      
      {/* Header controls */}
      <Header credits={credits} onOpenCheckout={() => setCheckoutOpen(true)} />

      {/* Navigation Tabs Selector */}
      <div className="bg-white border-b border-orange-100/60 sticky top-[80px] z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-start gap-4">
          <button
            id="tab-finder"
            onClick={() => setActiveTab("finder")}
            className={`py-3.5 px-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "finder"
                ? "border-orange-500 text-slate-950"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📍 Spot Finder</span>
          </button>
          <button
            id="tab-social"
            onClick={() => setActiveTab("social")}
            className={`py-3.5 px-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "social"
                ? "border-orange-500 text-slate-950"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>💬 Social Hub</span>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Main viewport segments */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        
        {/* Render Social Hub component when active */}
        {activeTab === "social" && <SocialHub />}

        {/* Spot Finder Views */}
        {activeTab === "finder" && (
          <>
            {/* Landing Select Stage */}
            {step === "landing" && (
              <DemoAndUpload
                onPhotoSelected={processPhotoSelection}
                credits={credits}
                onOpenCheckout={() => setCheckoutOpen(true)}
              />
            )}

            {/* Loading analytical screen */}
            {step === "checking" && (
              <div className="max-w-md mx-auto text-center py-24 space-y-6 animate-pulse">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-amber-500 text-white rounded-lg flex items-center justify-center mx-auto shadow-md">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-orange-600 font-sans">Decoding Image Headers</h3>
                  <p className="text-[10px] font-bold text-orange-750 uppercase tracking-widest font-mono">Peeling photo database details & extracting EXIF tags...</p>
                </div>
              </div>
            )}

            {/* Missing GPS and Candidate selection flow */}
            {step === "ai_scantrack" && photoPreview && (
              <AIExplanation
                imagePreviewUrl={photoPreview}
                imageFile={photoFile}
                demoPhotoUrl={demoSelection ? demoSelection.url : null}
                onSelectCoordinates={(lat, lng, name) => {
                  setCoordinates({ lat, lng });
                  setResolvedSpotName(name);
                  setStep("results");
                }}
                onReset={handleReset}
              />
            )}

            {/* Main Map guide, tour planning & routing tools */}
            {step === "results" && coordinates && photoPreview && (
              <div ref={resultsRef} className="space-y-8 animate-in fade-in duration-350">
                
                {/* Action headers */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-white border border-orange-200 hover:bg-orange-50 text-orange-600 font-bold rounded-full text-xs transition-all cursor-pointer shadow-xs"
                    >
                      ← Reset Search
                    </button>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-950 tracking-tight leading-none uppercase">
                        {resolvedSpotName || "Decoded GPS Landmark"}
                      </h2>
                      <p className="text-[10px] text-orange-650 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1.5 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 animate-bounce" />
                        Lat: {coordinates.lat.toFixed(5)} • Lng: {coordinates.lng.toFixed(5)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3.5 py-1.5 bg-orange-50 border border-orange-100 text-orange-700 text-[9px] font-bold rounded-full uppercase tracking-widest font-mono">
                      🗺️ OpenStreetMap Layer Active
                    </span>

                    {routeOrigin && (
                      <div className="px-3.5 py-1.5 bg-slate-100 text-slate-800 text-[9px] font-bold rounded-full border border-slate-200 font-mono uppercase tracking-widest">
                        Active Routing Mode
                      </div>
                    )}
                  </div>
                </div>

                {/* Split screen row: Map panel LHS, visual card previews RHS */}
                <div className="grid lg:grid-cols-5 gap-6 items-stretch">
                  
                  {/* Core Map canvas widget */}
                  <div className="lg:col-span-3 rounded-2xl border border-slate-150 overflow-hidden shadow-xs h-[450px] relative">
                    <SimpleMap
                      lat={coordinates.lat}
                      lng={coordinates.lng}
                      routeOrigin={routeOrigin}
                      travelMode={travelMode}
                      onRouteCalculated={(dist, dur) => {
                        setRouteMetrics({ distance: dist, duration: dur });
                      }}
                    />
                  </div>

                  {/* Sidebar review panel showing photograph & Directions Inputs */}
                  <div className="lg:col-span-2 flex flex-col justify-between gap-6">
                    
                    {/* Photo overview */}
                    <div className="bg-[#FDFDFD] rounded-2xl border border-slate-150 overflow-hidden shadow-sm aspect-[4/2.2] relative shrink-0">
                      <img
                        src={photoPreview}
                        alt="Active spot scenery"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-orange-650/40 via-transparent to-transparent flex items-end p-4">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-white bg-gradient-to-r from-orange-600 to-amber-500 px-3 py-1 rounded-full shadow-md">
                          Located Scene Point
                        </span>
                      </div>
                    </div>

                    {/* Directions computations drawer */}
                    <div className="flex-1">
                      <DirectionsPanel
                        destinationLat={coordinates.lat}
                        destinationLng={coordinates.lng}
                        travelMode={travelMode}
                        setTravelMode={setTravelMode}
                        selectedOrigin={routeOrigin}
                        setSelectedOrigin={setRouteOrigin}
                        metrics={routeMetrics}
                        setMetrics={setRouteMetrics}
                      />
                    </div>

                  </div>
                </div>

                {/* Visit recommends, photographic sun calc guidelines, and guide selections */}
                <LocationDetails
                  lat={coordinates.lat}
                  lng={coordinates.lng}
                  spotName={resolvedSpotName}
                />

              </div>
            )}
          </>
        )}

      </main>

      {/* simulated secure billing and refill controls */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onPurchased={handlePurchased}
      />
    </div>
  );
}
