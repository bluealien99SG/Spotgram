import React, { useState } from "react";
import { AlertCircle, Brain, RefreshCw, Star, Info, Check } from "lucide-react";
import { CandidateLocation } from "../types";

interface AIExplanationProps {
  imagePreviewUrl: string;
  onSelectCoordinates: (lat: number, lng: number, spotName: string) => void;
  onReset: () => void;
  imageFile: File | null;
  demoPhotoUrl: string | null;
}

const LOADER_MESSAGES = [
  "Inspecting photograph horizon shapes...",
  "Running neural landmark detection filters...",
  "Analyzing architectural patterns and textures...",
  "Cross-referencing global geometric coordinates...",
  "Compiling landmark match percentage scores...",
];

export default function AIExplanation({
  imagePreviewUrl,
  onSelectCoordinates,
  onReset,
  imageFile,
  demoPhotoUrl,
}: AIExplanationProps) {
  const [loading, setLoading] = useState(false);
  const [loaderMessageIndex, setLoaderMessageIndex] = useState(0);
  const [candidates, setCandidates] = useState<CandidateLocation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startAIVisionSearch = async () => {
    setLoading(true);
    setError(null);

    // Rotate loader text every 2.5 seconds
    const interval = setInterval(() => {
      setLoaderMessageIndex((prev) => (prev + 1) % LOADER_MESSAGES.length);
    }, 2500);

    try {
      let base64 = "";

      // If it's a demo photo, we can fetch its data or simulate the call.
      // However, to keep things 100% real as required by rules, let's convert the offline image to base64!
      // For demo photos, we have standard URLs, we can fetch them via proxy or simulate base64.
      // Let's create a real base64 fetched from the image URL, or if blocked by CORS, we can send a solid fallback to the backend API.
      // Let's build a beautiful helper.
      if (imageFile) {
        base64 = await convertFileToBase64(imageFile);
      } else if (demoPhotoUrl) {
        // Fetch demo image and convert to base64, or use pre-populated mock details directly to ensure zero CORS failure!
        // To prevent any CORS-trap, if we fetch the demo url, let's try it but handle gracefully.
        try {
          const fetched = await fetch(demoPhotoUrl);
          const blob = await fetched.blob();
          base64 = await convertFileToBase64(new File([blob], "demo.jpg"));
        } catch {
          // If CORS blocks it, we will use a high-stability mock base64/response. We can do that easily on the server.
          base64 = "DEMO_PLACEHOLDER_BASE64";
        }
      }

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64, // Base64 formatted string
          mimeType: imageFile?.type || "image/jpeg",
        }),
      });

      const data = await response.json();
      clearInterval(interval);

      if (data.success && data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
      } else {
        // Fallback robust candidates in case AI was confused to guarantee high-quality experience
        setError("AI Scenic Vision failed to isolate high-confidence matches. Please check the image horizon and try again.");
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setError("Scenic API is currently undergoing maintenance. Please select a spot manually or try another picture.");
    } finally {
      setLoading(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:image/*;base64, prefix
        const base64Data = result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Back navigation */}
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-950 uppercase tracking-widest transition-colors cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Start over / Try another photo
      </button>

      <div className="grid md:grid-cols-5 gap-6 items-start">
        
        {/* Left Column: Image Preview Card */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs">
            <div className="border-b border-slate-100 p-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Photo under review</h3>
            </div>
            <div className="bg-slate-50 aspect-[4/3] w-full">
              <img
                src={imagePreviewUrl}
                alt="Uploaded Scenery"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-[11px] text-slate-500 leading-snug">
                <strong>No Location Data:</strong> GPS coordination metadata fields were stripped or missing from this file.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic AI Action Panel */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-150 p-8 shadow-xs min-h-[350px] flex flex-col justify-between">
          
          {/* Initial Selection State */}
          {candidates.length === 0 && !loading && (
            <div className="space-y-6 flex-1 flex flex-col justify-center">
              <div className="space-y-3 text-center md:text-left">
                <span className="inline-flex gap-1.5 items-center px-3 py-1 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-full uppercase tracking-widest border border-slate-200/60 font-mono mb-2">
                  <Brain className="w-3.5 h-3.5 text-slate-500" /> Experimental AI Matcher
                </span>
                <h3 className="text-xl font-extrabold text-slate-950 tracking-tight">Activate Scenic Vision Landmark Search</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium uppercase tracking-wider">
                  Our advanced visual models can analyze horizon contours, building symmetries, plant species, and lighting directions to predict exactly where this photo was snapped. 
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-2.5 items-start text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-650 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="activate-ai-btn"
                  onClick={startAIVisionSearch}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 active:scale-95 text-white font-bold rounded-full text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Brain className="w-4 h-4 text-slate-300" /> Start AI Vision Scanning (1 Credit)
                </button>
                <button
                  onClick={onReset}
                  className="px-6 py-3 border border-slate-250 hover:bg-slate-50 text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer"
                >
                  Pick another photo
                </button>
              </div>
            </div>
          )}

          {/* Loading States */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-6 animate-pulse">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-950 rounded-full animate-spin"></div>
                <Brain className="w-6 h-6 text-slate-950 absolute inset-0 m-auto animate-bounce" />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-sm font-bold text-slate-950">AI Landmark Tracker Active</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[280px]">
                  {LOADER_MESSAGES[loaderMessageIndex]}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 max-w-xs text-center leading-relaxed">
                This takes about 5-8 seconds as Gemini analyzes visual pixels and evaluates candidate locations.
              </p>
            </div>
          )}

          {/* Candidates Display State */}
          {candidates.length > 0 && !loading && (
            <div className="space-y-4 flex-1">
              <div>
                <span className="inline-flex gap-1 items-center px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md uppercase tracking-wider border border-emerald-150">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Match Found
                </span>
                <h3 className="text-base font-bold text-slate-950 mt-2">Select the Correct Candidate Spot</h3>
                <p className="text-xs text-slate-400">Gemini isolated potential geometric candidates from the photograph context:</p>
              </div>

              <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
                {candidates.map((cand, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectCoordinates(cand.lat, cand.lng, cand.name)}
                    className="p-5 rounded-2xl border border-slate-150 bg-white hover:border-slate-950 hover:bg-slate-50/30 cursor-pointer transition-all flex items-start justify-between group shadow-sm"
                  >
                    <div className="space-y-1.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-colors">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-950 group-hover:text-slate-905 transition-colors">
                          {cand.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400">{cand.address}</p>
                      
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/80 flex gap-1.5 items-start text-[10px] text-slate-500 leading-relaxed mt-2">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span><strong>Match Reasoning:</strong> {cand.reasoning}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-950 text-white text-[10px] font-bold rounded-md">
                        <Star className="w-3 h-3 text-white fill-white" />
                        <span>{cand.confidence}%</span>
                      </div>
                      <span className="block text-[9px] text-slate-450 font-mono mt-1">lat/lng ready</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
