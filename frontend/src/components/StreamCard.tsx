"use client";

import React, { FC, useState, useEffect } from "react";
import { Lock, Zap, ArrowUpRight, Shield, CheckCircle2, Clock } from "lucide-react";

export interface StreamData {
  id: string;
  sender: string;
  recipient: string;
  totalAmount: number; // e.g., 2500 USDC
  token: string;
  startTime: number; // timestamp in ms
  endTime: number;   // timestamp in ms
  withdrawnAmount: number;
  commitment: string;
  isPrivate: boolean;
}

interface StreamCardProps {
  stream: StreamData;
  onClaimClick: (stream: StreamData, unlocked: number) => void;
}

export const StreamCard: FC<StreamCardProps> = ({ stream, onClaimClick }) => {
  const [currentUnlocked, setCurrentUnlocked] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  useEffect(() => {
    const updateUnlocked = () => {
      const now = Date.now();
      if (now <= stream.startTime) {
        setCurrentUnlocked(0);
        setProgressPercent(0);
        return;
      }
      if (now >= stream.endTime) {
        setCurrentUnlocked(stream.totalAmount);
        setProgressPercent(100);
        return;
      }

      const totalDuration = stream.endTime - stream.startTime;
      const elapsed = now - stream.startTime;
      const progress = elapsed / totalDuration;
      const unlocked = stream.totalAmount * progress;

      setCurrentUnlocked(unlocked);
      setProgressPercent(Math.min(100, Math.max(0, progress * 100)));
    };

    updateUnlocked();
    const interval = setInterval(updateUnlocked, 60);
    return () => clearInterval(interval);
  }, [stream]);

  const claimable = Math.max(0, currentUnlocked - stream.withdrawnAmount);

  return (
    <div className="rounded-2xl bg-shield-card border border-shield-border hover:border-cyan-500/50 p-6 transition-all duration-300 relative overflow-hidden group">
      {/* Ambient gradient backplate */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none"></div>

      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center">
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white">
                Stream #{stream.id.slice(0, 8)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>STREAMING</span>
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              To: {stream.recipient.slice(0, 6)}...{stream.recipient.slice(-4)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 block">
            Confidential Total
          </span>
          <span className="text-sm font-semibold text-gray-300">
            {stream.isPrivate ? "••• PRIVACY HIDDEN •••" : `${stream.totalAmount} ${stream.token}`}
          </span>
        </div>
      </div>

      {/* Streaming Amount Display (Real-time Live Ticker) */}
      <div className="my-5 p-4 rounded-xl bg-shield-dark/90 border border-shield-border/60">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Real-Time Unlocked Balance</span>
          </span>
          <span className="text-cyan-400 font-mono text-[11px]">
            {(progressPercent).toFixed(2)}%
          </span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
            {currentUnlocked.toFixed(6)}
          </span>
          <span className="text-sm font-semibold text-cyan-400 font-mono">
            {stream.token}
          </span>
        </div>

        {/* Streaming Progress Bar */}
        <div className="w-full bg-gray-800/60 rounded-full h-2 mt-3 overflow-hidden p-[1px]">
          <div
            className="bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-75 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]"></div>
          </div>
        </div>
      </div>

      {/* Cryptographic Proof & Action Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
          <span className="flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Poseidon Hash:</span>
          </span>
          <span className="text-gray-300">{stream.commitment.slice(0, 14)}...</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-shield-border/50">
          <div>
            <span className="text-[11px] text-gray-400 block">Available to Claim</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              +{claimable.toFixed(4)} {stream.token}
            </span>
          </div>

          <button
            onClick={() => onClaimClick(stream, claimable)}
            disabled={claimable <= 0}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-600/25 hover:shadow-cyan-500/30 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>Claim via ZK Proof</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
