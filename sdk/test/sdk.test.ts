import { PublicKey } from "@solana/web3.js";
import {
  ShieldStreamClient,
  PROGRAM_ID,
  STREAM_STATUS,
  getAnchorInstructionDiscriminator,
} from "../src/index";
import * as crypto from "crypto";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testSdk() {
  console.log("=== ShieldStream SDK Comprehensive Verification Suite ===");

  // 1. Test PDA Derivations
  const sender = new PublicKey("7ZqDAZ24rT4j88X88xN187uC65555555555555555555");
  const recipient = new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
  const mint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC
  const senderTokenAccount = new PublicKey("4Nd1mBQtrMKBCr713QY4E2w1R6eS8jQ1111111111111");
  const recipientTokenAccount = new PublicKey("3Bd1mBQtrMKBCr713QY4E2w1R6eS8jQ2222222222222");
  const streamId = 1337n;

  const [streamPda, bump] = ShieldStreamClient.getStreamAddress(sender, streamId);
  console.log(`[PASS] Stream PDA derived: ${streamPda.toBase58()}, bump: ${bump}`);
  assert(bump >= 0 && bump <= 255, "Bump must be valid u8");

  const [vaultPda, vaultBump] = ShieldStreamClient.getVaultAddress(streamPda);
  console.log(`[PASS] Vault PDA derived: ${vaultPda.toBase58()}, bump: ${vaultBump}`);

  // 2. Test Cryptographic Commitments & Nullifiers
  const salt = crypto.randomBytes(32);
  const rateTokensPerSec = 50000n; // 50,000 micro-USDC/sec = 0.05 USDC/sec
  const rateCommitment = ShieldStreamClient.generateRateCommitment(rateTokensPerSec, salt);
  assert(rateCommitment.length === 32, "Rate commitment must be 32 bytes");
  console.log(`[PASS] Rate commitment: 0x${rateCommitment.toString("hex").substring(0, 16)}...`);

  const secretKey = crypto.randomBytes(32);
  const nullifier = ShieldStreamClient.generateNullifier(secretKey, streamId, 1);
  assert(nullifier.length === 32, "Nullifier must be 32 bytes");
  console.log(`[PASS] Nullifier derived: 0x${nullifier.toString("hex").substring(0, 16)}...`);

  const [nullifierPda] = ShieldStreamClient.getNullifierAddress(nullifier);
  console.log(`[PASS] Nullifier PDA derived: ${nullifierPda.toBase58()}`);

  // 3. Mathematical Real-Time Vesting Calculations
  const startTime = 1000;
  const stopTime = 2000;
  const totalDeposit = 1000000n; // 1,000,000 micro-tokens

  // Case A: Before stream start
  const resBefore = ShieldStreamClient.calculateStreamProgress(startTime, stopTime, totalDeposit, 0n, 500);
  assert(resBefore.streamedAmount === 0n, "Amount before start must be 0");
  assert(resBefore.withdrawableAmount === 0n, "Withdrawable before start must be 0");
  assert(!resBefore.isCompleted, "Stream should not be completed");

  // Case B: Exactly 50% through duration
  const resMid = ShieldStreamClient.calculateStreamProgress(startTime, stopTime, totalDeposit, 0n, 1500);
  assert(resMid.streamedAmount === 500000n, "Amount at 50% must be 500000");
  assert(resMid.withdrawableAmount === 500000n, "Withdrawable at 50% must be 500000");
  assert(resMid.percentProgress === 50, "Percent progress must be 50%");

  // Case C: After withdrawing 200,000 at 50%
  const resWithdrawn = ShieldStreamClient.calculateStreamProgress(startTime, stopTime, totalDeposit, 200000n, 1500);
  assert(resWithdrawn.withdrawableAmount === 300000n, "Remaining withdrawable must be 300000");

  // Case D: Past stop time (completed)
  const resCompleted = ShieldStreamClient.calculateStreamProgress(startTime, stopTime, totalDeposit, 0n, 2500);
  assert(resCompleted.streamedAmount === totalDeposit, "Amount past stop must be total deposit");
  assert(resCompleted.isCompleted, "Stream should be marked completed");
  console.log(`[PASS] Mathematical stream progression assertions passed`);

  // 4. Test Rate Formatter
  const formattedRates = ShieldStreamClient.formatTokenRate(50000n, 6);
  assert(formattedRates.perSecond === "0.050000", "Rate per sec match");
  assert(formattedRates.perHour === "180.0000", "Rate per hr match (0.05 * 3600 = 180)");
  console.log(`[PASS] Formatted rate: ${formattedRates.perHour} tokens/hour`);

  // 5. Test Instruction Builders
  const stateCommitment = crypto.randomBytes(32);
  const initIx = ShieldStreamClient.createInitializeStreamInstruction({
    sender,
    recipient,
    mint,
    senderTokenAccount,
    streamId,
    startTime,
    stopTime,
    initialDeposit: totalDeposit,
    rateCommitment,
    stateCommitment,
  });
  assert(initIx.programId.equals(PROGRAM_ID), "Program ID must match");
  assert(initIx.keys.length === 9, "InitializeStream instruction requires 9 accounts");
  assert(initIx.data.length === 104, "InitializeStream data length must be 104 bytes");
  console.log(`[PASS] InitializeStreamInstruction validated (data len: ${initIx.data.length})`);

  // Test WithdrawConfidential Instruction
  const mockProof = Buffer.alloc(128, 0xaa);
  const mockPublicInputs = [rateCommitment, nullifier, Buffer.alloc(32, 0x01)];
  const withdrawIx = ShieldStreamClient.createWithdrawConfidentialInstruction({
    streamPda,
    vaultPda,
    recipient,
    recipientTokenAccount,
    claimedAmount: 250000n,
    nullifier,
    zkProof: mockProof,
    publicInputs: mockPublicInputs,
  });
  assert(withdrawIx.keys.length === 7, "WithdrawConfidential instruction requires 7 accounts");
  console.log(`[PASS] WithdrawConfidentialInstruction validated (data len: ${withdrawIx.data.length})`);

  // Test DepositConfidential Instruction
  const depositIx = ShieldStreamClient.createDepositConfidentialInstruction({
    sender,
    streamPda,
    vaultPda,
    senderTokenAccount,
    amount: 500000n,
    newStateCommitment: crypto.randomBytes(32),
  });
  assert(depositIx.keys.length === 5, "DepositConfidential requires 5 accounts");
  console.log(`[PASS] DepositConfidentialInstruction validated`);

  // Test SetStreamStatus Instruction
  const statusIx = ShieldStreamClient.createSetStreamStatusInstruction({
    streamPda,
    authority: sender,
    newStatus: STREAM_STATUS.PAUSED,
  });
  assert(statusIx.keys.length === 2, "SetStreamStatus requires 2 accounts");
  console.log(`[PASS] SetStreamStatusInstruction validated`);

  // 6. Test StreamAccount Decoder
  const enc = Buffer.alloc(234);
  enc.fill(0x11, 0, 8); // Anchor discriminator
  sender.toBuffer().copy(enc, 8);
  recipient.toBuffer().copy(enc, 40);
  mint.toBuffer().copy(enc, 72);
  vaultPda.toBuffer().copy(enc, 104);
  enc.writeBigInt64LE(BigInt(startTime), 136);
  enc.writeBigInt64LE(BigInt(stopTime), 144);
  rateCommitment.copy(enc, 152);
  stateCommitment.copy(enc, 184);
  enc.writeBigUInt64LE(200000n, 216); // total_withdrawn
  enc.writeBigUInt64LE(1000000n, 224); // total_deposited
  enc.writeUInt8(STREAM_STATUS.ACTIVE, 232); // status
  enc.writeUInt8(254, 233); // bump

  const decoded = ShieldStreamClient.decodeStreamAccount(streamPda, enc);
  assert(decoded.address.equals(streamPda), "Address match");
  assert(decoded.sender.equals(sender), "Sender match");
  assert(decoded.recipient.equals(recipient), "Recipient match");
  assert(decoded.mint.equals(mint), "Mint match");
  assert(decoded.vault.equals(vaultPda), "Vault match");
  assert(decoded.startTime === BigInt(startTime), "Start time match");
  assert(decoded.stopTime === BigInt(stopTime), "Stop time match");
  assert(decoded.rateCommitment.equals(rateCommitment), "Rate commitment match");
  assert(decoded.currentCommitment.equals(stateCommitment), "State commitment match");
  assert(decoded.totalWithdrawn === 200000n, "Total withdrawn match");
  assert(decoded.totalDeposited === 1000000n, "Total deposited match");
  assert(decoded.status === STREAM_STATUS.ACTIVE, "Status match");
  assert(decoded.bump === 254, "Bump match");
  console.log(`[PASS] StreamAccount decoded & verified with 100% field integrity`);

  console.log("=== All ShieldStream SDK Unit & Integration Tests PASSED! ===");
}

testSdk();

