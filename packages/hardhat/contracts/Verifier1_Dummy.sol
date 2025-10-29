// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

/**
 * ⚠️ DUMMY VERIFIER FOR TESTING ONLY ⚠️
 * 
 * This contract ALWAYS returns true for any proof.
 * DO NOT USE IN PRODUCTION!
 * 
 * This is a testing version of Groth16Verifier that accepts any proof.
 * Original Verifier1.sol is kept unchanged for when you have real ZK proofs.
 */
contract Groth16Verifier_Dummy {
    
    /**
     * Dummy verification function - ALWAYS RETURNS TRUE
     * This allows you to test your contract logic without real ZK proofs
     * 
     * @return r Always returns true
     */
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[5] memory input
    ) public view returns (bool r) {
        // ⚠️ TESTING ONLY - ALWAYS RETURNS TRUE ⚠️
        // Replace with real Groth16Verifier when you have ZK circuits
        return true;
    }
}
