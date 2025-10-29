import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * ⚠️ TESTING DEPLOYMENT WITH DUMMY VERIFIERS ⚠️
 * 
 * This deployment script uses DUMMY verifiers that accept ANY proof.
 * USE ONLY FOR LOCAL TESTING - NEVER ON PRODUCTION!
 * 
 * Deploys:
 * 1. Groth16Verifier_Dummy (accepts any proof for Circuit A)
 * 2. Groth16VerifierB_Dummy (accepts any proof for Circuit B)
 * 3. Main_Contract (real contract)
 * 4. Burner_Verifier (real contract, using dummy verifier)
 * 5. Minter_Verifier (real contract, using dummy verifiers)
 * 
 * To use this instead of the production deployment:
 *   yarn deploy --tags TestMode
 * 
 * To switch back to production verifiers later, use:
 *   yarn deploy --tags ZKPrivacy
 */
const deployTestContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n⚠️  ================================ ⚠️");
  console.log("⚠️  TESTING MODE - DUMMY VERIFIERS  ⚠️");
  console.log("⚠️  ================================ ⚠️\n");
  console.log("🚀 Deploying ZK privacy contracts with DUMMY verifiers...");
  console.log("   (All proofs will be accepted - FOR TESTING ONLY!)\n");

  // Step 1: Deploy Groth16Verifier_Dummy (accepts any proof)
  console.log("📝 Deploying Groth16Verifier_Dummy (TEST ONLY)...");
  const verifierA = await deploy("Groth16Verifier_Dummy", {
    from: deployer,
    contract: "Groth16Verifier_Dummy",
    args: [],
    log: true,
    autoMine: true,
  });
  console.log("✅ Groth16Verifier_Dummy deployed at:", verifierA.address);
  console.log("   ⚠️  This verifier accepts ANY proof!");

  // Step 2: Deploy Groth16VerifierB_Dummy (accepts any proof)
  console.log("\n📝 Deploying Groth16VerifierB_Dummy (TEST ONLY)...");
  const verifierB = await deploy("Groth16VerifierB_Dummy", {
    from: deployer,
    contract: "Groth16VerifierB_Dummy",
    args: [],
    log: true,
    autoMine: true,
  });
  console.log("✅ Groth16VerifierB_Dummy deployed at:", verifierB.address);
  console.log("   ⚠️  This verifier accepts ANY proof!");

  // Step 3: Deploy Main_Contract
  console.log("\n📝 Deploying Main_Contract...");
  const mainContract = await deploy("Main_Contract", {
    from: deployer,
    contract: "Main_Contract",
    args: [],
    log: true,
    autoMine: true,
  });
  console.log("✅ Main_Contract deployed at:", mainContract.address);

  // Step 4: Deploy Burner_Verifier
  console.log("\n📝 Deploying Burner_Verifier...");
  const burnerVerifier = await deploy("Burner_Verifier", {
    from: deployer,
    contract: "Burner_Verifier",
    args: [mainContract.address, verifierA.address],
    log: true,
    autoMine: true,
  });
  console.log("✅ Burner_Verifier deployed at:", burnerVerifier.address);

  // Step 5: Deploy Minter_Verifier
  console.log("\n📝 Deploying Minter_Verifier...");
  const minterVerifier = await deploy("Minter_Verifier", {
    from: deployer,
    contract: "Minter_Verifier",
    args: [mainContract.address, verifierA.address, verifierB.address],
    log: true,
    autoMine: true,
  });
  console.log("✅ Minter_Verifier deployed at:", minterVerifier.address);

  // Step 6: Set up controllers in Main_Contract
  console.log("\n🔧 Setting up controllers in Main_Contract...");
  const mainContractInstance = await hre.ethers.getContract<Contract>("Main_Contract", deployer);
  
  // Set burn controller
  const setBurnTx = await mainContractInstance.setBurnController(burnerVerifier.address);
  await setBurnTx.wait();
  console.log("✅ Burn controller set to:", burnerVerifier.address);

  // Set mint controller
  const setMintTx = await mainContractInstance.setMintController(minterVerifier.address);
  await setMintTx.wait();
  console.log("✅ Mint controller set to:", minterVerifier.address);

  console.log("\n🎉 All TEST contracts deployed successfully!");
  console.log("\n📋 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Groth16Verifier_Dummy:  ", verifierA.address, "⚠️  TEST ONLY");
  console.log("Groth16VerifierB_Dummy: ", verifierB.address, "⚠️  TEST ONLY");
  console.log("Main_Contract:          ", mainContract.address);
  console.log("Burner_Verifier:        ", burnerVerifier.address);
  console.log("Minter_Verifier:        ", minterVerifier.address);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n⚠️  REMINDER: These dummy verifiers accept ANY proof!");
  console.log("⚠️  Use ONLY for testing. Deploy with real verifiers for production.\n");
};

export default deployTestContracts;

// Use tag "TestMode" to deploy with dummy verifiers
deployTestContracts.tags = ["TestMode", "DummyVerifiers"];
