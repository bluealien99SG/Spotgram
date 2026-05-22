import { useState, useEffect, useRef } from "react";
import ExifReader from "exifreader";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { MapPin, RefreshCw, Sparkles, Coins } from "lucide-react";

import Header from "./components/Header";
import CheckoutModal from "./components/CheckoutModal";
import DemoAndUpload from "./components/DemoAndUpload";
import AIExplanation from "./components/AIExplanation";
import LocationDetails from "./components/LocationDetails";
import DirectionsPanel from "./components/DirectionsPanel";
import SimpleMap from "./components/SimpleMap";
import { DemoPhoto } from "./data";

// Extract Google Maps API Key from environment defining blocks
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

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
  
  // Choose Map Engine Provider: default is osm (completely free / no API key)
  const [mapProvider, setMapProvider] = useState<"osm" | "google">(hasValidKey ? "google" : "osm");
  // Route Metrics display data
  const [routeMetrics, setRouteMetrics] = useState<{ distance: string; duration: string } | null>(null);
  // Show key parameters instructions modal
  const [showKeyInstructions, setShowKeyInstructions] = useState(false);

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

      {/* Main viewport segments */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        
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

        {/* Missing GPS GPS and Candidate selection flow */}
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
                  <h2 className="text-base font-extrabold text-slate-950 tracking-tight leading-none uppercase tracking-wider">
                    {resolvedSpotName || "Decoded GPS Landmark"}
                  </h2>
                  <p className="text-[10px] text-orange-650 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1.5 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 animate-bounce" />
                    Lat: {coordinates.lat.toFixed(5)} • Lng: {coordinates.lng.toFixed(5)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Map Engine Segmented Control */}
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden lg:block">Map Engine:</p>
                <div className="flex bg-orange-50/50 p-1 rounded-full border border-orange-100/60">
                  <button
                    onClick={() => setMapProvider("osm")}
                    className={`px-3.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      mapProvider === "osm"
                        ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-xs"
                        : "text-slate-500 hover:text-orange-600"
                    }`}
                  >
                    OpenStreetMap (Free)
                  </button>
                  <button
                    onClick={() => {
                      if (hasValidKey) {
                        setMapProvider("google");
                      } else {
                        setShowKeyInstructions(true);
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 ${
                      mapProvider === "google"
                        ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-xs"
                        : "text-slate-500 hover:text-orange-600"
                    } ${!hasValidKey ? "opacity-75" : ""}`}
                  >
                    Google Maps {!hasValidKey && "🔒"}
                  </button>
                </div>

                {routeOrigin && (
                  <div className="px-3.5 py-1.5 bg-slate-105 text-slate-800 text-[9px] font-bold rounded-full border border-slate-200 font-mono uppercase tracking-widest">
                    Active Routing Mode
                  </div>
                )}
              </div>
            </div>

            {/* Split screen row: Map panel LHS, visual card previews RHS */}
            <div className="grid lg:grid-cols-5 gap-6 items-stretch">
              
              {/* Core Map canvas widget */}
              <div className="lg:col-span-3 rounded-2xl border border-slate-150 overflow-hidden shadow-xs h-[450px] relative">
                {mapProvider === "google" && hasValidKey ? (
                  <APIProvider apiKey={API_KEY} version="weekly">
                    <Map
                      defaultCenter={coordinates}
                      defaultZoom={13}
                      mapId="PHOTO_FINDER_MAP_ID"
                      internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                      style={{ width: "100%", height: "100%" }}
                    >
                      {/* Destination marker target point pin */}
                      <AdvancedMarker position={coordinates}>
                        <Pin background="#ea580c" glyphColor="#fff" borderColor="#c2410c" />
                      </AdvancedMarker>

                      {/* Geolocation origin path tracking point pin */}
                      {routeOrigin && (
                        <AdvancedMarker position={routeOrigin}>
                          <Pin background="#1e293b" glyphColor="#fff" borderColor="#0f172a" />
                        </AdvancedMarker>
                      )}
                    </Map>
                  </APIProvider>
                ) : (
                  <SimpleMap
                    lat={coordinates.lat}
                    lng={coordinates.lng}
                    routeOrigin={routeOrigin}
                    travelMode={travelMode}
                    onRouteCalculated={(dist, dur) => {
                      setRouteMetrics({ distance: dist, duration: dur });
                    }}
                  />
                )}
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
                  {mapProvider === "google" && hasValidKey ? (
                    <APIProvider apiKey={API_KEY} version="weekly">
                      <DirectionsPanel
                        destinationLat={coordinates.lat}
                        destinationLng={coordinates.lng}
                        travelMode={travelMode}
                        setTravelMode={setTravelMode}
                        selectedOrigin={routeOrigin}
                        setSelectedOrigin={setRouteOrigin}
                        metrics={routeMetrics}
                        setMetrics={setRouteMetrics}
                        isGoogleMaps={true}
                      />
                    </APIProvider>
                  ) : (
                    <DirectionsPanel
                      destinationLat={coordinates.lat}
                      destinationLng={coordinates.lng}
                      travelMode={travelMode}
                      setTravelMode={setTravelMode}
                      selectedOrigin={routeOrigin}
                      setSelectedOrigin={setRouteOrigin}
                      metrics={routeMetrics}
                      setMetrics={setRouteMetrics}
                      isGoogleMaps={false}
                    />
                  )}
                </div>

              </div>
            </div>

            {/* Expands into Visit recommends, photographic sun calc guidelines, and guide selections */}
            <LocationDetails
              lat={coordinates.lat}
              lng={coordinates.lng}
              spotName={resolvedSpotName}
            />

          </div>
        )}

      </main>

      {/* simulated secure billing and refill controls */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onPurchased={handlePurchased}
      />

      {/* Google Maps API Key Setup Instructions Modal */}
      {showKeyInstructions && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-orange-100 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 border border-orange-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <MapPin className="w-6 h-6 animate-bounce text-orange-600" />
              </div>
              <h2 className="text-base font-extrabold text-orange-600 tracking-tight leading-none uppercase tracking-widest">Google Maps Integration</h2>
              <p className="text-[10px] text-slate-400 font-medium leading-normal">
                Google Maps provides professional satellite layers, Street View, and native geolocating services. Under the hood, you can choose this or OSM!
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-6">
              <h4 className="font-bold text-orange-900">API Key Connection Instructions:</h4>
              
              <div className="space-y-3.5">
                <p>
                  <strong>Step 1:</strong> Obtain a key from Google Cloud Console:
                  <br />
                  <a 
                    href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-600 font-extrabold hover:underline"
                  >
                    Create Google Maps Key Link
                  </a>
                </p>

                <p>
                  <strong>Step 2:</strong> Paste it inside the secrets panel in AI Studio:
                  <br />
                  <span className="block mt-1 bg-orange-50/50 border border-orange-100 p-2 text-orange-850 rounded-lg text-[10px] font-mono font-bold select-all">
                    GOOGLE_MAPS_PLATFORM_KEY
                  </span>
                </p>

                <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-500">
                  <li>Click <strong>Settings</strong> (⚙️ gear icon, top-right panel).</li>
                  <li>Go to <strong>Secrets</strong>.</li>
                  <li>Add a secret named <code className="font-bold bg-orange-50 px-1 py-0.5 rounded text-orange-800">GOOGLE_MAPS_PLATFORM_KEY</code>.</li>
                  <li>Paste your API key and press <strong>Save</strong>.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowKeyInstructions(false)}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold rounded-full text-xs transition-all cursor-pointer text-center shadow-lg shadow-orange-500/15"
              >
                Close & Continue with Free Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
