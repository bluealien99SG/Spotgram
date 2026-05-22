import { Sparkles, Coins } from "lucide-react";

interface HeaderProps {
  credits: number;
  onOpenCheckout: () => void;
}

export default function Header({ credits, onOpenCheckout }: HeaderProps) {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-orange-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo element representing Spotgram (Camera shutter + GPS Pin target) */}
          <div className="w-10 h-10 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/25 relative group overflow-hidden">
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <svg 
              className="w-5 h-5 animate-pulse" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {/* Outer camera shape */}
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              {/* Inner lens center GPS Pin look */}
              <circle cx="12" cy="13" r="3" />
              <path d="M12 10v1" />
            </svg>
            {/* Interactive spark micro-dot */}
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold text-slate-950 tracking-tight leading-none font-sans">
                Spot<span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent italic font-black">gram</span>
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[8px] font-black uppercase tracking-wider font-mono">
                v2.1
              </span>
            </div>
            <span className="text-[9px] text-orange-600 font-bold uppercase tracking-wider mt-1 block">Precision GPS EXIF & AI Sun Tracker</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50/50 text-amber-800 rounded-full text-[10px] font-bold border border-amber-100/60 font-mono shadow-sm">
            <Coins className="w-3 h-3 text-orange-500" />
            <span>{credits === Infinity ? "Unlimited" : `${credits} Search Credits`}</span>
          </div>
          
          <button
            id="buy-credits-btn"
            onClick={onOpenCheckout}
            className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-full text-xs font-bold cursor-pointer transition-all hover:opacity-95 active:scale-95 shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 flex items-center justify-center"
          >
            Refill Credits
          </button>
        </div>
      </div>
    </header>
  );
}
