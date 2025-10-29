pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
// include "circomlib/circuits/comparators.circom";

template UpdateBalance() {
    // === Public inputs ===
    // signal input public_balance;
    signal input old_commitment;  // previous commitment hash
    signal input new_commitment;  // new commitment hash
    // signal input nullifier;       // nullifier hash (public to prevent reuse)

    // Private inputs (kept by Bob)
    signal input secret;  // user secret / private key
    signal input randomness; 
    signal input private_balance;
    signal input spend_amount;
    signal new_balance;

    // === Constraints ===
    // signal available_balance;
    // available_balance <== public_balance + private_balance;

    // enforce spend_amount < available_balance
    // component lt = LessThan(250);
    // lt.in[0] <== spend_amount;
    // lt.in[1] <== available_balance;
    // lt.out === 1;
    new_balance <== private_balance + spend_amount;

    // Poseidon hash for old commitment
    component hash_old = Poseidon(2);
    hash_old.inputs[0] <== secret;
    hash_old.inputs[1] <== private_balance;
    signal computed_old_commitment <== hash_old.out;

    // Poseidon hash for new commitment
    component hash_new = Poseidon(2);
    hash_new.inputs[0] <== secret;
    hash_new.inputs[1] <== new_balance;
    signal computed_new_commitment <== hash_new.out;

    // Poseidon hash for nullifier
    // component hash_nullifier = Poseidon(2);
    // hash_nullifier.inputs[0] <== secret;
    // hash_nullifier.inputs[1] <== old_commitment;
    // signal computed_nullifier <== hash_nullifier.out;

    // Enforce equality
    computed_old_commitment === old_commitment;
    computed_new_commitment === new_commitment;
    // computed_nullifier === nullifier;

    signal output amount_hash;
    component hash_amount = Poseidon(2);
    hash_amount.inputs[0] <== spend_amount;
    hash_amount.inputs[1] <== randomness;
    amount_hash <== hash_amount.out;
    
    // signal output nullifier;
    // component hash_nullifier = Poseidon(5);
    // hash_nullifier.inputs[0] <== public_balance;
    // hash_nullifier.inputs[1] <== private_balance;
    // hash_nullifier.inputs[2] <== spend_amount;
    // hash_nullifier.inputs[3] <== randomness;
    // hash_nullifier.inputs[4] <== secret;
    // nullifier <== hash_nullifier.out;
}

component main {public [old_commitment, new_commitment]} = UpdateBalance();

