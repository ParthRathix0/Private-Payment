# Changes Summary - ZK Privacy Contract Deployment

## What Was Changed

### 1. Deployment Script Updated ✅
**File**: `packages/hardhat/deploy/00_deploy_your_contract.ts`

**Changes**:
- Replaced deployment of `YourContract.sol` with your ZK privacy contracts
- Added sequential deployment of 5 contracts:
  1. Groth16Verifier (Circuit A verifier)
  2. Groth16VerifierB (Circuit B verifier)
  3. Main_Contract (core balance management)
  4. Burner_Verifier (burn operations with proof verification)
  5. Minter_Verifier (mint operations with dual proof verification)
- Automatic setup of controller addresses in Main_Contract
- Enhanced logging with deployment summary
- Updated tags for selective deployment

### 2. Documentation Added ✅
**New Files Created**:
- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `CONTRACT_INTERACTION_GUIDE.md` - Detailed contract interaction patterns
- `deploy.sh` - Automated deployment script

## Contracts Deployed

```
Groth16Verifier (Verifier1.sol)
  ↓
Groth16VerifierB (verifier_B1.sol)
  ↓
Main_Contract (main1.sol)
  ↓
Burner_Verifier (burner_verifier1.sol) ← References: Main_Contract, Groth16Verifier
  ↓
Minter_Verifier (minter_verifier1.sol) ← References: Main_Contract, Groth16Verifier, Groth16VerifierB
```

## How to Deploy

### Option 1: Using the Deploy Script (Recommended)
```bash
./deploy.sh
```

### Option 2: Manual Deployment
```bash
# Terminal 1: Start local node
cd packages/hardhat
yarn chain

# Terminal 2: Deploy contracts
cd packages/hardhat
yarn deploy

# Generate TypeScript types
cd packages/nextjs
yarn generate
```

### Option 3: Deploy to Live Network
```bash
cd packages/hardhat
yarn deploy --network sepolia
```

## What Happens During Deployment

1. **Compilation**: All contracts are compiled
2. **Verifier A Deployment**: Groth16Verifier is deployed
3. **Verifier B Deployment**: Groth16VerifierB is deployed
4. **Main Contract Deployment**: Main_Contract is deployed (you become owner)
5. **Burner Deployment**: Burner_Verifier is deployed with references
6. **Minter Deployment**: Minter_Verifier is deployed with references
7. **Controller Setup**: Main_Contract is configured with controller addresses
8. **Summary Output**: All contract addresses are displayed

## Verification

After deployment, verify:
- ✅ All 5 contracts deployed successfully
- ✅ Deployment summary shows all addresses
- ✅ Main_Contract owner is your deployer address
- ✅ burn_controller is set to Burner_Verifier address
- ✅ mint_controller is set to Minter_Verifier address
- ✅ Deployment artifacts created in `packages/hardhat/deployments/localhost/`

## Next Steps

1. **Test Deployment**:
   ```bash
   cd packages/hardhat
   yarn test
   ```

2. **Start Frontend**:
   ```bash
   yarn start
   ```

3. **Interact with Contracts**:
   - Visit http://localhost:3000
   - Go to Debug tab
   - Select your deployed contracts
   - Test contract functions

4. **Generate ZK Proofs**:
   - Use your ZK circuits to generate proofs
   - Follow the public signals format documented in CONTRACT_INTERACTION_GUIDE.md

5. **Test Burner Flow**:
   - Generate Circuit A proof
   - Call `BurnerVerifier` function
   - Check balances updated in Main_Contract

6. **Test Minter Flow**:
   - Generate Circuit A + Circuit B proofs
   - Ensure amount_r hash matches
   - Call `Minter_VerifierVerifier` function
   - Check balances updated in Main_Contract

## Contracts NOT Deployed

- ❌ `YourContract.sol` - Replaced with your custom contracts
- ✅ All other contracts in the contracts folder ARE deployed

## File Structure After Deployment

```
packages/hardhat/
├── contracts/
│   ├── main1.sol ✅ (deployed as Main_Contract)
│   ├── minter_verifier1.sol ✅ (deployed as Minter_Verifier)
│   ├── burner_verifier1.sol ✅ (deployed as Burner_Verifier)
│   ├── Verifier1.sol ✅ (deployed as Groth16Verifier)
│   ├── verifier_B1.sol ✅ (deployed as Groth16VerifierB)
│   ├── data_types1.sol ✅ (imported by other contracts)
│   └── YourContract.sol ❌ (NOT deployed)
├── deploy/
│   └── 00_deploy_your_contract.ts (UPDATED)
└── deployments/
    └── localhost/
        ├── Main_Contract.json
        ├── Burner_Verifier.json
        ├── Minter_Verifier.json
        ├── Groth16Verifier.json
        └── Groth16VerifierB.json
```

## Troubleshooting

### Issue: Compilation Fails
```bash
cd packages/hardhat
yarn clean
yarn compile
```

### Issue: Deployment Fails
- Check that Hardhat node is running (`yarn chain`)
- Check that deployer has sufficient balance
- Check for syntax errors in contracts

### Issue: Frontend Can't Find Contracts
```bash
cd packages/nextjs
yarn generate
```

### Issue: Need to Redeploy
```bash
# Stop the node (Ctrl+C)
# Restart with clean state
yarn chain
yarn deploy --reset
```

## Important Notes

1. **Deployer Account**: The account that deploys becomes the owner of Main_Contract
2. **Controller Setup**: Automatically configured during deployment
3. **Immutable Verifiers**: Verifier contracts cannot be changed after deployment
4. **ZK Proofs**: Must match the verification keys in deployed verifiers
5. **Network**: Default deployment is to localhost (Hardhat network)

## Resources

- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Interaction Guide**: `CONTRACT_INTERACTION_GUIDE.md`
- **Hardhat Docs**: https://hardhat.org/
- **Scaffold-ETH Docs**: https://docs.scaffoldeth.io/

## Questions?

Check the documentation files for detailed information:
- How to generate proofs: See CONTRACT_INTERACTION_GUIDE.md
- How to deploy to testnet: See DEPLOYMENT_GUIDE.md
- How to interact with contracts: See CONTRACT_INTERACTION_GUIDE.md
