import { useEffect, useRef, useState } from "react";

// Types
interface SimpleMapProps {
  lat: number;
  lng: number;
  routeOrigin?: { lat: number; lng: number } | null;
  travelMode?: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";
  onRouteCalculated?: (distance: string, duration: string) => void;
}

export default function SimpleMap({
  lat,
  lng,
  routeOrigin,
  travelMode = "DRIVING",
  onRouteCalculated,
}: SimpleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // Load Leaflet CDN script & styles
  useEffect(() => {
    let active = true;

    function loadLeaflet(callback: () => void) {
      if ((window as any).L) {
        callback();
        return;
      }

      // Load CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Load JS
      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
          if (active) callback();
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if ((window as any).L) {
            clearInterval(interval);
            if (active) callback();
          }
        }, 100);
      }
    }

    loadLeaflet(() => {
      setLeafletLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  // Initialize and update Map Instance
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;

    // Create map instance if it doesn't exist
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([lat, lng], 13);

      // Add elegant CartoDB Positron Tile layer (sleek greyscale matching our theme)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      // Re-center map if coordinates change without active routing
      if (!routeOrigin) {
        mapInstanceRef.current.setView([lat, lng], 13);
      }
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Custom CSS icons for beautiful high-end markers (matching our adventurous orange theme)
    const destIcon = L.divIcon({
      className: "custom-div-icon",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-5 h-5 bg-orange-500/30 rounded-full animate-ping"></div>
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg border border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.74a1.01 1.01 0 0 1-1.202 0C9.54 20.194 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const originIcon = L.divIcon({
      className: "custom-div-icon",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg border border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    // Add main target marker
    const destMarker = L.marker([lat, lng], { icon: destIcon }).addTo(map);
    markersRef.current.push(destMarker);

    // If route origin is set
    if (routeOrigin) {
      const originMarker = L.marker([routeOrigin.lat, routeOrigin.lng], { icon: originIcon }).addTo(map);
      markersRef.current.push(originMarker);

      // Fit map bounds to show both points
      const bounds = L.latLngBounds(
        [routeOrigin.lat, routeOrigin.lng],
        [lat, lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [leafletLoaded, lat, lng, routeOrigin]);

  // Route calculation hook (OSRM API - 100% Free real road mapping coordinates helper)
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || !routeOrigin) {
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      return;
    }

    const L = (window as any).L;
    const map = mapInstanceRef.current;

    const profileMap = {
      DRIVING: "driving",
      WALKING: "foot",
      BICYCLING: "bicycle",
      TRANSIT: "driving", // Fallback for OSRM public limits
    };
    const profile = profileMap[travelMode] || "driving";

    // Call dynamic free open-source OSRM routing engine API
    const url = `https://router.project-osrm.org/route/v1/${profile}/${routeOrigin.lng},${routeOrigin.lat};${lng},${lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!data.routes || !data.routes[0]) return;

        const route = data.routes[0];
        const geojsonCoords = route.geometry.coordinates; // array of [lng, lat]
        const latLngs = geojsonCoords.map((coord: [number, number]) => [coord[1], coord[0]]);

        // Clear old line
        if (polylineRef.current) {
          polylineRef.current.remove();
        }

        // Draw new polyline route
        const poly = L.polyline(latLngs, {
          color: travelMode === "WALKING" ? "#f59e0b" : "#ea580c",
          weight: 5,
          opacity: 0.85,
        }).addTo(map);

        polylineRef.current = poly;

        // Auto fly/fit bounds
        map.fitBounds(poly.getBounds(), { padding: [40, 40] });

        // Translate metrics
        const distanceM = route.distance || 0;
        const durationSec = route.duration || 0;

        let distanceStr = "";
        if (distanceM >= 1000) {
          distanceStr = `${(distanceM / 1000).toFixed(1)} km`;
        } else {
          distanceStr = `${Math.round(distanceM)} m`;
        }

        const mins = Math.round(durationSec / 60);
        let durationStr = "";
        if (mins >= 60) {
          const hours = Math.floor(mins / 60);
          const remainMins = mins % 60;
          durationStr = `${hours} hr ${remainMins} min`;
        } else {
          durationStr = `${mins} min`;
        }

        if (onRouteCalculated) {
          onRouteCalculated(distanceStr, durationStr);
        }
      })
      .catch((err) => {
        console.error("OSRM Route fetching issue:", err);
        // Fallback: draw straight direct line path if router is unresponsive or blocks
        if (polylineRef.current) polylineRef.current.remove();

        const poly = L.polyline([[routeOrigin.lat, routeOrigin.lng], [lat, lng]], {
          color: "#f97316",
          weight: 4,
          dashArray: "6,6",
          opacity: 0.8,
        }).addTo(map);

        polylineRef.current = poly;

        if (onRouteCalculated) {
          onRouteCalculated("Straight line", "Calculating direct walking time...");
        }
      });

  }, [leafletLoaded, lat, lng, routeOrigin, travelMode]);

  // Clean unmount helper
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative relative-map flex items-center justify-center bg-orange-50/10">
      {!leafletLoaded && (
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-orange-600">Loading Free Map Deck</span>
        </div>
      )}
      <div id="simple-leaflet-container" ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />
    </div>
  );
}
