"use client";

import React, { FC, useState } from "react";
import { X, Lock, Shield, ArrowRight, Sparkles } from "lucide-react";
import { StreamData } from "./StreamCard";

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newStream: StreamData) => void;
}

export const CreateStreamModal: FC<CreateStreamModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("500");
  const [token, setToken] = useState<string>("USDC");
  const [durationDays, setDurationDays] = useState<number>(30);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const now = Date.now();
      const end = now + durationDays * 24 * 60 * 60 * 1000;
      const numAmount = parseFloat(amount) || 100;

      // Mock Poseidon commitment calculation: H(amount, recipient, secret)
      const mockCommitment =
        "0x" +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");

      const newStream: StreamData = {
        id: Math.random().toString(36).substring(2, 10).toUpperCase(),
        sender: "7ZqD...8F4a",
        recipient: recipient || "9xQe...4M2k",
        totalAmount: numAmount,
        token: token,
        startTime: now,
        endTime: end,
        withdrawnAmount: 0,
        commitment: mockCommitment,
        isPrivate: isPrivate,
      };

      onCreated(newStream);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  const fillDemoAddress = () => {
    setRecipient("4Nd1mBQtrqW9N4Wb3jK87mF4yA3vC9X7Z5t1Q");
  };

  const ratePerSec = (
    parseFloat(amount) /
    (durationDays * 24 * 3600)
  ).toFixed(7);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-shield-card border border-shield-border p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-shield-border/60 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Create Confidential Stream
              </h3>
              <p className="text-xs text-gray-400">
                ZK-shielded continuous payroll allocation
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

        {/* Stream Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Recipient Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Recipient Solana Address
              </label>
              <button
                type="button"
                onClick={fillDemoAddress}
                className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Use Demo Address</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. 4Nd1mBQtrqW9N4Wb3jK87mF4..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-shield-dark border border-shield-border focus:border-cyan-500 focus:outline-none text-white text-sm font-mono placeholder:text-gray-600 transition-colors"
            />
          </div>

          {/* Amount & Token */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                Total Stream Amount
              </label>
              <input
                type="number"
                required
                min="0.1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-shield-dark border border-shield-border focus:border-cyan-500 focus:outline-none text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                Token
              </label>
              <select
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-shield-dark border border-shield-border focus:border-cyan-500 focus:outline-none text-white text-sm font-semibold"
              >
                <option value="USDC">USDC</option>
                <option value="SOL">SOL</option>
                <option value="BONK">BONK</option>
              </select>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Stream Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDurationDays(days)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    durationDays === days
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                      : "bg-shield-dark border-shield-border text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          {/* ZK Privacy Toggle */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-white block">
                  UltraHonk ZK Shielding
                </span>
                <span className="text-[11px] text-gray-400">
                  Hides balance and rate from public Solana ledger
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isPrivate ? "bg-cyan-500" : "bg-gray-700"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  isPrivate ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Live Calculated Rate Summary */}
          <div className="p-3.5 rounded-xl bg-shield-dark border border-shield-border/50 text-xs text-gray-400 flex items-center justify-between">
            <span>Flow Rate:</span>
            <span className="text-white font-mono font-semibold">
              ~{ratePerSec} {token} / sec
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Deploying to Devnet...</span>
            ) : (
              <>
                <span>Initialize Confidential Stream</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
