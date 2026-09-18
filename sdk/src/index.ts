import {
  PublicKey,
  TransactionInstruction,
  Connection,
  AccountMeta,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as crypto from "crypto";

export const PROGRAM_ID = new PublicKey("xNXe3EYiaMguoxK8X5XR9dftp6vjSPp18yo3PoPR9NY");

export const STREAM_SEED = Buffer.from("shield_stream");
export const VAULT_SEED = Buffer.from("stream_vault");
export const NULLIFIER_SEED = Buffer.from("nullifier");

export const STREAM_STATUS = {
  ACTIVE: 0,
  PAUSED: 1,
  COMPLETED: 2,
} as const;

export type StreamStatusType = typeof STREAM_STATUS[keyof typeof STREAM_STATUS];

export interface StreamAccountData {
  address: PublicKey;
  sender: PublicKey;
  recipient: PublicKey;
  mint: PublicKey;
  vault: PublicKey;
  startTime: bigint;
  stopTime: bigint;
  rateCommitment: Buffer;
  currentCommitment: Buffer;
  totalWithdrawn: bigint;
  totalDeposited: bigint;
  status: number;
  bump: number;
}

export interface StreamCalculation {
  streamedAmount: bigint;
  withdrawableAmount: bigint;
  remainingDeposit: bigint;
  percentProgress: number;
  isCompleted: boolean;
}

export interface InitializeStreamParams {
  sender: PublicKey;
  recipient: PublicKey;
  mint: PublicKey;
  senderTokenAccount: PublicKey;
  streamId: bigint;
  startTime: bigint | number;
  stopTime: bigint | number;
  initialDeposit: bigint;
  rateCommitment: Buffer | Uint8Array;
  stateCommitment: Buffer | Uint8Array;
}

export interface WithdrawConfidentialParams {
  streamPda: PublicKey;
  vaultPda: PublicKey;
  recipient: PublicKey;
  recipientTokenAccount: PublicKey;
  claimedAmount: bigint;
  nullifier: Buffer | Uint8Array;
  zkProof: Buffer | Uint8Array;
  publicInputs: (Buffer | Uint8Array)[];
}

export interface DepositConfidentialParams {
  sender: PublicKey;
  streamPda: PublicKey;
  vaultPda: PublicKey;
  senderTokenAccount: PublicKey;
  amount: bigint;
  newStateCommitment: Buffer | Uint8Array;
}

export interface SetStreamStatusParams {
  streamPda: PublicKey;
  authority: PublicKey;
  newStatus: number;
}

/**
 * Compute the 8-byte Anchor instruction discriminator: sha256("global:<name>")[0..8]
 */
export function getAnchorInstructionDiscriminator(name: string): Buffer {
  return crypto
    .createHash("sha256")
    .update(`global:${name}`)
    .digest()
    .subarray(0, 8);
}

export class ShieldStreamClient {
  public connection?: Connection;
  public programId: PublicKey;

  constructor(connection?: Connection, programId: PublicKey = PROGRAM_ID) {
    this.connection = connection;
    this.programId = programId;
  }

  /**
   * Derive the deterministic PDA address for a stream
   */
  public static getStreamAddress(
    sender: PublicKey,
    streamId: bigint,
    programId: PublicKey = PROGRAM_ID
  ): [PublicKey, number] {
    const idBuffer = Buffer.alloc(8);
    idBuffer.writeBigUInt64LE(streamId);
    return PublicKey.findProgramAddressSync(
      [STREAM_SEED, sender.toBuffer(), idBuffer],
      programId
    );
  }

  /**
   * Derive escrow token vault address
   */
  public static getVaultAddress(
    streamPubkey: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [VAULT_SEED, streamPubkey.toBuffer()],
      programId
    );
  }

  /**
   * Derive Nullifier record PDA to ensure zero double-spend
   */
  public static getNullifierAddress(
    nullifier: Buffer | Uint8Array,
    programId: PublicKey = PROGRAM_ID
  ): [PublicKey, number] {
    const nullifierBuf = Buffer.isBuffer(nullifier) ? nullifier : Buffer.from(nullifier);
    return PublicKey.findProgramAddressSync(
      [NULLIFIER_SEED, nullifierBuf],
      programId
    );
  }

  /**
   * Generate cryptographic Poseidon/SHA commitment of private stream rate
   */
  public static generateRateCommitment(rate: bigint, salt: Buffer | Uint8Array): Buffer {
    const hash = crypto.createHash("sha256");
    const rateBuf = Buffer.alloc(8);
    rateBuf.writeBigUInt64BE(rate);
    hash.update(rateBuf);
    hash.update(Buffer.isBuffer(salt) ? salt : Buffer.from(salt));
    return hash.digest();
  }

  /**
   * Generate a unique one-time nullifier for withdrawal
   */
  public static generateNullifier(
    secretKey: Buffer | Uint8Array,
    streamId: bigint,
    nonce: number
  ): Buffer {
    const hash = crypto.createHash("sha256");
    hash.update(Buffer.isBuffer(secretKey) ? secretKey : Buffer.from(secretKey));
    const idBuf = Buffer.alloc(8);
    idBuf.writeBigUInt64BE(streamId);
    hash.update(idBuf);
    const nonceBuf = Buffer.alloc(4);
    nonceBuf.writeUInt32BE(nonce);
    hash.update(nonceBuf);
    return hash.digest();
  }

  /**
   * Mathematical real-time stream progression & vested amount calculator
   */
  public static calculateStreamProgress(
    startTime: bigint | number,
    stopTime: bigint | number,
    totalDeposited: bigint,
    totalWithdrawn: bigint,
    currentTime: number = Math.floor(Date.now() / 1000)
  ): StreamCalculation {
    const start = BigInt(startTime);
    const stop = BigInt(stopTime);
    const now = BigInt(currentTime);

    if (stop <= start) {
      throw new Error("Invalid stream duration: stopTime must be strictly greater than startTime");
    }

    const duration = stop - start;

    let streamedAmount: bigint;
    let isCompleted = false;

    if (now <= start) {
      streamedAmount = 0n;
    } else if (now >= stop) {
      streamedAmount = totalDeposited;
      isCompleted = true;
    } else {
      const elapsed = now - start;
      // Precision math without float truncation
      streamedAmount = (totalDeposited * elapsed) / duration;
    }

    let withdrawableAmount = streamedAmount > totalWithdrawn ? streamedAmount - totalWithdrawn : 0n;
    if (withdrawableAmount + totalWithdrawn > totalDeposited) {
      withdrawableAmount = totalDeposited - totalWithdrawn;
    }

    const remainingDeposit = totalDeposited > totalWithdrawn ? totalDeposited - totalWithdrawn : 0n;
    const percentProgress = totalDeposited > 0n
      ? Number((streamedAmount * 10000n) / totalDeposited) / 100
      : 0;

    return {
      streamedAmount,
      withdrawableAmount,
      remainingDeposit,
      percentProgress,
      isCompleted,
    };
  }

  /**
   * Format token rates for human readability
   */
  public static formatTokenRate(
    ratePerSecond: bigint,
    decimals: number = 6
  ): { perSecond: string; perHour: string; perDay: string; perMonth: string } {
    const unit = 10 ** decimals;
    const numPerSec = Number(ratePerSecond) / unit;
    const numPerHour = numPerSec * 3600;
    const numPerDay = numPerHour * 24;
    const numPerMonth = numPerDay * 30;

    return {
      perSecond: numPerSec.toFixed(6),
      perHour: numPerHour.toFixed(4),
      perDay: numPerDay.toFixed(2),
      perMonth: numPerMonth.toFixed(2),
    };
  }

  /**
   * Instruction Builder: Initialize a confidential payment stream
   */
  public static createInitializeStreamInstruction(
    params: InitializeStreamParams,
    programId: PublicKey = PROGRAM_ID
  ): TransactionInstruction {
    const [streamPda] = ShieldStreamClient.getStreamAddress(params.sender, params.streamId, programId);
    const [vaultPda] = ShieldStreamClient.getVaultAddress(streamPda, programId);

    const discriminator = getAnchorInstructionDiscriminator("initialize_stream");

    const data = Buffer.alloc(8 + 8 + 8 + 8 + 8 + 32 + 32);
    let offset = 0;

    discriminator.copy(data, offset);
    offset += 8;

    data.writeBigUInt64LE(params.streamId, offset);
    offset += 8;

    data.writeBigInt64LE(BigInt(params.startTime), offset);
    offset += 8;

    data.writeBigInt64LE(BigInt(params.stopTime), offset);
    offset += 8;

    data.writeBigUInt64LE(params.initialDeposit, offset);
    offset += 8;

    const rateCommitmentBuf = Buffer.isBuffer(params.rateCommitment)
      ? params.rateCommitment
      : Buffer.from(params.rateCommitment);
    rateCommitmentBuf.copy(data, offset);
    offset += 32;

    const stateCommitmentBuf = Buffer.isBuffer(params.stateCommitment)
      ? params.stateCommitment
      : Buffer.from(params.stateCommitment);
    stateCommitmentBuf.copy(data, offset);

    const keys: AccountMeta[] = [
      { pubkey: streamPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: params.mint, isSigner: false, isWritable: false },
      { pubkey: params.sender, isSigner: true, isWritable: true },
      { pubkey: params.recipient, isSigner: false, isWritable: false },
      { pubkey: params.senderTokenAccount, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({ keys, programId, data });
  }

  /**
   * Instruction Builder: Withdraw confidential vested funds via ZK Proof
   */
  public static createWithdrawConfidentialInstruction(
    params: WithdrawConfidentialParams,
    programId: PublicKey = PROGRAM_ID
  ): TransactionInstruction {
    const [nullifierPda] = ShieldStreamClient.getNullifierAddress(params.nullifier, programId);
    const discriminator = getAnchorInstructionDiscriminator("withdraw_confidential");

    const proofBuf = Buffer.isBuffer(params.zkProof) ? params.zkProof : Buffer.from(params.zkProof);
    const nullifierBuf = Buffer.isBuffer(params.nullifier)
      ? params.nullifier
      : Buffer.from(params.nullifier);

    // Buffer layout: discriminator (8) + claimed_amount (8) + nullifier (32) + vec proof (4 + len) + vec public inputs (4 + count*32)
    const proofLen = proofBuf.length;
    const piLen = params.publicInputs.length;
    const totalSize = 8 + 8 + 32 + 4 + proofLen + 4 + piLen * 32;

    const data = Buffer.alloc(totalSize);
    let offset = 0;

    discriminator.copy(data, offset);
    offset += 8;

    data.writeBigUInt64LE(params.claimedAmount, offset);
    offset += 8;

    nullifierBuf.copy(data, offset);
    offset += 32;

    // Borsh Vec<u8> proof
    data.writeUInt32LE(proofLen, offset);
    offset += 4;
    proofBuf.copy(data, offset);
    offset += proofLen;

    // Borsh Vec<[u8; 32]> public inputs
    data.writeUInt32LE(piLen, offset);
    offset += 4;
    for (const pi of params.publicInputs) {
      const piBuf = Buffer.isBuffer(pi) ? pi : Buffer.from(pi);
      piBuf.copy(data, offset);
      offset += 32;
    }

    const keys: AccountMeta[] = [
      { pubkey: params.streamPda, isSigner: false, isWritable: true },
      { pubkey: params.vaultPda, isSigner: false, isWritable: true },
      { pubkey: params.recipient, isSigner: true, isWritable: true },
      { pubkey: params.recipientTokenAccount, isSigner: false, isWritable: true },
      { pubkey: nullifierPda, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({ keys, programId, data });
  }

  /**
   * Instruction Builder: Deposit additional confidential liquidity
   */
  public static createDepositConfidentialInstruction(
    params: DepositConfidentialParams,
    programId: PublicKey = PROGRAM_ID
  ): TransactionInstruction {
    const discriminator = getAnchorInstructionDiscriminator("deposit_confidential");
    const data = Buffer.alloc(8 + 8 + 32);
    let offset = 0;

    discriminator.copy(data, offset);
    offset += 8;

    data.writeBigUInt64LE(params.amount, offset);
    offset += 8;

    const stateBuf = Buffer.isBuffer(params.newStateCommitment)
      ? params.newStateCommitment
      : Buffer.from(params.newStateCommitment);
    stateBuf.copy(data, offset);

    const keys: AccountMeta[] = [
      { pubkey: params.streamPda, isSigner: false, isWritable: true },
      { pubkey: params.vaultPda, isSigner: false, isWritable: true },
      { pubkey: params.sender, isSigner: true, isWritable: true },
      { pubkey: params.senderTokenAccount, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({ keys, programId, data });
  }

  /**
   * Instruction Builder: Set stream operational status (Pause/Resume/Cancel)
   */
  public static createSetStreamStatusInstruction(
    params: SetStreamStatusParams,
    programId: PublicKey = PROGRAM_ID
  ): TransactionInstruction {
    const discriminator = getAnchorInstructionDiscriminator("set_stream_status");
    const data = Buffer.alloc(8 + 1);
    discriminator.copy(data, 0);
    data.writeUInt8(params.newStatus, 8);

    const keys: AccountMeta[] = [
      { pubkey: params.streamPda, isSigner: false, isWritable: true },
      { pubkey: params.authority, isSigner: true, isWritable: false },
    ];

    return new TransactionInstruction({ keys, programId, data });
  }

  /**
   * On-chain account decoder for StreamAccount
   */
  public static decodeStreamAccount(address: PublicKey, buffer: Buffer): StreamAccountData {
    if (buffer.length < 234) {
      throw new Error(`Buffer size ${buffer.length} insufficient for StreamAccount (minimum 234 bytes)`);
    }

    let offset = 8; // skip 8-byte Anchor discriminator

    const sender = new PublicKey(buffer.subarray(offset, offset + 32));
    offset += 32;

    const recipient = new PublicKey(buffer.subarray(offset, offset + 32));
    offset += 32;

    const mint = new PublicKey(buffer.subarray(offset, offset + 32));
    offset += 32;

    const vault = new PublicKey(buffer.subarray(offset, offset + 32));
    offset += 32;

    const startTime = buffer.readBigInt64LE(offset);
    offset += 8;

    const stopTime = buffer.readBigInt64LE(offset);
    offset += 8;

    const rateCommitment = Buffer.from(buffer.subarray(offset, offset + 32));
    offset += 32;

    const currentCommitment = Buffer.from(buffer.subarray(offset, offset + 32));
    offset += 32;

    const totalWithdrawn = buffer.readBigUInt64LE(offset);
    offset += 8;

    const totalDeposited = buffer.readBigUInt64LE(offset);
    offset += 8;

    const status = buffer.readUInt8(offset);
    offset += 1;

    const bump = buffer.readUInt8(offset);

    return {
      address,
      sender,
      recipient,
      mint,
      vault,
      startTime,
      stopTime,
      rateCommitment,
      currentCommitment,
      totalWithdrawn,
      totalDeposited,
      status,
      bump,
    };
  }

  /**
   * Fetch stream account data from Solana RPC
   */
  public async fetchStreamAccount(streamPda: PublicKey): Promise<StreamAccountData | null> {
    if (!this.connection) {
      throw new Error("Solana Connection is required to fetch accounts");
    }
    const info = await this.connection.getAccountInfo(streamPda);
    if (!info || !info.data) return null;
    return ShieldStreamClient.decodeStreamAccount(streamPda, info.data);
  }

  /**
   * Check if a nullifier has already been consumed on-chain
   */
  public async checkNullifierSpent(nullifier: Buffer | Uint8Array): Promise<boolean> {
    if (!this.connection) {
      throw new Error("Solana Connection is required to check nullifier status");
    }
    const [nullifierPda] = ShieldStreamClient.getNullifierAddress(nullifier, this.programId);
    const info = await this.connection.getAccountInfo(nullifierPda);
    return info !== null && info.data.length > 0;
  }
}
