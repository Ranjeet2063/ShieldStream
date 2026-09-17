"use client";

import React, { FC } from "react";
import dynamic from "next/dynamic";
import { Shield, Sparkles, ExternalLink, Lock } from "lucide-react";

// Dynamic import for WalletMultiButton to prevent SSR hydration mismatch
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

interface NavbarProps {
  onCreateClick: () => void;
}

export const Navbar: FC<NavbarProps> = ({ onCreateClick }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-shield-border/60 bg-shield-dark/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo & Protocol Title */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 p-[1.5px] glow-cyan">
            <div className="w-full h-full bg-shield-dark rounded-[10px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Shield<span className="text-gradient">Stream</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                ZK UltraHonk
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Confidential Payroll & Vesting on Solana
            </p>
          </div>
        </div>

        {/* Center: Hackathon / Devnet Badges */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-800/40 text-xs text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Colosseum World&apos;s Fair 2026</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/50 text-xs text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Solana Devnet</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onCreateClick}
            className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>New Private Stream</span>
          </button>
          <div className="wallet-button-wrapper">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </header>
  );
};
