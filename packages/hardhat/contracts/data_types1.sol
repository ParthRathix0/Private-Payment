// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

struct balance_data {
    uint256 pub_balance;
    uint256 priv_balance;
}

struct proof_data_A {
    bool valid_rp;
    uint256 new_priv_balance;
    uint256 nullifier; //hash of pub,priv_balance(salt) + amt + r 
    uint256 amt_r_hash;
    uint256 curr_priv_balance;
    uint256 curr_pub_balance;
}

struct proof_data_B{
    uint256 old_pub_balance;
    uint256 old_priv_balance;
    uint256 updated_pub_balance;
}

struct Proof{
    uint256[2] A;
    uint256[2][2] B;
    uint256[2] C;
    uint256[] _publicSignals; // pub. bal, old commitment, new commitment, amt_r_hash, nullifier
}

struct ProofB{
    uint256[2] A;
    uint256[2][2] B;
    uint256[2] C;
    uint256[] _publicSignals; // old commitment, new commitment, amt_r_hash (3 signals for Circuit B)
}