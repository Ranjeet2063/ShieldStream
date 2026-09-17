"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { StatsBanner } from "@/components/StatsBanner";
import { StreamCard, StreamData } from "@/components/StreamCard";
import { CreateStreamModal } from "@/components/CreateStreamModal";
import { ZkProofModal } from "@/components/ZkProofModal";
import {
  Shield,
  Plus,
  Lock,
  Layers,
  Code2,
  Terminal,
  FileCheck2,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isZkModalOpen, setIsZkModalOpen] = useState<boolean>(false);
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);
  const [selectedClaimAmount, setSelectedClaimAmount] = useState<number>(0);

  // Initial demo streams showcasing continuous live streaming
  const [streams, setStreams] = useState<StreamData[]>([
    {
      id: "7B2E49A1",
      sender: "9WzDXwBbm kg8...41Ja",
      recipient: "4Nd1mBQtrqW9N4Wb3jK87mF4yA3vC9X7Z5t1Q",
      totalAmount: 4800,
      token: "USDC",
      startTime: Date.now() - 12 * 24 * 3600 * 1000, // started 12 days ago
      endTime: Date.now() + 18 * 24 * 3600 * 1000,   // ends in 18 days
      withdrawnAmount: 850,
      commitment: "0x3f8a91b2c4e5d6a7890123456789abcdef0123456789abcdef0123456789abcd",
      isPrivate: true,
    },
    {
      id: "9C1F88B4",
      sender: "8TyV...9Q2a",
      recipient: "7xKp...3M4s",
      totalAmount: 75,
      token: "SOL",
      startTime: Date.now() - 3 * 24 * 3600 * 1000,  // started 3 days ago
      endTime: Date.now() + 27 * 24 * 3600 * 1000,  // ends in 27 days
      withdrawnAmount: 5,
      commitment: "0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567",
      isPrivate: true,
    },
    {
      id: "3E7D55C8",
      sender: "3PaL...22Nx",
      recipient: "5VjQ...88Lk",
      totalAmount: 12500,
      token: "USDC",
      startTime: Date.now() - 25 * 24 * 3600 * 1000, // started 25 days ago
      endTime: Date.now() + 5 * 24 * 3600 * 1000,    // ends in 5 days
      withdrawnAmount: 6200,
      commitment: "0xbcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789a",
      isPrivate: true,
    },
  ]);

  const handleClaimClick = (stream: StreamData, claimable: number) => {
    setSelectedStream(stream);
    setSelectedClaimAmount(claimable);
    setIsZkModalOpen(true);
  };

  const handleClaimSuccess = (streamId: string, claimed: number) => {
    setStreams((prev) =>
      prev.map((s) =>
        s.id === streamId
          ? { ...s, withdrawnAmount: s.withdrawnAmount + claimed }
          : s
      )
    );
  };

  const handleCreated = (newStream: StreamData) => {
    setStreams((prev) => [newStream, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar onCreateClick={() => setIsCreateOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-xs font-semibold text-cyan-300 mb-6 glow-cyan">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Colosseum World&apos;s Fair 2026 • Official Flagship</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            Confidential Streaming &amp; Payroll on{" "}
            <span className="text-gradient">Solana</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-8">
            Continuous token vesting with Zero-Knowledge solvency proofs.
            Stream compensation per-second while keeping executive salaries,
            vesting rates, and treasury holdings 100% hidden on-chain.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-semibold text-sm shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Confidential Stream</span>
            </button>
            <a
              href="https://github.com/Ranjeet2063/ShieldStream"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-shield-card hover:bg-gray-800 border border-shield-border text-gray-200 font-semibold text-sm transition-all flex items-center space-x-2"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>View Smart Contracts</span>
            </a>
          </div>
        </section>

        {/* Real-time Protocol Stats */}
        <StatsBanner />

        {/* Active Streams Section */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>Active Confidential Streams</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {streams.length} Live
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Balances updating dynamically every 60 milliseconds on Solana Devnet
              </p>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-shield-card border border-shield-border hover:border-cyan-500/60 text-gray-200 transition-all self-start"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Stream</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                onClaimClick={handleClaimClick}
              />
            ))}
          </div>
        </section>

        {/* Cryptographic Architecture Deep Dive */}
        <section className="rounded-3xl bg-shield-card border border-shield-border p-8 sm:p-10 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none"></div>

          <div className="max-w-2xl mb-8">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold block mb-2">
              Cryptographic Invariants &amp; Solvency
            </span>
            <h3 className="text-2xl font-bold text-white mb-3">
              How ShieldStream Solves the Payroll Privacy Problem
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Standard Solana streaming exposes every employee&apos;s balance and
              flow rate. ShieldStream uses Poseidon cryptographic commitments
              and UltraHonk ZK circuits to guarantee mathematical correctness
              without revealing financial amounts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-shield-dark/80 border border-shield-border/70">
              <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center mb-4 text-cyan-400">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">
                1. Poseidon Commitment
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Deposit creates an on-chain cryptographic commitment{" "}
                <code className="text-cyan-300 font-mono">
                  H(amount, recipient, secret)
                </code>
                . Only the commitment hash is public.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-shield-dark/80 border border-shield-border/70">
              <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center mb-4 text-purple-400">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">
                2. Continuous Solvency Proof
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Noir UltraHonk circuit evaluates:{" "}
                <code className="text-purple-300 font-mono">
                  unlocked_balance &gt;= claimed + withdrawn
                </code>
                . Zero double-claims permitted.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-shield-dark/80 border border-shield-border/70">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center mb-4 text-emerald-400">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">
                3. On-Chain Verification
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Anchor Solana program verifies UltraHonk proof in &lt; 100ms.
                Funds transfer seamlessly to the recipient&apos;s wallet.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-shield-border/50 py-8 bg-shield-dark/90 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-semibold">ShieldStream Protocol</span>
            <span>• Built for Colosseum World&apos;s Fair 2026</span>
          </div>
          <div className="text-gray-400">
            Open-source under MIT / Apache 2.0 • Solvency Formally Verified
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateStreamModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />

      <ZkProofModal
        isOpen={isZkModalOpen}
        onClose={() => setIsZkModalOpen(false)}
        stream={selectedStream}
        claimAmount={selectedClaimAmount}
        onClaimSuccess={handleClaimSuccess}
      />
    </div>
  );
}
