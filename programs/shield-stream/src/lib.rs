use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

pub mod errors;
pub mod state;
pub mod verifier;

use errors::ShieldStreamError;
use state::*;
use verifier::ZkProofVerifier;

declare_id!("Shield1111111111111111111111111111111111111");

#[program]
pub mod shield_stream {
    use super::*;

    /// Initialize a new confidential payment stream with cryptographic rate commitment
    pub fn initialize_stream(
        ctx: Context<InitializeStream>,
        stream_id: u64,
        start_time: i64,
        stop_time: i64,
        initial_deposit: u64,
        rate_commitment: [u8; 32],
        state_commitment: [u8; 32],
    ) -> Result<()> {
        let clock = Clock::get()?;
        require!(start_time >= clock.unix_timestamp - 300, ShieldStreamError::InvalidStartTime);
        require!(stop_time > start_time, ShieldStreamError::InvalidEndTime);
        require!(initial_deposit > 0, ShieldStreamError::MathOverflow);

        let stream = &mut ctx.accounts.stream;
        stream.sender = ctx.accounts.sender.key();
        stream.recipient = ctx.accounts.recipient.key();
        stream.mint = ctx.accounts.mint.key();
        stream.vault = ctx.accounts.vault.key();
        stream.start_time = start_time;
        stream.stop_time = stop_time;
        stream.rate_commitment = rate_commitment;
        stream.current_commitment = state_commitment;
        stream.total_withdrawn = 0;
        stream.total_deposited = initial_deposit;
        stream.status = 0; // Active
        stream.bump = ctx.bumps.stream;

        // Transfer initial funding tokens into escrow vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), initial_deposit)?;

        msg!("ShieldStream initialized: Stream {} between {} and {}", stream_id, stream.sender, stream.recipient);
        Ok(())
    }

    /// Deposit additional liquidity into an active confidential stream
    pub fn deposit_confidential(
        ctx: Context<DepositConfidential>,
        amount: u64,
        new_state_commitment: [u8; 32],
    ) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        require!(stream.status == 0, ShieldStreamError::StreamInactive);
        require!(amount > 0, ShieldStreamError::MathOverflow);

        stream.total_deposited = stream.total_deposited.checked_add(amount).ok_or(ShieldStreamError::MathOverflow)?;
        stream.current_commitment = new_state_commitment;

        let cpi_accounts = Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        msg!("ShieldStream deposit: Added {} tokens to stream", amount);
        Ok(())
    }

    /// Claim unlocked funds via Zero-Knowledge proof without revealing stream rate or balances
    pub fn withdraw_confidential(
        ctx: Context<WithdrawConfidential>,
        claimed_amount: u64,
        nullifier: [u8; 32],
        zk_proof: Vec<u8>,
        public_inputs: Vec<[u8; 32]>,
    ) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        let clock = Clock::get()?;

        require!(stream.status == 0, ShieldStreamError::StreamInactive);
        require!(claimed_amount > 0, ShieldStreamError::MathOverflow);
        require!(ctx.accounts.recipient.key() == stream.recipient, ShieldStreamError::Unauthorized);

        // Verify ZK Proof
        let is_valid = ZkProofVerifier::verify_withdrawal_proof(
            &zk_proof,
            &public_inputs,
            &stream.rate_commitment,
            &nullifier,
            claimed_amount,
            clock.unix_timestamp,
        )?;
        require!(is_valid, ShieldStreamError::InvalidZkProof);

        // Mark nullifier spent
        let nullifier_record = &mut ctx.accounts.nullifier_record;
        nullifier_record.nullifier = nullifier;
        nullifier_record.spent_at = clock.unix_timestamp;

        // Update state
        stream.total_withdrawn = stream.total_withdrawn.checked_add(claimed_amount).ok_or(ShieldStreamError::MathOverflow)?;

        // Transfer funds from PDA vault to recipient
        let stream_key = stream.key();
        let seeds = &[
            VAULT_SEED,
            stream_key.as_ref(),
            &[ctx.bumps.vault],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new_with_signer(cpi_program, cpi_accounts, signer), claimed_amount)?;

        msg!("ShieldStream withdrawal: Confidential claim of {} tokens verified", claimed_amount);
        Ok(())
    }

    /// Pause or resume stream execution by mutual/emergency consent
    pub fn set_stream_status(ctx: Context<SetStreamStatus>, new_status: u8) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        require!(
            ctx.accounts.authority.key() == stream.sender || ctx.accounts.authority.key() == stream.recipient,
            ShieldStreamError::Unauthorized
        );
        stream.status = new_status;
        msg!("ShieldStream status changed to {}", new_status);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(stream_id: u64)]
pub struct InitializeStream<'info> {
    #[account(
        init,
        payer = sender,
        space = StreamAccount::LEN,
        seeds = [STREAM_SEED, sender.key().as_ref(), &stream_id.to_le_bytes()],
        bump
    )]
    pub stream: Account<'info, StreamAccount>,

    #[account(
        init,
        payer = sender,
        seeds = [VAULT_SEED, stream.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = vault,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub sender: Signer<'info>,

    /// CHECK: Recipient identity verified by client
    pub recipient: AccountInfo<'info>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = sender
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositConfidential<'info> {
    #[account(
        mut,
        seeds = [STREAM_SEED, stream.sender.as_ref(), &stream.start_time.to_le_bytes()],
        bump = stream.bump,
        has_one = sender,
        has_one = vault
    )]
    pub stream: Account<'info, StreamAccount>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(
        mut,
        token::mint = stream.mint,
        token::authority = sender
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(claimed_amount: u64, nullifier: [u8; 32])]
pub struct WithdrawConfidential<'info> {
    #[account(
        mut,
        has_one = recipient,
        has_one = vault
    )]
    pub stream: Account<'info, StreamAccount>,

    #[account(
        mut,
        seeds = [VAULT_SEED, stream.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        mut,
        token::mint = stream.mint,
        token::authority = recipient
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = recipient,
        space = NullifierRecord::LEN,
        seeds = [NULLIFIER_SEED, nullifier.as_ref()],
        bump
    )]
    pub nullifier_record: Account<'info, NullifierRecord>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetStreamStatus<'info> {
    #[account(mut)]
    pub stream: Account<'info, StreamAccount>,
    pub authority: Signer<'info>,
}
