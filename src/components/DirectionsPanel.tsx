import React, { useState, useRef, useEffect } from "react";
import { CornerUpRight, MapPin, Car, Footprints, Bike, Train } from "lucide-react";

interface DirectionsPanelProps {
  destinationLat: number;
  destinationLng: number;
  onRouteCalculated?: (distanceText: string, durationText: string) => void;
  onRequestOriginChange?: (origin: { lat: number; lng: number } | null) => void;
  travelMode: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";
  setTravelMode: (mode: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT") => void;
  selectedOrigin: { lat: number; lng: number } | null;
  setSelectedOrigin: (origin: { lat: number; lng: number } | null) => void;
  metrics?: { distance: string; duration: string } | null;
  setMetrics?: (metrics: { distance: string; duration: string } | null) => void;
}

export default function DirectionsPanel({
  destinationLat,
  destinationLng,
  travelMode,
  setTravelMode,
  selectedOrigin,
  setSelectedOrigin,
  onRouteCalculated,
  metrics,
  setMetrics,
}: DirectionsPanelProps) {
  const [addressInput, setAddressInput] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [errorWord, setErrorWord] = useState<string | null>(null);
  
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleGetCurrentLocation = () => {
    setAddressLoading(true);
    setErrorWord(null);
    if (setMetrics) setMetrics(null);

    if (!navigator.geolocation) {
      setErrorWord("Native browser geolocation navigation is unavailable in your device settings.");
      setAddressLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isMounted.current) return;
        const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setSelectedOrigin(userLoc);
        setAddressInput(`Current Location (${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)})`);
        setAddressLoading(false);
      },
      (err) => {
        if (!isMounted.current) return;
        console.error(err);
        setErrorWord("Permission to read current geolocation structure was denied by browser.");
        setAddressLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const handleGeocodeAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput) return;

    setAddressLoading(true);
    setErrorWord(null);
    if (setMetrics) setMetrics(null);

    // Call Nominatim OSM Geocoding API (100% Free search alternative)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}&limit=1`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted.current) return;
        if (data && data.length > 0) {
          const item = data[0];
          const latVal = parseFloat(item.lat);
          const lonVal = parseFloat(item.lon);
          setSelectedOrigin({ lat: latVal, lng: lonVal });
          setAddressInput(item.display_name || addressInput);
          setAddressLoading(false);
        } else {
          setErrorWord("Could not find address location coordinates on map.");
          setAddressLoading(false);
        }
      })
      .catch((err) => {
        console.error("OSM Geocoder problem:", err);
        if (!isMounted.current) return;
        setErrorWord("Failed to resolve address coordinates. Please try another query.");
        setAddressLoading(false);
      });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <CornerUpRight className="w-5 h-5 text-orange-600" />
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generate Directions to Photo Spot</h3>
      </div>

      <form onSubmit={handleGeocodeAddress} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Start Address / Position</label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="Enter hotel name, city, airport, or specific street..."
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="w-full pl-9 pr-28 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500 text-slate-800 font-medium"
            />
            <MapPin className="w-4 h-4 text-orange-500 absolute left-3 top-1/2 -translate-y-1/2" />
            
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-850 font-bold rounded-lg text-[9px] transition-all cursor-pointer font-sans border border-orange-100"
            >
              My GPS Location
            </button>
          </div>
        </div>

        {errorWord && (
          <p className="text-[10px] text-red-650 font-semibold font-sans">{errorWord}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={addressLoading || !addressInput}
            className="flex-1 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold rounded-full text-xs transition-all active:scale-95 shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 disabled:bg-slate-200 cursor-pointer text-center"
          >
            {addressLoading ? "Analyzing input..." : "Set Start Point"}
          </button>
          
          {selectedOrigin && (
            <button
              type="button"
              onClick={() => {
                setSelectedOrigin(null);
                setAddressInput("");
                if (setMetrics) setMetrics(null);
              }}
              className="px-4 py-2 border border-slate-250 hover:border-orange-350 text-slate-600 hover:bg-orange-50 hover:text-orange-700 rounded-full text-xs font-semibold cursor-pointer transition-colors"
            >
              Clear Route
            </button>
          )}
        </div>
      </form>

      {/* Travel mode switches */}
      {selectedOrigin && (
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Select Routing Mode</span>
          
          <div className="grid grid-cols-4 gap-1 bg-orange-50/40 p-1 rounded-xl border border-orange-100/50">
            {(["DRIVING", "WALKING", "BICYCLING", "TRANSIT"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTravelMode(mode)}
                className={`py-2 font-bold text-[10px] rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  travelMode === mode
                    ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/10"
                    : "text-slate-500 hover:text-orange-600"
                }`}
              >
                {mode === "DRIVING" && <Car className="w-3.5 h-3.5" />}
                {mode === "WALKING" && <Footprints className="w-3.5 h-3.5" />}
                {mode === "BICYCLING" && <Bike className="w-3.5 h-3.5" />}
                {mode === "TRANSIT" && <Train className="w-3.5 h-3.5" />}
                <span className="capitalize text-[8px] tracking-wider mt-0.5">{mode.toLowerCase()}</span>
              </button>
            ))}
          </div>

          {/* Route Metrics display */}
          {metrics && (
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-4 rounded-2xl flex justify-between items-center text-xs font-bold text-white shadow-md shadow-orange-500/15 animate-in fade-in slide-in-from-top-1">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200">Estimated Path</span>
              </div>
              <div className="text-right">
                <span className="block text-sm font-extrabold text-white font-mono">{metrics.duration}</span>
                <span className="text-[10px] text-orange-100 font-normal">{metrics.distance} traveling distance</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
