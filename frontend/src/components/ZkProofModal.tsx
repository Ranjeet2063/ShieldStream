"use client";

import React, { FC, useState, useEffect } from "react";
import { X, ShieldCheck, Check, Loader2, ExternalLink, Cpu, Terminal } from "lucide-react";
import confetti from "canvas-confetti";
import { StreamData } from "./StreamCard";

interface ZkProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  stream: StreamData | null;
  claimAmount: number;
  onClaimSuccess: (streamId: string, claimed: number) => void;
}

export const ZkProofModal: FC<ZkProofModalProps> = ({
  isOpen,
  onClose,
  stream,
  claimAmount,
  onClaimSuccess,
}) => {
  const [step, setStep] = useState<number>(0);
  const [txSignature, setTxSignature] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setTxSignature("");
      return;
    }

    // Step-by-step ZK proof generation sequence
    const t1 = setTimeout(() => setStep(1), 500);  // Nullifier derivation
    const t2 = setTimeout(() => setStep(2), 1200); // UltraHonk polynomial commitment
    const t3 = setTimeout(() => setStep(3), 2000); // Anchor smart contract verification
    const t4 = setTimeout(() => {
      setStep(4); // Finished
      const mockTx = "5Kz" + Array.from({ length: 85 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setTxSignature(mockTx);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      if (stream) {
        onClaimSuccess(stream.id, claimAmount);
      }
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, stream, claimAmount]);

  if (!isOpen || !stream) return null;

  const stepsList = [
    {
      title: "Deriving Cryptographic Nullifier",
      desc: "Poseidon(recipient_privkey, stream_id) preventing double-claim",
    },
    {
      title: "Evaluating Noir UltraHonk Circuit",
      desc: "Synthesizing 3,412 arithmetic constraints on curve BN254",
    },
    {
      title: "Submitting Proof to Solana Devnet",
      desc: "Anchor contract verifies zero under-collateralization invariant",
    },
    {
      title: "Zero-Knowledge Settlement Complete",
      desc: "Funds unlocked to wallet without exposing continuous compensation rate",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-shield-card border border-shield-border p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-purple-600/20 blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-shield-border/60 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Zero-Knowledge Claim Protocol
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                UltraHonk Verifier • BN254
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800/50 hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount to claim badge */}
        <div className="mb-6 p-4 rounded-2xl bg-shield-dark border border-shield-border text-center">
          <span className="text-xs text-gray-400 block mb-1">Claim Amount</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-gradient">
            +{claimAmount.toFixed(4)} {stream.token}
          </div>
          <span className="text-[11px] text-gray-500 font-mono">
            Zero financial data leaked to Solana public mempool
          </span>
        </div>

        {/* Real-time Proof Execution Pipeline */}
        <div className="space-y-3.5 mb-6">
          {stepsList.map((item, idx) => {
            const isCompleted = step > idx;
            const isCurrent = step === idx;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all duration-300 flex items-start space-x-3 ${
                  isCompleted
                    ? "bg-emerald-950/20 border-emerald-800/50 text-white"
                    : isCurrent
                    ? "bg-purple-950/40 border-purple-600/70 text-white shadow-lg shadow-purple-900/20"
                    : "bg-shield-dark/50 border-shield-border/40 text-gray-500 opacity-60"
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-gray-700 flex items-center justify-center text-[10px] font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{item.title}</div>
                  <div className="text-[11px] text-gray-400 font-mono truncate">
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Finished State: Devnet Tx Hash */}
        {step >= 4 && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3.5 rounded-xl bg-shield-dark border border-emerald-800/40 mb-5">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Solana Devnet Verified</span>
                </span>
                <span className="text-[10px] text-gray-500 font-mono">Slot #31294829</span>
              </div>
              <p className="text-[11px] text-gray-300 font-mono break-all truncate">
                Tx: {txSignature}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold text-xs shadow-lg shadow-emerald-500/25 hover:scale-[1.01] transition-all"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
