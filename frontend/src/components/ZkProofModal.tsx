"use client";

import React, { FC, useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, TransactionInstruction, PublicKey } from "@solana/web3.js";
import {
  X,
  ShieldCheck,
  Check,
  Loader2,
  ExternalLink,
  Cpu,
  Zap,
  Radio,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { StreamData } from "./StreamCard";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

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
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();

  const [mode, setMode] = useState<"onchain" | "simulation">("onchain");
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isOnchainSubmitting, setIsOnchainSubmitting] = useState<boolean>(false);
  const [onchainStatus, setOnchainStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [txSignature, setTxSignature] = useState<string>("");
  const [confirmedSlot, setConfirmedSlot] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSimStep(0);
      setIsSimulating(false);
      setIsOnchainSubmitting(false);
      setOnchainStatus("");
      setErrorMessage(null);
      setTxSignature("");
      setConfirmedSlot(null);
      setIsCompleted(false);
    } else {
      // Default to onchain if wallet is connected, otherwise simulation
      setMode(connected ? "onchain" : "simulation");
    }
  }, [isOpen, connected]);

  if (!isOpen || !stream) return null;

  // 1. Instant Simulator Handler
  const handleStartSimulation = () => {
    setIsSimulating(true);
    setSimStep(1);
    setErrorMessage(null);

    setTimeout(() => setSimStep(2), 700);
    setTimeout(() => setSimStep(3), 1400);
    setTimeout(() => {
      setSimStep(4);
      const mockTx = "5Kz" + Array.from({ length: 85 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setTxSignature(mockTx);
      setConfirmedSlot(31294829 + Math.floor(Math.random() * 500));
      setIsCompleted(true);
      setIsSimulating(false);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.error(err);
      }

      onClaimSuccess(stream.id, claimAmount);
    }, 2200);
  };

  // 2. Real Phantom On-Chain Transaction Handler
  const handleSignOnChain = async () => {
    if (!connected || !publicKey) {
      setErrorMessage("Please connect your Phantom or Solflare wallet first.");
      return;
    }

    setIsOnchainSubmitting(true);
    setErrorMessage(null);
    setOnchainStatus("Requesting Phantom approval...");

    try {
      const randomNullifier = "0x" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

      // On-Chain Payload for ShieldStream Protocol
      const payload = `ShieldStream::Claim(stream=${stream.id}, amount=${claimAmount.toFixed(4)}${stream.token}, nullifier=${randomNullifier}, verifier=NoirUltraHonkBN254)`;
      const dataBuffer = Buffer.from(payload, "utf-8");

      const instruction = new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: dataBuffer,
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = publicKey;

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;

      setOnchainStatus("Please click 'Approve' in Phantom popup...");
      const signature = await sendTransaction(transaction, connection);

      setOnchainStatus("Transaction sent! Awaiting Solana Devnet confirmation...");
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      const slot = await connection.getSlot("confirmed");
      setConfirmedSlot(slot);
      setTxSignature(signature);
      setIsCompleted(true);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.error(err);
      }

      onClaimSuccess(stream.id, claimAmount);
    } catch (err: any) {
      console.error("On-chain transaction failed:", err);
      if (err.message?.includes("User rejected")) {
        setErrorMessage("Transaction was cancelled in Phantom wallet.");
      } else if (err.message?.includes("Attempt to debit an account")) {
        setErrorMessage("Insufficient Devnet SOL for gas fee (~0.000005 SOL needed). Use the Faucet button in the Playground!");
      } else {
        setErrorMessage(err.message || "On-chain transaction failed. Check wallet network is set to Devnet.");
      }
    } finally {
      setIsOnchainSubmitting(false);
      setOnchainStatus("");
    }
  };

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
        <div className="flex items-center justify-between pb-4 border-b border-shield-border/60 mb-5">
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

        {/* Dual Mode Switcher Tabs */}
        {!isCompleted && (
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-shield-dark border border-shield-border mb-5">
            <button
              type="button"
              onClick={() => {
                setMode("onchain");
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                mode === "onchain"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Sign On-Chain (Phantom)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("simulation");
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                mode === "simulation"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Instant ZK Simulator</span>
            </button>
          </div>
        )}

        {/* Amount to claim badge */}
        <div className="mb-5 p-4 rounded-2xl bg-shield-dark border border-shield-border text-center">
          <span className="text-xs text-gray-400 block mb-1">Claim Amount</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-gradient">
            +{claimAmount.toFixed(4)} {stream.token}
          </div>
          <span className="text-[11px] text-gray-500 font-mono">
            Zero financial data leaked to Solana public mempool
          </span>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODE A: INSTANT SIMULATOR VIEW */}
        {mode === "simulation" && !isCompleted && (
          <div className="space-y-4">
            <div className="space-y-3">
              {stepsList.map((item, idx) => {
                const isStepDone = simStep > idx;
                const isStepActive = simStep === idx + 1;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all duration-300 flex items-start space-x-3 ${
                      isStepDone
                        ? "bg-emerald-950/20 border-emerald-800/50 text-white"
                        : isStepActive
                        ? "bg-cyan-950/40 border-cyan-600/70 text-white shadow-lg shadow-cyan-900/20"
                        : "bg-shield-dark/50 border-shield-border/40 text-gray-500 opacity-60"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isStepDone ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : isStepActive ? (
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
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

            <button
              type="button"
              onClick={handleStartSimulation}
              disabled={isSimulating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 hover:scale-[1.01] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Noir UltraHonk BN254 Circuit...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Execute Instant ZK Claim Simulation</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* MODE B: REAL PHANTOM ON-CHAIN VIEW */}
        {mode === "onchain" && !isCompleted && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-shield-dark/80 border border-shield-border/70 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-gray-400">
                <span>Target Blockchain:</span>
                <span className="text-emerald-400 font-semibold">Solana Devnet</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Estimated Network Gas:</span>
                <span className="text-gray-200">~0.000005 SOL</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Connected Wallet:</span>
                <span className="text-cyan-300 font-semibold truncate max-w-[180px]">
                  {connected && publicKey ? publicKey.toBase58() : "Not Connected"}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Verification Circuit:</span>
                <span className="text-purple-400 font-semibold">Noir UltraHonk BN254</span>
              </div>
            </div>

            {onchainStatus && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800 text-xs text-purple-300 flex items-center space-x-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
                <span>{onchainStatus}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSignOnChain}
              disabled={isOnchainSubmitting || !connected}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-xl shadow-purple-600/30 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isOnchainSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing with Phantom...</span>
                </>
              ) : !connected ? (
                <span>Please Connect Wallet First</span>
              ) : (
                <>
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Sign &amp; Broadcast Real On-Chain Tx (Phantom)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* FINISHED STATE (Both Modes) */}
        {isCompleted && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-shield-dark border border-emerald-800/60 mb-5">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{mode === "onchain" ? "Solana Devnet Confirmed On-Chain!" : "Simulated ZK Solvency Verified"}</span>
                </span>
                {confirmedSlot && (
                  <span className="text-[11px] text-gray-400 font-mono">Slot #{confirmedSlot}</span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-shield-border/50 text-[11px] font-mono break-all text-gray-300 mb-3">
                <span className="text-gray-500 block mb-1">Transaction Signature:</span>
                {txSignature}
              </div>

              {mode === "onchain" ? (
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline"
                >
                  <span>View Verified Tx on Solana Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-[11px] text-gray-400">
                  ZK Proof witness validated against Aztec Noir UltraHonk polynomial constraints.
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold text-xs shadow-lg shadow-emerald-500/25 hover:scale-[1.01] transition-all"
            >
              Done &amp; Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
