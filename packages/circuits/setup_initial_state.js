const { buildPoseidon } = require("circomlibjs");

async function setupInitialState() {
  const poseidon = await buildPoseidon();
  
  // Your account
  const userAddress = "0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0";
  
  // Initial balances
  const publicBalance = BigInt("100"); // 100 tokens (visible on-chain)
  const privateBalance = BigInt("0");   // 0 tokens private (hidden)
  const secret = BigInt("99999");       // Your private secret/salt
  const randomness = BigInt("88888");   // Randomness for commitments
  
  // Compute initial commitment: Poseidon(secret, private_balance)
  const initialCommitment = poseidon.F.toString(poseidon([secret, privateBalance]));
  
  console.log("=".repeat(70));
  console.log("INITIAL STATE SETUP");
  console.log("=".repeat(70));
  console.log("\n📍 User Address:", userAddress);
  console.log("\n💰 BALANCES TO SET ON-CHAIN:");
  console.log("   - Public Balance: ", publicBalance.toString(), "tokens");
  console.log("   - Private Balance Commitment:", initialCommitment);
  console.log("\n🔐 KEEP THESE SECRET (OFF-CHAIN ONLY):");
  console.log("   - Actual Private Balance:", privateBalance.toString(), "tokens");
  console.log("   - Secret:", secret.toString());
  console.log("   - Randomness:", randomness.toString());
  
  console.log("\n" + "=".repeat(70));
  console.log("OPERATION: BURN 40 TOKENS (Public → Private) - Uses Circuit B");
  console.log("=".repeat(70));
  
  // Operation: Burn 40 tokens (move from public to private)
  const burnAmount = BigInt("40");
  const newPrivateBalance = privateBalance + burnAmount; // 0 + 40 = 40
  
  // Compute new commitment after burn
  const newCommitment = poseidon.F.toString(poseidon([secret, newPrivateBalance]));
  
  console.log("\n📤 BURN OPERATION:");
  console.log("   - Amount to Burn:", burnAmount.toString(), "tokens");
  console.log("   - New Public Balance:", (publicBalance - burnAmount).toString(), "tokens (100 - 40 = 60)");
  console.log("   - New Private Balance:", newPrivateBalance.toString(), "tokens (0 + 40 = 40)");
  
  // Generate ProofB input (Burner proof) - Circuit B adds to private balance
  const proofB_burn_input = {
    old_commitment: initialCommitment,
    new_commitment: newCommitment,
    secret: secret.toString(),
    randomness: randomness.toString(),
    private_balance: privateBalance.toString(),
    spend_amount: burnAmount.toString()
  };
  
  console.log("\n📝 PROOF B INPUT (for Burner - Circuit B):");
  console.log(JSON.stringify(proofB_burn_input, null, 2));
  
  console.log("\n" + "=".repeat(70));
  console.log("AFTER BURN: NEW STATE");
  console.log("=".repeat(70));
  console.log("\n💰 ON-CHAIN STATE (after burn succeeds):");
  console.log("   - Public Balance:", (publicBalance - burnAmount).toString(), "tokens");
  console.log("   - Private Balance Commitment:", newCommitment);
  console.log("\n🔐 OFF-CHAIN STATE (your private knowledge):");
  console.log("   - Actual Private Balance:", newPrivateBalance.toString(), "tokens");
  console.log("   - Secret:", secret.toString());
  console.log("   - Randomness:", randomness.toString());
  
  console.log("\n" + "=".repeat(70));
  console.log("OPERATION: MINT 25 TOKENS (Private → Public) - Uses Circuit A");
  console.log("=".repeat(70));
  
  // Operation: Mint 25 tokens (move from private to public)
  const mintAmount = BigInt("25");
  const afterMintPrivateBalance = newPrivateBalance - mintAmount; // 40 - 25 = 15
  const afterMintPublicBalance = publicBalance - burnAmount + mintAmount; // 60 + 25 = 85
  
  // Compute commitment after mint
  const afterMintCommitment = poseidon.F.toString(poseidon([secret, afterMintPrivateBalance]));
  
  console.log("\n📥 MINT OPERATION:");
  console.log("   - Amount to Mint:", mintAmount.toString(), "tokens");
  console.log("   - New Public Balance:", afterMintPublicBalance.toString(), "tokens (60 + 25 = 85)");
  console.log("   - New Private Balance:", afterMintPrivateBalance.toString(), "tokens (40 - 25 = 15)");
  
  // Generate ProofA input (Minter proof) - Circuit A subtracts from private balance
  const proofA_mint_input = {
    public_balance: (publicBalance - burnAmount).toString(), // 60 (current public after burn)
    old_commitment: newCommitment,  // commitment after burn
    new_commitment: afterMintCommitment,
    secret: secret.toString(),
    randomness: randomness.toString(),
    private_balance: newPrivateBalance.toString(),  // 40 tokens
    spend_amount: mintAmount.toString()  // 25 tokens to mint
  };
  
  console.log("\n📝 PROOF A INPUT (for Minter - Circuit A):");
  console.log("   (Using state AFTER burn, to prove you can mint 25 tokens)");
  console.log(JSON.stringify(proofA_mint_input, null, 2));
  
  // Return both inputs for saving
  return {
    initialSetup: {
      address: userAddress,
      publicBalance: publicBalance.toString(),
      privateBalanceCommitment: initialCommitment,
      secret_KEEP_PRIVATE: secret.toString(),
      randomness_KEEP_PRIVATE: randomness.toString(),
      actualPrivateBalance_KEEP_PRIVATE: privateBalance.toString()
    },
    proofB_burn: proofB_burn_input,
    proofA_mint: proofA_mint_input,
    finalState: {
      publicBalance: afterMintPublicBalance.toString(),
      privateBalanceCommitment: afterMintCommitment,
      actualPrivateBalance: afterMintPrivateBalance.toString()
    }
  };
}

setupInitialState()
  .then(data => {
    const fs = require('fs');
    
    // Save ProofB input for BURN
    fs.writeFileSync(
      'proofs/input_proofB_burn.json',
      JSON.stringify(data.proofB_burn, null, 2)
    );
    
    // Save ProofA input for MINT
    fs.writeFileSync(
      'proofs/input_proofA_mint.json',
      JSON.stringify(data.proofA_mint, null, 2)
    );
    
    // Save complete setup info
    fs.writeFileSync(
      'proofs/complete_setup_info.json',
      JSON.stringify(data, null, 2)
    );
    
    console.log("\n" + "=".repeat(70));
    console.log("✅ FILES SAVED:");
    console.log("=".repeat(70));
    console.log("   - proofs/input_proofB_burn.json (Circuit B for Burner)");
    console.log("   - proofs/input_proofA_mint.json (Circuit A for Minter)");
    console.log("   - proofs/complete_setup_info.json");
    console.log("\n🎯 NEXT STEPS:");
    console.log("   1. Deploy contracts on Scaffold");
    console.log("   2. Set initial balances:");
    console.log("      - publicBalance = 100");
    console.log("      - privateBalanceCommitment = " + data.initialSetup.privateBalanceCommitment);
    console.log("   3. Generate ProofB for burning 40 tokens (Circuit B)");
    console.log("   4. Submit to Burner_Verifier");
    console.log("   5. Generate ProofA for minting 25 tokens (Circuit A)");
    console.log("   6. Submit to Minter_Verifier");
  })
  .catch(console.error);
