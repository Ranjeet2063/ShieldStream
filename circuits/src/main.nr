// ShieldStream: Confidential Payroll & Vesting Proof Circuit (Noir / UltraHonk)
//
// Proves that a recipient is entitled to withdraw `claimed_amount` from a stream
// without revealing their underlying payment rate, total salary, or remaining balance.

use dep::std::hash::poseidon;

fn main(
    // Public Inputs (verified on-chain by Solana smart contract)
    pub rate_commitment: Field,
    pub nullifier: Field,
    pub claimed_amount: Field,
    pub current_timestamp: Field,
    pub start_timestamp: Field,
    pub stop_timestamp: Field,

    // Private Witnesses (known strictly to recipient / employer)
    private_rate: Field,
    salt: Field,
    secret_key: Field,
    total_previously_withdrawn: Field,
    nonce: Field
) {
    // 1. Verify that the private rate matches the public commitment:
    // rate_commitment = Poseidon(private_rate, salt)
    let computed_rate_commitment = poseidon::bn254::hash_2([private_rate, salt]);
    assert(computed_rate_commitment == rate_commitment);

    // 2. Bound time range:
    assert(current_timestamp >= start_timestamp);
    let effective_time = if current_timestamp > stop_timestamp {
        stop_timestamp
    } else {
        current_timestamp
    };
    let elapsed_seconds = effective_time - start_timestamp;

    // 3. Calculate max unlocked balance:
    // unlocked_balance = rate * elapsed_seconds
    let unlocked_balance = private_rate * elapsed_seconds;

    // 4. Solvency check: claimed_amount must not exceed available unlocked balance
    assert(unlocked_balance >= total_previously_withdrawn + claimed_amount);

    // 5. Derive public nullifier preventing double-spending:
    // nullifier = Poseidon(secret_key, nonce)
    let computed_nullifier = poseidon::bn254::hash_2([secret_key, nonce]);
    assert(computed_nullifier == nullifier);
}
