import { ethers } from "hardhat";
import * as fs from "fs";

/**
 * Helper script to submit a burner proof to the Burner_Verifier contract
 * 
 * Prerequisites:
 * 1. Generate your proof using snarkjs (see GENERATE_BURNER_PROOF.md)
 * 2. Place proof.json and public.json in the same directory as this script
 * 3. Make sure you have deployed contracts and the local network is running
 * 
 * Usage:
 *   npx hardhat run scripts/submitBurnerProof.ts --network localhost
 */

async function main() {
    console.log("🔥 Burner Proof Submission Script");
    console.log("=====================================\n");

    // Get the signer (your account)
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    console.log("📍 Using account:", signerAddress);

    // Get deployed contracts
    const mainContract = await ethers.getContract("Main_Contract", signer);
    const burnerVerifier = await ethers.getContract("Burner_Verifier", signer);

    console.log("📝 Main_Contract:", await mainContract.getAddress());
    console.log("📝 Burner_Verifier:", await burnerVerifier.getAddress());
    console.log();

    // Check current balance
    console.log("💰 Checking current balance...");
    const currentBalance = await mainContract.getbalance(signerAddress);
    console.log("   Public Balance:", currentBalance.pub_balance.toString());
    console.log("   Private Balance:", currentBalance.priv_balance.toString());
    console.log();

    // Load proof files (you need to generate these with snarkjs)
    // If you don't have these files yet, see GENERATE_BURNER_PROOF.md
    let proof: any;
    let publicSignals: string[];

    try {
        const proofFile = fs.readFileSync("proof.json", "utf8");
        const publicFile = fs.readFileSync("public.json", "utf8");
        
        proof = JSON.parse(proofFile);
        publicSignals = JSON.parse(publicFile);
        
        console.log("✅ Loaded proof and public signals");
    } catch (error) {
        console.error("❌ Error loading proof files!");
        console.error("   Make sure proof.json and public.json exist in this directory");
        console.error("   See GENERATE_BURNER_PROOF.md for instructions on generating proofs");
        console.error("\nFor testing, you can use dummy values (see below)");
        
        // Use dummy values for testing (ONLY FOR DEVELOPMENT)
        console.log("\n⚠️  Using DUMMY proof values for testing...");
        proof = {
            pi_a: ["0", "0", "1"],
            pi_b: [["0", "0"], ["0", "0"], ["1", "0"]],
            pi_c: ["0", "0", "1"],
        };
        publicSignals = [
            currentBalance.pub_balance.toString(),  // Current pub balance
            currentBalance.priv_balance.toString(), // Current priv balance
            (BigInt(currentBalance.priv_balance.toString()) + BigInt(100)).toString(), // New priv balance (+100)
            "123456789", // Dummy amount_r hash
            "987654321"  // Dummy nullifier
        ];
    }

    // Format proof for Solidity contract
    const proofForContract = {
        A: [proof.pi_a[0], proof.pi_a[1]],
        B: [
            [proof.pi_b[0][1], proof.pi_b[0][0]], // Reversed for Solidity
            [proof.pi_b[1][1], proof.pi_b[1][0]]  // Reversed for Solidity
        ],
        C: [proof.pi_c[0], proof.pi_c[1]],
        _publicSignals: publicSignals
    };

    console.log("\n📋 Proof Details:");
    console.log("   Public Signals:");
    console.log("     [0] Current Pub Balance:", publicSignals[0]);
    console.log("     [1] Current Priv Balance:", publicSignals[1]);
    console.log("     [2] New Priv Balance:", publicSignals[2]);
    console.log("     [3] Amount_r Hash:", publicSignals[3]);
    console.log("     [4] Nullifier:", publicSignals[4]);
    console.log();

    // Verify the public signals match current state
    if (publicSignals[0] !== currentBalance.pub_balance.toString()) {
        console.error("⚠️  WARNING: Public signal [0] doesn't match current public balance!");
        console.error("   Expected:", currentBalance.pub_balance.toString());
        console.error("   Got:", publicSignals[0]);
    }

    if (publicSignals[1] !== currentBalance.priv_balance.toString()) {
        console.error("⚠️  WARNING: Public signal [1] doesn't match current private balance!");
        console.error("   Expected:", currentBalance.priv_balance.toString());
        console.error("   Got:", publicSignals[1]);
    }

    // Calculate expected burn amount
    const burnAmount = BigInt(publicSignals[2]) - BigInt(publicSignals[1]);
    console.log("🔥 Burn Amount:", burnAmount.toString(), "tokens");
    console.log();

    // Submit the proof
    try {
        console.log("🚀 Submitting proof to Burner_Verifier...");
        const tx = await burnerVerifier.BurnerVerifier(proofForContract);
        console.log("⏳ Transaction sent:", tx.hash);
        console.log("   Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        console.log();

        // Check new balance
        console.log("💰 Checking new balance...");
        const newBalance = await mainContract.getbalance(signerAddress);
        console.log("   Public Balance:", newBalance.pub_balance.toString(), 
                    `(was ${currentBalance.pub_balance.toString()})`);
        console.log("   Private Balance:", newBalance.priv_balance.toString(), 
                    `(was ${currentBalance.priv_balance.toString()})`);
        console.log();

        // Verify changes
        const pubChange = BigInt(newBalance.pub_balance.toString()) - BigInt(currentBalance.pub_balance.toString());
        const privChange = BigInt(newBalance.priv_balance.toString()) - BigInt(currentBalance.priv_balance.toString());
        
        console.log("📊 Balance Changes:");
        console.log("   Public:", pubChange.toString(), "(should be 0 for burn)");
        console.log("   Private:", privChange.toString(), `(should be ${burnAmount.toString()})`);
        console.log();

        if (privChange === burnAmount) {
            console.log("🎉 Success! Burn operation completed correctly!");
        } else {
            console.log("⚠️  Warning: Balance changes don't match expected values");
        }

    } catch (error: any) {
        console.error("❌ Transaction failed!");
        console.error("\nError:", error.message);
        
        if (error.message.includes("Invalid proof")) {
            console.error("\n💡 Tips:");
            console.error("   - Make sure your proof was generated with the correct circuit");
            console.error("   - Verify the circuit matches the deployed Groth16Verifier");
            console.error("   - Check that public signals are in the correct order");
        } else if (error.message.includes("Invalid current public balance")) {
            console.error("\n💡 Tips:");
            console.error("   - Public signal [0] must match your current on-chain balance");
            console.error("   - Current balance:", currentBalance.pub_balance.toString());
        } else if (error.message.includes("Invalid current private balances")) {
            console.error("\n💡 Tips:");
            console.error("   - Public signal [1] must match your current on-chain private balance");
            console.error("   - Current balance:", currentBalance.priv_balance.toString());
        }
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
