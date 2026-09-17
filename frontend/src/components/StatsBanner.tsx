"use client";

import React, { FC } from "react";
import { ShieldCheck, Zap, Activity, Users } from "lucide-react";

export const StatsBanner: FC = () => {
  const stats = [
    {
      label: "Total Confidential Volume",
      value: "$1,842,500 USDC",
      change: "+28.4% this week",
      icon: Activity,
      color: "text-cyan-400",
      bg: "bg-cyan-950/40 border-cyan-800/40",
    },
    {
      label: "Active ZK Streams",
      value: "142 Streams",
      change: "100% Solvency Preserved",
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-950/40 border-purple-800/40",
    },
    {
      label: "Average Proof Latency",
      value: "84 ms",
      change: "UltraHonk WASM in-browser",
      icon: Zap,
      color: "text-emerald-400",
      bg: "bg-emerald-950/40 border-emerald-800/40",
    },
    {
      label: "Double-Spend Prevention",
      value: "100% Invariant",
      change: "Poseidon Nullifier Tree",
      icon: ShieldCheck,
      color: "text-blue-400",
      bg: "bg-blue-950/40 border-blue-800/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-shield-card border border-shield-border/70 hover:border-cyan-500/40 transition-all duration-300 group hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400">
                {stat.label}
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${stat.bg}`}
              >
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-white mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <span>{stat.change}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
