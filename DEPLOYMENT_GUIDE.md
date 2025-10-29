# ZK Privacy Contract Deployment Guide

## Overview
The deployment script has been updated to deploy your complete ZK privacy system instead of the default `YourContract.sol`.

## Contracts Deployed (in order)

1. **Groth16Verifier** (`Verifier1.sol`)
   - ZK proof verifier for Circuit A (burner proofs)
   - No constructor arguments

2. **Groth16VerifierB** (`verifier_B1.sol`)
   - ZK proof verifier for Circuit B (minter proofs)
   - No constructor arguments

3. **Main_Contract** (`main1.sol`)
   - Core balance management contract
   - Handles public and private balances
   - No constructor arguments (deployer becomes owner)

4. **Burner_Verifier** (`burner_verifier1.sol`)
   - Handles burn operations with proof verification
   - Constructor args: Main_Contract address, Groth16Verifier address

5. **Minter_Verifier** (`minter_verifier1.sol`)
   - Handles mint operations with dual proof verification
   - Constructor args: Main_Contract address, Groth16Verifier address, Groth16VerifierB address

## Deployment Process

The deployment script (`packages/hardhat/deploy/00_deploy_your_contract.ts`) automatically:

1. Deploys both verifier contracts
2. Deploys the main contract
3. Deploys burner and minter verifiers with correct contract references
4. Sets up the burn and mint controllers in Main_Contract
5. Outputs a summary of all deployed addresses

## How to Deploy

### Local Network (Hardhat)

1. Start a local Hardhat node:
   ```bash
   cd packages/hardhat
   yarn chain
   ```

2. In a new terminal, deploy the contracts:
   ```bash
   cd packages/hardhat
   yarn deploy
   ```

### Live Networks (Sepolia, etc.)

```bash
cd packages/hardhat
yarn deploy --network sepolia
```

Make sure you have:
- Set up your deployer account with `yarn account:import`
- Sufficient balance for gas fees
- Configured the network in `hardhat.config.ts`

## Post-Deployment

After deployment, the script will:
- ✅ Display all contract addresses
- ✅ Configure the Main_Contract with the correct controller addresses
- ✅ Generate deployment artifacts in `packages/hardhat/deployments/`

The deployment artifacts will be automatically picked up by the frontend when you run:
```bash
yarn generate  # Generates TypeScript types from deployed contracts
```

## Contract Addresses

After deployment, you'll see output like:

```
📋 Deployment Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Groth16Verifier:      0x...
Groth16VerifierB:     0x...
Main_Contract:        0x...
Burner_Verifier:      0x...
Minter_Verifier:      0x...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Save these addresses for interacting with your contracts!

## Key Features

### Main_Contract
- **Owner**: The deployer address
- **Burn Controller**: Set to Burner_Verifier address
- **Mint Controller**: Set to Minter_Verifier address

### Burner_Verifier
- Verifies ZK proofs for burning (Circuit A)
- Updates balances through Main_Contract
- Stores nullifiers to prevent double-spending

### Minter_Verifier
- Verifies dual ZK proofs (Circuit A + Circuit B)
- Ensures amount_r hash matches between proofs
- Updates balances through Main_Contract after verification

## Troubleshooting

### Compilation Issues
```bash
cd packages/hardhat
yarn clean
yarn compile
```

### Redeployment
To redeploy, stop the local node and restart:
```bash
# Terminal 1
yarn chain

# Terminal 2
yarn deploy --reset
```

### Frontend Integration
After deployment, update the frontend:
```bash
cd packages/nextjs
yarn generate
```

This will generate TypeScript types and update `deployedContracts.ts` with your new contract ABIs.

## Tags

You can deploy specific contract groups using tags:
```bash
yarn deploy --tags ZKPrivacy      # Deploy all contracts
yarn deploy --tags Verifiers      # Deploy only verifiers
yarn deploy --tags Main_Contract  # Deploy main contract system
```

## Next Steps

1. **Test the deployment**: Use the debug tab in the frontend to interact with contracts
2. **Generate proofs**: Use your ZK circuit to generate valid proofs
3. **Test burner flow**: Call `BurnerVerifier` with a valid proof
4. **Test minter flow**: Call `Minter_VerifierVerifier` with valid dual proofs
5. **Monitor balances**: Use `getbalance()` on Main_Contract to check user balances

## Notes

- The deployer address becomes the owner of Main_Contract
- Only the owner can set/update the burn and mint controllers
- The verifier contracts are immutable once deployed
- Make sure your ZK proofs match the verification keys in the deployed verifier contracts
