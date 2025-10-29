import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the complete ZK privacy contract system:
 * 1. Groth16Verifier (for burner proofs)
 * 2. Groth16VerifierB (for minter proofs)
 * 3. Main_Contract (main balance management)
 * 4. Burner_Verifier (handles burning with proof verification)
 * 5. Minter_Verifier (handles minting with dual proof verification)
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🚀 Starting deployment of ZK privacy contracts...\n");

  // Step 1: Deploy Groth16Verifier (for burner/circuit A proofs)
  console.log("📝 Deploying Groth16Verifier...");
  const verifierA = await deploy("Groth16Verifier", {
    from: deployer,
    contract: "Groth16Verifier",
    args: [],
    log: true,
    autoMine: true,
  });
  console.log("✅ Groth16Verifier deployed at:", verifierA.address);

  // Step 2: Deploy Groth16VerifierB (for minter/circuit B proofs)
  console.log("\n📝 Deploying Groth16VerifierB...");
  const verifierB = await deploy("Groth16VerifierB", {
    from: deployer,
    contract: "Groth16VerifierB",
    args: [],
    log: true,
    autoMine: true,
  });
  console.log("✅ Groth16VerifierB deployed at:", verifierB.address);

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

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📋 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Groth16Verifier:     ", verifierA.address);
  console.log("Groth16VerifierB:    ", verifierB.address);
  console.log("Main_Contract:       ", mainContract.address);
  console.log("Burner_Verifier:     ", burnerVerifier.address);
  console.log("Minter_Verifier:     ", minterVerifier.address);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
};

export default deployContracts;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags ZKPrivacy
deployContracts.tags = ["ZKPrivacy", "Main_Contract", "Verifiers"];
