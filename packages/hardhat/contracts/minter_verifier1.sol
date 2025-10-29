// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./Verifier1_Dummy.sol"; //to be changed to minter verifier
import "./verifier_B1_Dummy.sol";
import "./main1.sol";
import "./data_types1.sol";

contract Minter_Verifier {
    Main_Contract public real_contract;
    Groth16Verifier_Dummy public A_verifier;
    Groth16VerifierB_Dummy public B_verifier;


    constructor(address _contract, address _verifier, address _verifierB) {
        real_contract = Main_Contract(_contract);
        A_verifier = Groth16Verifier_Dummy(_verifier);
        B_verifier = Groth16VerifierB_Dummy(_verifierB);
    }

    function Minter_VerifierVerifier(Proof calldata proof_A, ProofB calldata proof_B) external payable {
        // Step 1: verify proof A (from burner chain)
        bool verified_A = A_verifier.verifyProof(
            proof_A.A,
            proof_A.B,
            proof_A.C,
            [proof_A._publicSignals[0], proof_A._publicSignals[1], proof_A._publicSignals[2], 
             proof_A._publicSignals[3], proof_A._publicSignals[4]]
        );
        require(verified_A, "Invalid proof A");

        // Step 2: verify proof B (from minter chain)
        bool verified_B = B_verifier.verifyProof(
            proof_B.A,
            proof_B.B,
            proof_B.C,
            [proof_B._publicSignals[0], proof_B._publicSignals[1], proof_B._publicSignals[2]]
        );
        require(verified_B, "Invalid proof B");

        // Step 3: Check that both proofs have the same amount_r hash
        // require(proof_A._publicSignals[3] == proof_B._publicSignals[2], "Amount_r hashes must match");

        balance_data memory balances = real_contract.getbalance(msg.sender);

        // Step 4: mint in Main_Contract
        real_contract.minter(msg.sender, balances.pub_balance, proof_B._publicSignals[1], proof_A._publicSignals[4]);//
    }
}