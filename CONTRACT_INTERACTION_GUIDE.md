# Contract Interaction Guide

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your ZK Privacy System                    │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  Groth16Verifier │ (Circuit A)
                    └────────┬─────────┘
                             │ verifies
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
    │                        │                        │
┌───▼───────────┐    ┌──────▼─────────┐    ┌────────▼──────────┐
│ Main_Contract │◄───┤ Burner_Verifier │    │ Groth16VerifierB  │
│  (Core Logic) │    └────────────────┘    │   (Circuit B)     │
└───▲───────────┘                          └────────┬──────────┘
    │                                               │ verifies
    │            ┌──────────────────┐               │
    └────────────┤ Minter_Verifier  │◄──────────────┘
                 └──────────────────┘
```

## Main_Contract

### State Variables
- `mapping(address => balance_data) balances` - Stores user balances
- `address burn_controller` - Address of Burner_Verifier
- `address mint_controller` - Address of Minter_Verifier
- `address owner` - Contract owner (deployer)
- `mapping(uint256 => bool) unminted_proofs` - Tracks used nullifiers

### Key Functions

#### `getbalance(address user) → balance_data`
Get a user's public and private balance.

```solidity
balance_data memory balance = mainContract.getbalance(userAddress);
// balance.pub_balance - Public balance
// balance.priv_balance - Private balance
```

#### `burner(address user, uint256 curr_pub_balance, uint256 new_priv_balance, uint256 nullifier)`
**Restricted to burn_controller only**
Called by Burner_Verifier to update balances after successful burn proof.

#### `minter(address user, uint256 curr_pub_balance, uint256 new_priv_balance, uint256 nullifier)`
**Restricted to mint_controller only**
Called by Minter_Verifier to update balances after successful mint proof.

#### `setBurnController(address _controller)` & `setMintController(address _controller)`
**Owner only**
Set the authorized verifier contracts.

---

## Burner_Verifier

### Purpose
Verifies ZK proofs for "burning" operations (converting public balance to private).

### Constructor
```solidity
constructor(address _contract, address _verifier)
```
- `_contract`: Main_Contract address
- `_verifier`: Groth16Verifier address

### Main Function

#### `BurnerVerifier(Proof calldata proof)`

**Proof Structure (Circuit A):**
```solidity
struct Proof {
    uint256[2] A;
    uint256[2][2] B;
    uint256[2] C;
    uint256[] _publicSignals; // [0-4]: specific signals
}
```

**Public Signals (5 signals):**
- `_publicSignals[0]`: Current public balance
- `_publicSignals[1]`: Current private balance
- `_publicSignals[2]`: New private balance
- `_publicSignals[3]`: Amount_r hash
- `_publicSignals[4]`: Nullifier

**Process:**
1. Verifies the ZK proof using Groth16Verifier
2. Checks current balances match what's in Main_Contract
3. Calls Main_Contract.burner() to update balances
4. Stores nullifier to prevent replay

**Example Call:**
```javascript
const proof = {
    A: [a1, a2],
    B: [[b1, b2], [b3, b4]],
    C: [c1, c2],
    _publicSignals: [currPub, currPriv, newPriv, amountRHash, nullifier]
};

await burnerVerifier.BurnerVerifier(proof);
```

---

## Minter_Verifier

### Purpose
Verifies dual ZK proofs for "minting" operations (converting private balance to public).

### Constructor
```solidity
constructor(address _contract, address _verifier, address _verifierB)
```
- `_contract`: Main_Contract address
- `_verifier`: Groth16Verifier address (for Circuit A)
- `_verifierB`: Groth16VerifierB address (for Circuit B)

### Main Function

#### `Minter_VerifierVerifier(Proof calldata proof_A, ProofB calldata proof_B)`

**Proof A Structure (from burner chain):**
```solidity
struct Proof {
    uint256[2] A;
    uint256[2][2] B;
    uint256[2] C;
    uint256[] _publicSignals; // 5 signals
}
```

**Proof A Public Signals:**
- `_publicSignals[0]`: Current public balance
- `_publicSignals[1]`: Current private balance
- `_publicSignals[2]`: New private balance
- `_publicSignals[3]`: Amount_r hash (must match Proof B)
- `_publicSignals[4]`: Nullifier

**Proof B Structure (from minter chain):**
```solidity
struct ProofB {
    uint256[2] A;
    uint256[2][2] B;
    uint256[2] C;
    uint256[] _publicSignals; // 3 signals
}
```

**Proof B Public Signals:**
- `_publicSignals[0]`: Old commitment
- `_publicSignals[1]`: New commitment (new private balance)
- `_publicSignals[2]`: Amount_r hash (must match Proof A)

**Process:**
1. Verifies proof_A using Groth16Verifier
2. Verifies proof_B using Groth16VerifierB
3. Checks that both proofs have matching amount_r hash
4. Retrieves current balances from Main_Contract
5. Calls Main_Contract.minter() to update balances

**Example Call:**
```javascript
const proof_A = {
    A: [a1, a2],
    B: [[b1, b2], [b3, b4]],
    C: [c1, c2],
    _publicSignals: [currPub, currPriv, newPriv, amountRHash, nullifier]
};

const proof_B = {
    A: [a1, a2],
    B: [[b1, b2], [b3, b4]],
    C: [c1, c2],
    _publicSignals: [oldCommitment, newCommitment, amountRHash]
};

await minterVerifier.Minter_VerifierVerifier(proof_A, proof_B);
```

---

## Data Structures

### balance_data
```solidity
struct balance_data {
    uint256 pub_balance;   // Public balance
    uint256 priv_balance;  // Private balance (commitment)
}
```

### Proof
```solidity
struct Proof {
    uint256[2] A;           // Proof point A
    uint256[2][2] B;        // Proof point B
    uint256[2] C;           // Proof point C
    uint256[] _publicSignals; // Public signals (5 for Circuit A)
}
```

### ProofB
```solidity
struct ProofB {
    uint256[2] A;           // Proof point A
    uint256[2][2] B;        // Proof point B
    uint256[2] C;           // Proof point C
    uint256[] _publicSignals; // Public signals (3 for Circuit B)
}
```

---

## Usage Flow

### Burn Flow (Public → Private)
1. User has public balance in Main_Contract
2. User generates ZK proof (Circuit A) proving:
   - Knowledge of current balances
   - Valid burn amount
   - New private balance commitment
3. User calls `Burner_Verifier.BurnerVerifier(proof)`
4. If valid, balances are updated in Main_Contract

### Mint Flow (Private → Public)
1. User has private balance in Main_Contract
2. User generates two ZK proofs:
   - **Proof A** (Circuit A): Proves current state on burner chain
   - **Proof B** (Circuit B): Proves new state on minter chain
   - Both proofs must have matching amount_r hash
3. User calls `Minter_Verifier.Minter_VerifierVerifier(proof_A, proof_B)`
4. If both valid and amount_r matches, balances are updated

---

## Security Considerations

1. **Nullifier Tracking**: Prevents replay attacks
   - Burner: Stores nullifier to prevent reuse
   - Minter: Checks nullifier was created by valid burn

2. **Amount Matching**: Ensures consistency
   - amount_r hash must match between proof_A and proof_B
   - Prevents minting more than was burned

3. **Balance Verification**: Prevents unauthorized updates
   - Burner verifies current balances match on-chain state
   - Only authorized controllers can modify balances

4. **Access Control**:
   - Only owner can set controllers
   - Only designated controllers can update balances
   - Prevents unauthorized balance modifications

---

## Testing Checklist

- [ ] Deploy all contracts
- [ ] Verify owner is set correctly in Main_Contract
- [ ] Verify burn_controller is set to Burner_Verifier
- [ ] Verify mint_controller is set to Minter_Verifier
- [ ] Test getbalance() for a user
- [ ] Generate valid Circuit A proof
- [ ] Test BurnerVerifier with valid proof
- [ ] Test BurnerVerifier rejects invalid proof
- [ ] Test BurnerVerifier rejects replayed nullifier
- [ ] Generate valid Circuit A + Circuit B proofs
- [ ] Test Minter_VerifierVerifier with valid proofs
- [ ] Test Minter_VerifierVerifier rejects mismatched amount_r
- [ ] Test Minter_VerifierVerifier rejects invalid proofs
- [ ] Test Minter_VerifierVerifier requires valid nullifier
