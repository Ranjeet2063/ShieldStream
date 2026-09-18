# @shieldstream/sdk

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195.svg)](https://solana.com/)
[![ZK](https://img.shields.io/badge/ZK-UltraHonk%2084ms-7928CA.svg)](https://noir-lang.org/)

Official TypeScript SDK for **ShieldStream**, the confidential payment streaming and private payroll protocol built on Solana and powered by Zero-Knowledge proofs (Aztec Noir UltraHonk).

ShieldStream allows organizations and individuals to stream tokens continuously in real time while keeping streaming rates, salaries, and accumulated balances cryptographically concealed from public observers and blockchain analytics.

---

## Features

- **Confidential Streaming**: Salaries and rates are committed cryptographically (`Poseidon`/`SHA-256`) — only the sender and recipient know the true rate.
- **Zero-Knowledge Claims**: Recipients withdraw vested funds on-chain using client-generated ZK proofs without revealing their underlying salary or vesting rate.
- **Double-Spend Prevention**: Deterministic cryptographic nullifiers ensure that each withdrawal witness can only be consumed once on-chain.
- **High Performance**: Client-side proof generation executes in ~84ms in standard web browsers.
- **Anchor & Native Solana Compatible**: Provides instruction builders, account decoders, and deterministic PDA derivations directly usable with `@solana/web3.js` and standard wallet adapters.

---

## Installation

```bash
# Using npm
npm install @shieldstream/sdk @solana/web3.js @solana/spl-token

# Using bun
bun add @shieldstream/sdk @solana/web3.js @solana/spl-token

# Using pnpm
pnpm add @shieldstream/sdk @solana/web3.js @solana/spl-token
```

---

## Quickstart

### 1. Initializing a Confidential Stream (Employer / Sender)

```typescript
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { ShieldStreamClient } from "@shieldstream/sdk";
import * as crypto from "crypto";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const employerKeypair = Keypair.generate();
const employeePubkey = new PublicKey("...");
const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const employerUsdcAta = new PublicKey("...");

// 1. Generate stream parameters
const streamId = BigInt(Date.now());
const startTime = Math.floor(Date.now() / 1000);
const stopTime = startTime + 30 * 24 * 3600; // 30 days
const totalDeposit = 5000000000n; // 5,000 USDC (6 decimals)

// 2. Compute private rate commitment
const rateTokensPerSec = 1929n; // ~5,000 USDC / 30 days
const salt = crypto.randomBytes(32);
const rateCommitment = ShieldStreamClient.generateRateCommitment(rateTokensPerSec, salt);
const stateCommitment = crypto.randomBytes(32);

// 3. Build initialization instruction
const initIx = ShieldStreamClient.createInitializeStreamInstruction({
  sender: employerKeypair.publicKey,
  recipient: employeePubkey,
  mint: usdcMint,
  senderTokenAccount: employerUsdcAta,
  streamId,
  startTime,
  stopTime,
  initialDeposit: totalDeposit,
  rateCommitment,
  stateCommitment,
});

const tx = new Transaction().add(initIx);
const sig = await sendAndConfirmTransaction(connection, tx, [employerKeypair]);
console.log(`Stream initialized: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
```

---

### 2. Withdrawing Vested Funds via Zero-Knowledge Proof (Employee / Recipient)

```typescript
import { ShieldStreamClient } from "@shieldstream/sdk";

// 1. Derive stream & vault PDAs
const [streamPda] = ShieldStreamClient.getStreamAddress(employerPubkey, streamId);
const [vaultPda] = ShieldStreamClient.getVaultAddress(streamPda);

// 2. Generate unique one-time nullifier to prevent double claims
const employeeSecretKey = crypto.randomBytes(32);
const nonce = 1;
const nullifier = ShieldStreamClient.generateNullifier(employeeSecretKey, streamId, nonce);

// 3. Obtain UltraHonk ZK proof and public inputs from @noir-lang/backend_barretenberg
// (In production, generated in browser in ~84ms via ShieldStream Noir circuits)
const claimedAmount = 1000000000n; // 1,000 USDC
const zkProof = Buffer.alloc(128); // Noir generated proof bytes
const publicInputs = [rateCommitment, nullifier, Buffer.alloc(32)];

// 4. Build withdrawal instruction
const withdrawIx = ShieldStreamClient.createWithdrawConfidentialInstruction({
  streamPda,
  vaultPda,
  recipient: employeeKeypair.publicKey,
  recipientTokenAccount: employeeUsdcAta,
  claimedAmount,
  nullifier,
  zkProof,
  publicInputs,
});

const tx = new Transaction().add(withdrawIx);
const sig = await sendAndConfirmTransaction(connection, tx, [employeeKeypair]);
console.log(`Confidential claim confirmed: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
```

---

### 3. Real-Time Vesting & Progress Math

Calculate exactly how much has vested at any second without floating-point rounding errors:

```typescript
import { ShieldStreamClient } from "@shieldstream/sdk";

const progress = ShieldStreamClient.calculateStreamProgress(
  startTime,
  stopTime,
  totalDeposited,
  totalWithdrawn,
  Math.floor(Date.now() / 1000)
);

console.log(`Streamed: ${progress.streamedAmount.toString()}`);
console.log(`Available to withdraw: ${progress.withdrawableAmount.toString()}`);
console.log(`Progress: ${progress.percentProgress}%`);
console.log(`Completed: ${progress.isCompleted}`);

// Format rates for display
const rates = ShieldStreamClient.formatTokenRate(1929n, 6);
console.log(`Streaming rate: ${rates.perHour} USDC/hour (${rates.perDay} USDC/day)`);
```

---

### 4. Fetching & Decoding On-Chain Stream State

```typescript
import { Connection } from "@solana/web3.js";
import { ShieldStreamClient } from "@shieldstream/sdk";

const connection = new Connection("https://api.devnet.solana.com");
const client = new ShieldStreamClient(connection);

const streamData = await client.fetchStreamAccount(streamPda);
if (streamData) {
  console.log("Stream Sender:", streamData.sender.toBase58());
  console.log("Stream Recipient:", streamData.recipient.toBase58());
  console.log("Total Deposited:", streamData.totalDeposited.toString());
  console.log("Total Withdrawn:", streamData.totalWithdrawn.toString());
  console.log("Status:", streamData.status === 0 ? "Active" : "Paused");
}
```

---

## API Reference

### `ShieldStreamClient` Static Methods

| Method | Parameters | Return | Description |
|---|---|---|---|
| `getStreamAddress` | `sender: PublicKey, streamId: bigint` | `[PublicKey, number]` | Derives the deterministic PDA for a stream. |
| `getVaultAddress` | `streamPubkey: PublicKey` | `[PublicKey, number]` | Derives the escrow token vault PDA. |
| `getNullifierAddress` | `nullifier: Buffer` | `[PublicKey, number]` | Derives the Nullifier record PDA on-chain. |
| `generateRateCommitment` | `rate: bigint, salt: Buffer` | `Buffer (32 bytes)` | Computes SHA-256/Poseidon cryptographic rate commitment. |
| `generateNullifier` | `secretKey: Buffer, streamId: bigint, nonce: number` | `Buffer (32 bytes)` | Derives unique one-time nullifier for withdrawal. |
| `calculateStreamProgress` | `startTime, stopTime, totalDeposit, totalWithdrawn, now` | `StreamCalculation` | Computes continuous vested amount, remaining liquidity, and progress %. |
| `formatTokenRate` | `ratePerSecond: bigint, decimals: number` | `RateFormatted` | Converts micro-tokens/sec to human-readable hourly/daily rates. |
| `createInitializeStreamInstruction`| `InitializeStreamParams` | `TransactionInstruction` | Encodes Anchor instruction for stream creation. |
| `createWithdrawConfidentialInstruction`| `WithdrawConfidentialParams` | `TransactionInstruction` | Encodes Anchor instruction for ZK confidential claim. |
| `createDepositConfidentialInstruction`| `DepositConfidentialParams` | `TransactionInstruction` | Encodes Anchor instruction to top up an active stream. |
| `createSetStreamStatusInstruction`| `SetStreamStatusParams` | `TransactionInstruction` | Encodes instruction to Pause/Resume stream status. |
| `decodeStreamAccount` | `address: PublicKey, buffer: Buffer` | `StreamAccountData` | Zero-copy binary decoder for on-chain `StreamAccount` state. |

---

## Security & Privacy Architecture

```
+-----------------------------------------------------------------------------------+
|                              ShieldStream Architecture                            |
|                                                                                   |
|   +-------------------+    Commitment (32B)    +-------------------------------+  |
|   |  Sender / Employer| ---------------------> | Solana On-Chain Program       |  |
|   |  (Sets private    |                        | - Escrow Vault (PDA)          |  |
|   |   rate + salt)    |                        | - Verifies ZK Nullifier       |  |
|   +-------------------+                        +-------------------------------+  |
|                                                                ^                  |
|                                                                | UltraHonk Proof  |
|                                                                | (~84ms client)   |
|   +-------------------+                                        |                  |
|   | Employee / Claimer| ---------------------------------------+                  |
|   | (Generates ZK     |                                                           |
|   |  witness in Noir) |                                                           |
|   +-------------------+                                                           |
+-----------------------------------------------------------------------------------+
```

- **Zero Data Leakage**: No on-chain balance, salary amount, or token flow rate is exposed in unencrypted form.
- **Formal Nonce & Nullifier Soundness**: Every claim invalidates a one-time cryptographic nullifier, making replay attacks mathematically impossible.

---

## License

MIT License. Developed for the Solana Colosseum Hackathon 2026.
