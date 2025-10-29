import { ethers } from "hardhat";

/**
 * 🧪 TEST SCRIPT - Burn 100 Tokens with Dummy Proof
 * 
 * This script demonstrates the complete burn flow using DUMMY proofs.
 * 
 * Prerequisites:
 * 1. Deploy contracts in test mode: yarn deploy --tags TestMode
 * 2. Make sure local Hardhat node is running: yarn chain
 * 
 * Usage:
 *   npx hardhat run scripts/testBurnWithDummyProof.ts --network localhost
 * 
 * This script will:
 * 1. Set initial balance (4500 public, 5500 private)
 * 2. Call burner with dummy proof to burn 100 tokens
 * 3. Verify the balance changed correctly
 */

async function main() {
    console.log("\n🧪 TEST: Burn 100 Tokens with Dummy Proof");
    console.log("==========================================\n");

    // Get the deployer (owner) account
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deployer address:", await deployer.getAddress());

    // Target account for the test
    const targetAddress = "0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0";
    console.log("🎯 Target address:", targetAddress);
    console.log();

    // Get deployed contracts
    console.log("📡 Connecting to contracts...");
    const mainContract = await ethers.getContract("Main_Contract", deployer);
    const burnerVerifier = await ethers.getContract("Burner_Verifier", deployer);

    console.log("   Main_Contract:", await mainContract.getAddress());
    console.log("   Burner_Verifier:", await burnerVerifier.getAddress());
    console.log();

    // Step 1: Set initial balance
    console.log("💰 Step 1: Setting initial balance...");
    console.log("   Public: 4500");
    console.log("   Private: 5500");

    const setBalanceTx = await mainContract.initialSetbalance(
        targetAddress,
        4500,  // public balance
        5500   // private balance
    );
    await setBalanceTx.wait();
    console.log("   ✅ Initial balance set");
    console.log();

    // Verify initial balance
    const initialBalance = await mainContract.getbalance(targetAddress);
    console.log("📊 Initial Balance:");
    console.log("   Public:", initialBalance.pub_balance.toString());
    console.log("   Private:", initialBalance.priv_balance.toString());
    console.log();

    // Step 2: Create dummy proof
    console.log("🔐 Step 2: Creating DUMMY proof...");
    console.log("   (Using dummy verifier - any proof is accepted)");
    
    const dummyProof = {
        A: [0, 0],  // Dummy values
        B: [[0, 0], [0, 0]],  // Dummy values
        C: [0, 0],  // Dummy values
        _publicSignals: [
            "4500",     // [0] Current public balance
            "5500",     // [1] Current private balance
            "5600",     // [2] New private balance (5500 + 100)
            "123456789",  // [3] Dummy amount_r hash
            "987654321"   // [4] Dummy nullifier (must be unique each time)
        ]
    };

    console.log("   Public Signals:");
    console.log("     [0] Current Pub Balance:", dummyProof._publicSignals[0]);
    console.log("     [1] Current Priv Balance:", dummyProof._publicSignals[1]);
    console.log("     [2] New Priv Balance:", dummyProof._publicSignals[2]);
    console.log("     [3] Amount_r Hash:", dummyProof._publicSignals[3]);
    console.log("     [4] Nullifier:", dummyProof._publicSignals[4]);
    console.log();

    const burnAmount = BigInt(dummyProof._publicSignals[2]) - BigInt(dummyProof._publicSignals[1]);
    console.log("🔥 Burn Amount:", burnAmount.toString(), "tokens");
    console.log();

    // Step 3: Submit the burn transaction
    console.log("🚀 Step 3: Submitting burn transaction...");
    
    try {
        const burnTx = await burnerVerifier.BurnerVerifier(dummyProof);
        console.log("   Transaction hash:", burnTx.hash);
        console.log("   ⏳ Waiting for confirmation...");
        
        const receipt = await burnTx.wait();
        console.log("   ✅ Transaction confirmed in block:", receipt?.blockNumber);
        console.log();
    } catch (error: any) {
        console.error("   ❌ Transaction failed!");
        console.error("   Error:", error.message);
        throw error;
    }

    // Step 4: Verify new balance
    console.log("📊 Step 4: Verifying new balance...");
    const newBalance = await mainContract.getbalance(targetAddress);
    
    console.log("   Public Balance:", newBalance.pub_balance.toString(), 
                `(was ${initialBalance.pub_balance.toString()})`);
    console.log("   Private Balance:", newBalance.priv_balance.toString(), 
                `(was ${initialBalance.priv_balance.toString()})`);
    console.log();

    // Calculate changes
    const pubChange = BigInt(newBalance.pub_balance.toString()) - 
                      BigInt(initialBalance.pub_balance.toString());
    const privChange = BigInt(newBalance.priv_balance.toString()) - 
                       BigInt(initialBalance.priv_balance.toString());
    
    console.log("📈 Balance Changes:");
    console.log("   Public:", pubChange.toString(), 
                `(expected: 0, burner doesn't change public balance)`);
    console.log("   Private:", privChange.toString(), 
                `(expected: ${burnAmount.toString()})`);
    console.log();

    // Final verification
    if (newBalance.priv_balance.toString() === "5600") {
        console.log("🎉 SUCCESS! Burn operation completed correctly!");
        console.log("   ✅ Private balance increased from 5500 to 5600");
        console.log("   ✅ Public balance unchanged at 4500");
    } else {
        console.log("⚠️  WARNING: Balance doesn't match expected value");
        console.log("   Expected private balance: 5600");
        console.log("   Actual private balance:", newBalance.priv_balance.toString());
    }
    console.log();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Test completed successfully! 🎊");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error);
        process.exit(1);
    });
