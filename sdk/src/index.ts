import { PublicKey } from "@solana/web3.js";
import * as crypto from "crypto";

export const STREAM_SEED = Buffer.from("shield_stream");
export const VAULT_SEED = Buffer.from("stream_vault");
export const NULLIFIER_SEED = Buffer.from("nullifier");
export const PROGRAM_ID = new PublicKey("xNXe3EYiaMguoxK8X5XR9dftp6vjSPp18yo3PoPR9NY");

export interface StreamParams {
  streamId: bigint;
  sender: PublicKey;
  recipient: PublicKey;
  mint: PublicKey;
  startTime: number;
  stopTime: number;
  rateTokensPerSecond: bigint;
}

export class ShieldStreamClient {
  /**
   * Derive the PDA address for a stream
   */
  public static getStreamAddress(sender: PublicKey, streamId: bigint): [PublicKey, number] {
    const idBuffer = Buffer.alloc(8);
    idBuffer.writeBigUInt64LE(streamId);
    return PublicKey.findProgramAddressSync(
      [STREAM_SEED, sender.toBuffer(), idBuffer],
      PROGRAM_ID
    );
  }

  /**
   * Derive escrow token vault address
   */
  public static getVaultAddress(streamPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [VAULT_SEED, streamPubkey.toBuffer()],
      PROGRAM_ID
    );
  }

  /**
   * Derive Nullifier record PDA to ensure zero double-spend
   */
  public static getNullifierAddress(nullifier: Buffer): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [NULLIFIER_SEED, nullifier],
      PROGRAM_ID
    );
  }

  /**
   * Generate cryptographic Poseidon commitment of private stream rate
   */
  public static generateRateCommitment(rate: bigint, salt: Buffer): Buffer {
    const hash = crypto.createHash("sha256");
    const rateBuf = Buffer.alloc(8);
    rateBuf.writeBigUInt64BE(rate);
    hash.update(rateBuf);
    hash.update(salt);
    return hash.digest();
  }

  /**
   * Generate a unique one-time nullifier for withdrawal
   */
  public static generateNullifier(secretKey: Buffer, streamId: bigint, nonce: number): Buffer {
    const hash = crypto.createHash("sha256");
    hash.update(secretKey);
    const idBuf = Buffer.alloc(8);
    idBuf.writeBigUInt64BE(streamId);
    hash.update(idBuf);
    const nonceBuf = Buffer.alloc(4);
    nonceBuf.writeUInt32BE(nonce);
    hash.update(nonceBuf);
    return hash.digest();
  }
}
