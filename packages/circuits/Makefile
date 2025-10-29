

# Simple Makefile for ZK Circuit

CIRCUIT = update_balance
PTAU = 12

.PHONY: all compile setup contract clean proof verify transfer

all: compile setup contract proof transfer

compile:
	@echo "Compiling circuit..."
	circom $(CIRCUIT).circom --r1cs --wasm --sym -l ./node_modules

setup:
	@echo "Setting up Powers of Tau..."
	snarkjs powersoftau new bn128 $(PTAU) pot$(PTAU)_0000.ptau -v
	snarkjs powersoftau contribute pot$(PTAU)_0000.ptau pot$(PTAU)_final.ptau --name="First contribution"
	snarkjs powersoftau prepare phase2 pot$(PTAU)_final.ptau pot$(PTAU)_final_phase2.ptau -v
	
	@echo "Running Groth16 setup..."
	snarkjs groth16 setup $(CIRCUIT).r1cs pot$(PTAU)_final_phase2.ptau $(CIRCUIT)_0000.zkey
	
	@echo "Phase 2 ceremony..."
	snarkjs zkey contribute $(CIRCUIT)_0000.zkey $(CIRCUIT)_0001.zkey --name="1st Contributor" -v
	
	@echo "Exporting verification key..."
	snarkjs zkey export verificationkey $(CIRCUIT)_0001.zkey $(CIRCUIT).vkey.json

proof:
	@echo "Generating proof..."
	node update_balance_js/generate_witness.js update_balance_js/update_balance.wasm proofs/input.json witness.wtns
	snarkjs groth16 prove $(CIRCUIT)_0001.zkey witness.wtns proofs/proof.json proofs/public.json

verify:
	@echo "Verifying proof..."
	snarkjs groth16 verify $(CIRCUIT).vkey.json proofs/public.json proofs/proof.json

transfer:
	@echo "Transferring public, proof and other files to contract directory..."
	cp proofs/public.json ../contract/proofs/
	cp proofs/proof.json ../contract/proofs/
	

contract:
	@echo "Generating Solidity verifier..."
	snarkjs zkey export solidityverifier $(CIRCUIT)_0001.zkey ../contract/contracts/Verifier.sol

clean:
	@echo "Cleaning generated files..."
	rm -f *.r1cs *.sym *.ptau *.zkey *.vkey.json
	rm -rf $(CIRCUIT)_js
	rm -f ../contract/contracts/Verifier.sol
