// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

// import "./Verifier1.sol";
import "./Verifier1_Dummy.sol"; // Dummy verifier for testing
// import "./verifier_B1_Dummy.sol"; // Dummy verifier for testing
import "./main1.sol";
import "./data_types1.sol";

contract Burner_Verifier {
    Main_Contract public real_contract;
    Groth16Verifier_Dummy public verifier;

    constructor(address _contract, address _verifier) {
        real_contract = Main_Contract(_contract);
        verifier = Groth16Verifier_Dummy(_verifier);
    }

    function BurnerVerifier(Proof calldata proof) external payable {
        // Step 1: verify proof
        // Verifier expects: uint[2] _pA, uint[2][2] _pB, uint[2] _pC, uint[5] _pubSignals
        bool verified = verifier.verifyProof(
            proof.A,
            proof.B,
            proof.C,
            [proof._publicSignals[0], proof._publicSignals[1], proof._publicSignals[2], 
             proof._publicSignals[3], proof._publicSignals[4]]
        );
        require(verified, "Invalid proof");
        // require(info.valid_rp, "Invalid range proof");
        
        balance_data memory balances = real_contract.getbalance(msg.sender);
        require(proof._publicSignals[0] == balances.pub_balance, "Invalid current public balance");
        require(proof._publicSignals[1] == balances.priv_balance, "Invalid current private balances");

        // Step 2: update balance in Main_Contract
        real_contract.burner(msg.sender, proof._publicSignals[0], proof._publicSignals[2], proof._publicSignals[4]);
    }
}