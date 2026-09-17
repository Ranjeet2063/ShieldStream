use anchor_lang::prelude::*;

pub const STREAM_SEED: &[u8] = b"shield_stream";
pub const VAULT_SEED: &[u8] = b"stream_vault";
pub const NULLIFIER_SEED: &[u8] = b"nullifier";

#[account]
#[derive(Default)]
pub struct StreamAccount {
    /// Initializer / Employer authority
    pub sender: Pubkey,
    /// Beneficiary / Employee recipient
    pub recipient: Pubkey,
    /// Mint address of the SPL token being streamed
    pub mint: Pubkey,
    /// Escrow vault holding stream deposits
    pub vault: Pubkey,
    /// Unix timestamp when streaming vesting begins
    pub start_time: i64,
    /// Unix timestamp when streaming vesting concludes
    pub stop_time: i64,
    /// Encrypted/Committed stream parameters (Poseidon/Pedersen hash of rate & salt)
    pub rate_commitment: [u8; 32],
    /// Current cryptographic state commitment root
    pub current_commitment: [u8; 32],
    /// Total cumulative withdrawn amount by recipient
    pub total_withdrawn: u64,
    /// Total deposited tokens in vault
    pub total_deposited: u64,
    /// Stream operational status (0 = Active, 1 = Paused, 2 = Completed)
    pub status: u8,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl StreamAccount {
    pub const LEN: usize = 8 + // Anchor discriminator
        32 + // sender
        32 + // recipient
        32 + // mint
        32 + // vault
        8 +  // start_time
        8 +  // stop_time
        32 + // rate_commitment
        32 + // current_commitment
        8 +  // total_withdrawn
        8 +  // total_deposited
        1 +  // status
        1;   // bump
}

#[account]
#[derive(Default)]
pub struct NullifierRecord {
    /// Nullifier hash to prevent double-spending confidential claims
    pub nullifier: [u8; 32],
    /// Timestamp of consumption
    pub spent_at: i64,
}

impl NullifierRecord {
    pub const LEN: usize = 8 + 32 + 8;
}
