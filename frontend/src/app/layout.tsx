import type { Metadata } from "next";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";

export const metadata: Metadata = {
  title: "ShieldStream | Confidential ZK Payment Streaming on Solana",
  description:
    "Zero-Knowledge continuous payroll and vesting protocol powered by UltraHonk and Poseidon commitments on Solana.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-shield-dark text-foreground min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
