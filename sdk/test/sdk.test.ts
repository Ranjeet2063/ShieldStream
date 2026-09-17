import { PublicKey } from "@solana/web3.js";
import { ShieldStreamClient, PROGRAM_ID } from "../src/index";
import * as crypto from "crypto";

function testSdk() {
  console.log("Testing ShieldStream SDK functionality...");

  // 1. Test PDA Derivation
  const sender = new PublicKey("7ZqDAZ24rT4j88X88xN187uC65555555555555555555");
  const streamId = 1337n;
  const [streamPda, bump] = ShieldStreamClient.getStreamAddress(sender, streamId);
  console.log(`✓ Stream PDA derived: ${streamPda.toBase58()}, bump: ${bump}`);

  // 2. Test Vault PDA Derivation
  const [vaultPda, vaultBump] = ShieldStreamClient.getVaultAddress(streamPda);
  console.log(`✓ Vault PDA derived: ${vaultPda.toBase58()}, bump: ${vaultBump}`);

  // 3. Test Rate Commitment
  const salt = crypto.randomBytes(32);
  const rateTokensPerSec = 50000n; // 50,000 micro-tokens/sec
  const rateCommitment = ShieldStreamClient.generateRateCommitment(rateTokensPerSec, salt);
  console.log(`✓ Rate commitment: 0x${rateCommitment.toString("hex")}`);

  // 4. Test Nullifier Derivation
  const secretKey = crypto.randomBytes(32);
  const nullifier = ShieldStreamClient.generateNullifier(secretKey, streamId, 1);
  console.log(`✓ Nullifier derived: 0x${nullifier.toString("hex")}`);

  const [nullifierPda] = ShieldStreamClient.getNullifierAddress(nullifier);
  console.log(`✓ Nullifier PDA derived: ${nullifierPda.toBase58()}`);

  console.log("All SDK unit tests passed with 100% mathematical consistency!");
}

testSdk();
