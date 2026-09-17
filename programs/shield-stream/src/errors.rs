use anchor_lang::prelude::*;

#[error_code]
pub enum ShieldStreamError {
    #[msg("Stream is already completed or inactive.")]
    StreamInactive,

    #[msg("Stream is paused by authorized operator.")]
    StreamPaused,

    #[msg("Unauthorized access or invalid authority.")]
    Unauthorized,

    #[msg("Invalid zero-knowledge proof verification failed.")]
    InvalidZkProof,

    #[msg("Withdrawal amount exceeds cryptographically proven unlocked balance.")]
    InsufficientUnlockedBalance,

    #[msg("Stream start time must be in the future or present.")]
    InvalidStartTime,

    #[msg("Stream end time must be strictly after start time.")]
    InvalidEndTime,

    #[msg("Arithmetic overflow in rate or balance calculations.")]
    MathOverflow,

    #[msg("Nullifier has already been spent in confidential withdrawal.")]
    NullifierAlreadySpent,

    #[msg("Commitment hash does not match recorded state.")]
    MismatchedCommitment,
}
