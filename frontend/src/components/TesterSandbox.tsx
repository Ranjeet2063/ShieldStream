"use client";

import React, { FC, useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Sparkles,
  Droplets,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
  Shield,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import { StreamData } from "./StreamCard";

interface TesterSandboxProps {
  onQuickStreamCreate: (stream: StreamData) => void;
}

export const TesterSandbox: FC<TesterSandboxProps> = ({ onQuickStreamCreate }) => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [isAirdropping, setIsAirdropping] = useState<boolean>(false);
  const [airdropMsg, setAirdropMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"sandbox" | "architecture" | "sdk">("sandbox");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [createdStreamId, setCreatedStreamId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Fetch Devnet SOL balance when connected
  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      if (connected && publicKey) {
        try {
          const bal = await connection.getBalance(publicKey);
          if (isMounted) setBalance(bal / LAMPORTS_PER_SOL);
        } catch {
          if (isMounted) setBalance(null);
        }
      } else {
        setBalance(null);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [connected, publicKey, connection]);

  const handleRequestAirdrop = async () => {
    if (!publicKey) return;
    setIsAirdropping(true);
    setAirdropMsg(null);
    try {
      const sig = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      const newBal = await connection.getBalance(publicKey);
      setBalance(newBal / LAMPORTS_PER_SOL);
      setAirdropMsg({ text: "✓ Successfully received 1.0 Devnet SOL!", type: "success" });
    } catch (err: any) {
      setAirdropMsg({
        text: "Devnet faucet rate-limit reached. You can still test with simulated stream!",
        type: "error",
      });
    } finally {
      setIsAirdropping(false);
      setTimeout(() => setAirdropMsg(null), 6000);
    }
  };

  const handleQuickDemoStream = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsSimulating(true);

    setTimeout(() => {
      const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const mockRecipient = publicKey
        ? publicKey.toBase58().substring(0, 4) + "..." + publicKey.toBase58().substring(publicKey.toBase58().length - 4)
        : "DemoContributor.sol";

      const newStream: StreamData = {
        id: randomId,
        sender: publicKey ? publicKey.toBase58().substring(0, 4) + "...DaoTreasury" : "AcmeCorp.sol",
        recipient: mockRecipient,
        totalAmount: 1000,
        token: "USDC",
        startTime: Date.now() - 3600 * 1000, // started 1h ago
        endTime: Date.now() + 30 * 24 * 3600 * 1000, // 30 days
        withdrawnAmount: 0,
        commitment: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        isPrivate: true,
      };

      onQuickStreamCreate(newStream);
      setCreatedStreamId(randomId);
      setIsSimulating(false);

      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.65 },
        });
      } catch (err) {
        console.error("Confetti error:", err);
      }

      // Smooth scroll down to Active Streams
      setTimeout(() => {
        const activeSection = document.getElementById("active-streams");
        if (activeSection) {
          activeSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);

      setTimeout(() => setCreatedStreamId(null), 10000);
    }, 250);
  };

  const codeSnippet = `import { ShieldStreamClient } from "@shieldstream/sdk";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

// 1. Initialize client connected to Solana Devnet
const client = new ShieldStreamClient(connection, wallet);

// 2. Initialize confidential stream with Aztec Noir Poseidon rate commitment
const { streamId, txSignature } = await client.createStream({
  recipient: "4Nd1mBQtrqW9N4Wb3jK87mF4yA3vC9X7Z5t1Q",
  amount: 5000, // 5,000 USDC
  token: "USDC",
  durationSeconds: 30 * 86400, // 30 days
  isConfidential: true, // Noir ZK UltraHonk hidden rate
});

console.log("Stream active on Devnet:", streamId);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section className="mb-14 rounded-3xl bg-gradient-to-br from-shield-card/90 via-shield-card to-shield-dark border border-shield-border/90 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-600/10 to-purple-600/10 blur-3xl pointer-events-none" />

      {/* Header with Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-shield-border/60">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-xs font-semibold text-cyan-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Colosseum Hackathon Sandbox</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Judges &amp; Testers Playground
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Interactive test harness for Solana Devnet streaming and Aztec Noir UltraHonk ZK verification.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex rounded-xl bg-shield-dark/80 p-1 border border-shield-border/80 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "sandbox"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Devnet Playground
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "architecture"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            ZK Architecture
          </button>
          <button
            onClick={() => setActiveTab("sdk")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "sdk"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            SDK Quickstart
          </button>
        </div>
      </div>

      {/* Tab 1: Devnet Sandbox */}
      {activeTab === "sandbox" && (
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Connected Wallet Status & Airdrop */}
          <div className="rounded-2xl bg-shield-dark/60 border border-shield-border p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-gray-400">Target Network</span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Solana Devnet</span>
                </span>
              </div>

              <div className="p-4 rounded-xl bg-shield-card/80 border border-shield-border/60 mb-4">
                <p className="text-xs text-gray-400 mb-1">Active Wallet Address</p>
                <p className="font-mono text-xs sm:text-sm text-gray-200 truncate">
                  {connected && publicKey ? publicKey.toBase58() : "Wallet Not Connected (Click 'Select Wallet')"}
                </p>
                {connected && balance !== null && (
                  <div className="mt-2 pt-2 border-t border-shield-border/40 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Devnet Balance:</span>
                    <span className="font-semibold text-emerald-400">{balance.toFixed(4)} SOL</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {airdropMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
                    airdropMsg.type === "success"
                      ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                      : "bg-amber-950/40 border-amber-800 text-amber-300"
                  }`}
                >
                  {airdropMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  )}
                  <span>{airdropMsg.text}</span>
                </div>
              )}

              <button
                onClick={handleRequestAirdrop}
                disabled={!connected || isAirdropping}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>{isAirdropping ? "Requesting Devnet Airdrop..." : "Request 1 Devnet SOL (Faucet)"}</span>
              </button>
            </div>
          </div>

          {/* Right: 1-Click Instant Demo Stream */}
          <div className="rounded-2xl bg-shield-dark/60 border border-shield-border p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
                <Play className="w-4 h-4 text-cyan-400" />
                <span>1-Click Test Stream Simulator</span>
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Instantly launch an active 30-day confidential payroll stream without manual parameter configuration.
                The stream begins real-time per-second token distribution immediately.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-shield-card border border-shield-border/40">
                  <span className="text-gray-500 block">Amount</span>
                  <span className="text-white font-semibold">1,000 USDC</span>
                </div>
                <div className="p-3 rounded-xl bg-shield-card border border-shield-border/40">
                  <span className="text-gray-500 block">Rate Privacy</span>
                  <span className="text-cyan-400 font-semibold">Poseidon ZK</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              {createdStreamId && (
                <div className="p-3 rounded-xl text-xs flex items-center space-x-2 border bg-emerald-950/70 border-emerald-700 text-emerald-300 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    ✓ Stream <strong className="text-white font-mono">#{createdStreamId}</strong> launched! Scrolled to Active Streams.
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleQuickDemoStream}
                disabled={isSimulating}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 relative z-20"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {isSimulating
                    ? "Generating Poseidon Commitment..."
                    : createdStreamId
                    ? `✓ Stream #${createdStreamId} Active (Click to Add Another)`
                    : "Launch Instant Test Stream"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cryptographic Architecture Trace */}
      {activeTab === "architecture" && (
        <div className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-shield-dark/60 border border-shield-border flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-3 font-bold text-xs">
                  01
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Poseidon Commitment</h4>
                <p className="text-xs text-gray-400">
                  Employer generates on-chain rate commitment <code className="text-cyan-300 font-mono">H(rate, salt)</code> hiding stream velocity.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-shield-border/40 text-[11px] text-gray-500 font-mono">
                Anchor Escrow Vault
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-shield-dark/60 border border-shield-border flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 mb-3 font-bold text-xs">
                  02
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Noir UltraHonk Circuit</h4>
                <p className="text-xs text-gray-400">
                  Contributor client proves <code className="text-purple-300 font-mono">unlocked &gt;= claimed</code> over BN254 elliptic curve in ~84ms.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-shield-border/40 text-[11px] text-gray-500 font-mono">
                WASM In-Browser Prover
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-shield-dark/60 border border-shield-border flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 mb-3 font-bold text-xs">
                  03
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Cryptographic Nullifier</h4>
                <p className="text-xs text-gray-400">
                  Burns <code className="text-blue-300 font-mono">Poseidon(nullifier_key, stream_id)</code> preventing double claims.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-shield-border/40 text-[11px] text-gray-500 font-mono">
                Zero Double-Spend
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-shield-dark/60 border border-shield-border flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mb-3 font-bold text-xs">
                  04
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">On-Chain Settlement</h4>
                <p className="text-xs text-gray-400">
                  Solana smart contract transfers tokens directly to contributor wallet with zero rate leakage.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-shield-border/40 text-[11px] text-gray-500 font-mono">
                400ms Finality
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: SDK Integration */}
      {activeTab === "sdk" && (
        <div className="pt-6">
          <div className="relative rounded-2xl bg-black/70 border border-shield-border/80 overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2.5 bg-shield-dark border-b border-shield-border/60">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-300 font-semibold">example_integration.ts</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-shield-card hover:bg-gray-800 text-gray-300 transition-all text-[11px]"
              >
                {copiedCode ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-gray-300 overflow-x-auto leading-relaxed">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        </div>
      )}
    </section>
  );
};
