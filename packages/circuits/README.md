# Circuits

This folder contains the Circom circuits that generate zk-SNARK proofs for the 3zio private transfer protocol.

---

## 📁 Folder Layout

```bash
circuits/
├── update_balance.circom     # Circuit A - Balance state transitions
├── proofB.circom             # Circuit B - Amount validation
├── update_balance_js/        # Compiled witness generator (Circuit A)
│   ├── update_balance.wasm
│   ├── generate_witness.js
│   └── witness_calculator.js
├── proofB_js/                # Compiled witness generator (Circuit B)
│   ├── proofB.wasm
│   ├── generate_witness.js
│   └── witness_calculator.js
├── update_balance_cpp/       # C++ witness generator (Circuit A)
├── *.r1cs                    # Constraint systems
├── *.sym                     # Debug symbols
├── *.zkey                    # Proving keys
├── *.vkey.json               # Verification keys
└── *.ptau                    # Powers of Tau ceremony files
```

---

## 🔐 Circuit Overview

### Circuit A: `update_balance.circom` (Burner/Sender Side)

**Purpose:** Proves correct balance state transitions for burn/mint operations.

**Inputs:**

```circom
signal input pub_balance;           // Current public balance
signal input priv_balance;          // Current private balance
signal input new_priv_balance;      // New private balance after operation
signal input r;                     // Randomness for old commitment
signal input r_new;                 // Randomness for new commitment
signal input secret;                // User secret (nullifier preimage)
```

**Outputs (5 public signals):**

```circom
signal output old_commitment;       // Commit(priv_balance, r)
signal output new_commitment;       // Commit(new_priv_balance, r_new)
signal output curr_pub_balance;     // = pub_balance
signal output new_priv_balance_out; // = new_priv_balance
signal output nullifier;            // Hash(secret)
```

**Constraints:**

- Old commitment = Poseidon(priv_balance, r)
- New commitment = Poseidon(new_priv_balance, r_new)
- Nullifier = Poseidon(secret)
- All values properly constrained

**Used by:** `Groth16Verifier` (deployed on-chain)

---

### Circuit B: `proofB.circom` (Minter/Receiver Side)

**Purpose:** Validates transfer amounts using commitment scheme.

**Inputs:**

```circom
signal input priv_balance;          // Current private balance
signal input new_priv_balance;      // New private balance
signal input r;                     // Randomness for old commitment
signal input r_new;                 // Randomness for new commitment
signal input amount;                // Transfer amount
```

**Outputs (3 public signals):**

```circom
signal output old_commitment;       // Commit(priv_balance, r)
signal output new_commitment;       // Commit(new_priv_balance, r_new)
signal output amount_hash;          // Poseidon(amount)
```

**Constraints:**

- Old commitment = Poseidon(priv_balance, r)
- New commitment = Poseidon(new_priv_balance, r_new)
- Amount hash = Poseidon(amount)
- Balance constraints enforced

**Used by:** `Groth16VerifierB` (deployed on-chain)

---

## 🚀 Setup & Installation

### Prerequisites

Install Circom: [installation guide](https://docs.circom.io/getting-started/installation/)

```bash
# Install Circom (via Rust)
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
cargo install --git https://github.com/iden3/circom.git circom

# Verify installation
circom --version  # Should show 2.0.0 or higher

# Install snarkJS
npm install -g snarkjs

# Initialize project (if needed)
npm init -y
npm install circomlib
```

---

## 🔨 Compilation

### Compile Circuit A (update_balance.circom)

```bash
# Generate R1CS, WASM, and symbols
circom update_balance.circom --r1cs --wasm --sym -o .

# View circuit info
snarkjs r1cs info update_balance.r1cs

# Print constraints (optional)
snarkjs r1cs print update_balance.r1cs update_balance.sym
```

### Compile Circuit B (proofB.circom)

```bash
# Generate R1CS, WASM, and symbols
circom proofB.circom --r1cs --wasm --sym -o .

# View circuit info
snarkjs r1cs info proofB.r1cs
```

---

## 🎯 Trusted Setup

The circuits use a Powers of Tau ceremony for the trusted setup. Files are already included in the repo.

### Powers of Tau Files

- `pot12_0000.ptau` - Initial ceremony file (2^12 constraints)
- `pot12_final.ptau` - Completed Powers of Tau
- `pot12_final_phase2.ptau` - After phase 2 contributions

### Proving Keys

- `update_balance_0000.zkey` - Proving key for Circuit A
- `proofB_0000.zkey` - Proving key for Circuit B

### Verification Keys

- `update_balance.vkey.json` - Verification key for Circuit A
- `proofB.vkey.json` - Verification key for Circuit B

### To regenerate (if needed):

**Circuit A:**

```bash
# Start Powers of Tau ceremony (only once)
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

# Contribute to ceremony
snarkjs powersoftau contribute pot12_0000.ptau pot12_final.ptau --name="First contribution" -v

# Prepare phase 2
snarkjs powersoftau prepare phase2 pot12_final.ptau pot12_final_phase2.ptau -v

# Setup circuit A
snarkjs groth16 setup update_balance.r1cs pot12_final_phase2.ptau update_balance_0000.zkey

# Export verification key
snarkjs zkey export verificationkey update_balance_0000.zkey update_balance.vkey.json
```

**Circuit B:**

```bash
# Reuse Powers of Tau from Circuit A

# Setup circuit B
snarkjs groth16 setup proofB.r1cs pot12_final_phase2.ptau proofB_0000.zkey

# Export verification key
snarkjs zkey export verificationkey proofB_0000.zkey proofB.vkey.json
```

---

## 🔧 Generate Verifier Contracts

```bash
# Generate Solidity verifier for Circuit A
snarkjs zkey export solidityverifier update_balance_0000.zkey ../hardhat/contracts/Verifier1.sol

# Generate Solidity verifier for Circuit B
snarkjs zkey export solidityverifier proofB_0000.zkey ../hardhat/contracts/Verifier_B1.sol
```

**Note:** Verifiers are auto-generated and shouldn't be manually edited.

---

## 🧪 Proof Generation

### Example: Generate Proof for Circuit A

```bash
# Create input file: input_a.json
{
  "pub_balance": "1000",
  "priv_balance": "500",
  "new_priv_balance": "300",
  "r": "123456789",
  "r_new": "987654321",
  "secret": "42"
}

# Generate witness
node update_balance_js/generate_witness.js \
  update_balance_js/update_balance.wasm \
  input_a.json \
  witness_a.wtns

# Generate proof
snarkjs groth16 prove \
  update_balance_0000.zkey \
  witness_a.wtns \
  proof_a.json \
  public_a.json

# Verify proof locally
snarkjs groth16 verify \
  update_balance.vkey.json \
  public_a.json \
  proof_a.json
```

### Example: Generate Proof for Circuit B

```bash
# Create input file: input_b.json
{
  "priv_balance": "500",
  "new_priv_balance": "300",
  "r": "123456789",
  "r_new": "987654321",
  "amount": "200"
}

# Generate witness
node proofB_js/generate_witness.js \
  proofB_js/proofB.wasm \
  input_b.json \
  witness_b.wtns

# Generate proof
snarkjs groth16 prove \
  proofB_0000.zkey \
  witness_b.wtns \
  proof_b.json \
  public_b.json

# Verify proof locally
snarkjs groth16 verify \
  proofB.vkey.json \
  public_b.json \
  proof_b.json
```

---

## 📊 Circuit Statistics

### Circuit A: update_balance.circom

```
Wires: ~150
Constraints: ~180
Private Inputs: 6
Public Outputs: 5
Main Component: UpdateBalance
```

### Circuit B: proofB.circom

```
Wires: ~120
Constraints: ~150
Private Inputs: 5
Public Outputs: 3
Main Component: ProofB
```

_Use `snarkjs r1cs info <circuit>.r1cs` for exact numbers._

---

## 🔒 Security Considerations

### Poseidon Hash Function

- ZK-friendly hash function optimized for SNARK circuits
- More efficient than SHA-256 in zero-knowledge contexts
- Provides collision resistance and preimage resistance

### Randomness (r, r_new)

- Must be cryptographically random
- Never reuse randomness values
- Keep randomness values secret

### Secret/Nullifier

- User's secret must be kept private
- Nullifier prevents double-spending
- Computed as Poseidon(secret)

### Trusted Setup

- Powers of Tau ceremony must be secure
- At least one honest participant required
- Phase 2 contributions increase security

---

## 🧮 Understanding Public Signals

### Circuit A Output Order

When calling `Groth16Verifier.verifyProof()`:

```solidity
uint[5] memory publicSignals = [
  old_commitment,      // signals[0]
  new_commitment,      // signals[1]
  curr_pub_balance,    // signals[2]
  new_priv_balance,    // signals[3]
  nullifier            // signals[4]
];
```

### Circuit B Output Order

When calling `Groth16VerifierB.verifyProof()`:

```solidity
uint[3] memory publicSignals = [
  old_commitment,      // signals[0]
  new_commitment,      // signals[1]
  amount_hash          // signals[2]
];
```

---

## 🛠️ Development Workflow

### 1. Edit Circuit

```bash
vim update_balance.circom  # or proofB.circom
```

### 2. Recompile

```bash
circom update_balance.circom --r1cs --wasm --sym
```

### 3. Regenerate Proving Key

```bash
snarkjs groth16 setup update_balance.r1cs pot12_final_phase2.ptau update_balance_0000.zkey
```

### 4. Export New Verifier

```bash
snarkjs zkey export solidityverifier update_balance_0001.zkey ../contract/contracts/Verifier.sol
```

### 5. Recompile Contracts

```bash
cd ../contract
npx hardhat compile
```

---

## 📚 Additional Resources

- **Circom Documentation:** https://docs.circom.io/
- **snarkJS GitHub:** https://github.com/iden3/snarkjs
- **Poseidon Hash:** https://www.poseidon-hash.info/
- **Groth16 Paper:** https://eprint.iacr.org/2016/260.pdf
- **Powers of Tau:** https://github.com/iden3/snarkjs#7-prepare-phase-2

---

## 🐛 Troubleshooting

### Issue: "Template not found"

**Solution:** Check circom syntax, ensure components are imported correctly.

### Issue: "Constraints not satisfied"

**Solution:** Verify input values satisfy all circuit constraints. Check intermediate signal values.

### Issue: "Proof verification fails"

**Solution:** Ensure public signals match exactly between proof generation and verification.

### Issue: "Powers of Tau file too small"

**Solution:** Use larger ceremony file (e.g., pot14 for 2^14 constraints).

---

## 📞 Support

For circuit-specific questions:

1. Review circuit code (`*.circom` files)
2. Check snarkJS documentation
3. Examine constraint files (`*.r1cs`)
4. Test with sample inputs

---

## 📊 Files Included

### Compiled Artifacts (Already in Repo)

✅ `update_balance.r1cs` - Circuit A constraint system  
✅ `proofB.r1cs` - Circuit B constraint system  
✅ `update_balance_js/` - Circuit A witness generator  
✅ `proofB_js/` - Circuit B witness generator  
✅ `*.zkey` - Proving keys (trusted setup)  
✅ `*.vkey.json` - Verification keys  
✅ `*.ptau` - Powers of Tau ceremony files

### Source Files

✅ `update_balance.circom` - Circuit A source  
✅ `proofB.circom` - Circuit B source

---

**Last Updated:** October 26, 2025  
**Circom Version:** 2.0.0  
**snarkJS Version:** 0.7.x
