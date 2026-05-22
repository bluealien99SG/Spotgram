import React, { useState } from "react";
import { X, Check, CreditCard, Shield, Sparkles } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchased: (creditsGranted: number) => void;
}

const PACKS = [
  { id: "pack_5", name: "Starter Refill", count: 5, price: "$2.99", desc: "For exploring a few holiday clicks.", popular: false },
  { id: "pack_20", name: "Explorer Pack", count: 20, price: "$7.99", desc: "Best value for eager photo geeks.", popular: true },
  { id: "pack_unlimited", name: "Unlimited Pass", count: Infinity, price: "$14.99", desc: "Lifetime searches & advanced guides.", popular: false },
];

export default function CheckoutModal({ isOpen, onClose, onPurchased }: CheckoutModalProps) {
  const [selectedPack, setSelectedPack] = useState(PACKS[1]);
  const [step, setStep] = useState<"select" | "pay" | "success">("select");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleStartPayment = (pack: typeof PACKS[0]) => {
    setSelectedPack(pack);
    setStep("pay");
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate secure network transaction
    setTimeout(() => {
      setIsProcessing(false);
      setStep("success");
      onPurchased(selectedPack.count);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-150 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-950">
              {step === "select" && "Choose a Search Credit Pack"}
              {step === "pay" && "Secure Credit Checkout"}
              {step === "success" && "Purchase Complete!"}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Unlock coordinate extraction and AI vision queries</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {step === "select" && (
            <div className="space-y-6">
              <div className="text-center py-2 space-y-2">
                <span className="inline-flex gap-1 items-center px-3 py-1 bg-slate-100 border border-slate-200/60 text-slate-700 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" /> Subscription Limit Reached
                </span>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Our app uses high-precision EXIF metadata tools and server-powered AI image models. Refill easily to continue locating coordinates.
                </p>
              </div>

              <div className="grid gap-3">
                {PACKS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPack(p)}
                    className={`relative p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedPack.id === p.id
                        ? "border-slate-950 bg-slate-50/50 ring-1 ring-slate-950/20 shadow-sm"
                        : "border-slate-150 hover:border-slate-350 bg-white"
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute top-0 right-5 transform -translate-y-1/2 bg-slate-950 text-white text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full">
                        Most Popular
                      </span>
                    )}
                    <div className="flex items-center gap-3.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedPack.id === p.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300"
                      }`}>
                        {selectedPack.id === p.id && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-950">{p.name}</h4>
                        <p className="text-[11px] text-slate-400">{p.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-slate-950">{p.price}</span>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase font-mono mt-0.5">
                        {p.count === Infinity ? "Unlimited Uses" : `${p.count} searches`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                id="select-pack-btn"
                onClick={() => handleStartPayment(selectedPack)}
                className="w-full mt-2 py-3 bg-slate-950 hover:bg-slate-900 active:scale-95 text-white font-bold rounded-full text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Continue to Payment ({selectedPack.price})
              </button>
            </div>
          )}

          {step === "pay" && (
            <form onSubmit={handleSimulatePayment} className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center text-xs font-semibold">
                <div>
                  <span className="text-slate-400 block uppercase tracking-widest text-[9px]">Your Selection</span>
                  <span className="text-slate-900 text-sm font-bold">{selectedPack.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-950">{selectedPack.price}</span>
                  <button 
                    type="button" 
                    onClick={() => setStep("select")}
                    className="block text-[10px] text-slate-450 hover:text-slate-950 font-bold hover:underline cursor-pointer mt-0.5"
                  >
                    Change selection
                  </button>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Elena Rostova"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-950/15 focus:border-slate-955 text-slate-850"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      pattern="[0-9\s]{13,19}"
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-950/15 focus:border-slate-955 text-slate-850"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Expiry Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.length > 2) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                        setCardExpiry(val);
                      }}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-950/15 focus:border-slate-955 text-center text-slate-855"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">CVV</label>
                    <input
                      type="password"
                      required
                      placeholder="•••"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-950/15 focus:border-slate-955 text-center font-mono text-slate-855"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 text-white font-bold rounded-full text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Encrypting Securing Vault...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 text-slate-350" />
                      Pay {selectedPack.price} & Unlock
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed uppercase tracking-wider">
                This is a secure checkout simulation. Sandbox mode is active. No real funds will be processed.
              </p>
            </form>
          )}

          {step === "success" && (
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 bg-slate-950 text-white rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-950">Payment Successfully Authenticated</h4>
                <p className="text-xs text-slate-400">
                  {selectedPack.count === Infinity 
                    ? "Lifetime unlimited guides and vision uploads are now active!"
                    : `We loaded ${selectedPack.count} search credits into your balanced local purse.`}
                </p>
              </div>
              <button
                id="success-close-btn"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Back to Image Guide
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
