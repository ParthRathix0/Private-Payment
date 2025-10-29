# Corrected UI Workflow

## Summary of Changes

The frontend has been updated to correctly match the smart contract workflow:

### 1. **Send Option (📤 Send - Private Transfer)**
- **Takes input**: ProofA only (5 public signals)
- **Calls**: `Burner_Verifier.BurnerVerifier(proof_A)`
- **Contract**: `burner_verifier1.sol`
- **Purpose**: Private transfer using Circuit A proof

**ProofA Structure:**
```
A: [2 values]
B: [2x2 matrix - 4 values]
C: [2 values]
Public Signals: [5 values]
  - currentPublic
  - currentPrivate  
  - amount
  - newPrivate
  - newPublic
```

### 2. **Mint Option (💎 Mint)**
- **Takes input**: ProofA + ProofB
- **Calls**: `Minter_Verifier.Minter_VerifierVerifier(proof_A, proof_B)`
- **Contract**: `minter_verifier1.sol`
- **Purpose**: Minting using both Circuit A and Circuit B proofs

**ProofA Structure:** (same as above - 5 public signals)

**ProofB Structure:**
```
A: [2 values]
B: [2x2 matrix - 4 values]
C: [2 values]
Public Signals: [3 values]
  - amount_hash
  - old_commitment
  - new_commitment
```

## Key Corrections Made

1. ✅ **Renamed "Burn" button to "Send"** - More accurately reflects the private transfer operation
2. ✅ **Send modal now uses ProofA** - Previously incorrectly called "burnProof", now uses `sendProofA`
3. ✅ **Send calls BurnerVerifier** - Correctly invokes `BurnerVerifier(proof_A)` with 5 public signals
4. ✅ **Mint requires both proofs** - Takes ProofA (5 signals) + ProofB (3 signals)
5. ✅ **Mint calls Minter_VerifierVerifier** - Correctly invokes `Minter_VerifierVerifier(proof_A, proof_B)`

## Contract Functions

### BurnerVerifier in burner_verifier1.sol
```solidity
function BurnerVerifier(Proof calldata proof) external payable
```
- Verifies ProofA with 5 public signals
- Updates balance in Main_Contract

### Minter_VerifierVerifier in minter_verifier1.sol
```solidity
function Minter_VerifierVerifier(Proof calldata proof_A, ProofB calldata proof_B) external payable
```
- Verifies ProofA (5 public signals)
- Verifies ProofB (3 public signals)  
- Mints tokens in Main_Contract

## Usage Flow

### For Private Send:
1. Click "📤 Send (Private Transfer)" button
2. Fill in ProofA components (A, B, C, and 5 public signals)
3. Click "Submit to BurnerVerifier"
4. Transaction calls `Burner_Verifier.BurnerVerifier(proofA)`

### For Minting:
1. Click "💎 Mint" button
2. Fill in ProofA components (blue section - 5 public signals)
3. Fill in ProofB components (green section - 3 public signals)
4. Click "Submit to Minter_VerifierVerifier"
5. Transaction calls `Minter_Verifier.Minter_VerifierVerifier(proofA, proofB)`

## Technical Details

- **ProofA**: Circuit A (update_balance.circom) - subtracts from private balance
- **ProofB**: Circuit B (proofB.circom) - adds to private balance
- **Dummy Verifiers**: Currently using dummy verifiers that accept any proof for testing
- **Balance Reading**: Real-time balance display via `Main_Contract.getbalance()`
- **Auto-refresh**: Balances automatically update after transactions

## State Management

```typescript
// Send operation
const [sendProofA, setSendProofA] = useState({
  A: ["", ""],
  B: [["", ""], ["", ""]],
  C: ["", ""],
  publicSignals: ["", "", "", "", ""] // 5 values
});

// Mint operation
const [mintProofA, setMintProofA] = useState({...}); // 5 public signals
const [mintProofB, setMintProofB] = useState({...}); // 3 public signals
```

All corrections have been applied and TypeScript compilation shows **no errors**! 🎉
