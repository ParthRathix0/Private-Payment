"use client";

import React, { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Dashboard = () => {
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { address: userAddress, isConnected } = useAccount();

  // Proof input states for Send/Burn (ProofA - Circuit A)
  const [sendProofA, setSendProofA] = useState({
    A: ["", ""],
    B: [
      ["", ""],
      ["", ""],
    ],
    C: ["", ""],
    publicSignals: ["", "", "", "", ""], // [currentPublic, currentPrivate, amount, newPrivate, newPublic]
  });

  // Proof input states for Mint (ProofA + ProofB)
  const [mintProofA, setMintProofA] = useState({
    A: ["", ""],
    B: [
      ["", ""],
      ["", ""],
    ],
    C: ["", ""],
    publicSignals: ["", "", "", "", ""], // [currentPublic, currentPrivate, amount, newPrivate, newPublic]
  });

  const [mintProofB, setMintProofB] = useState({
    A: ["", ""],
    B: [
      ["", ""],
      ["", ""],
    ],
    C: ["", ""],
    publicSignals: ["", "", ""], // [amount_hash, old_commitment, new_commitment]
  });

  // Read balances from Main_Contract
  const { data: balanceData, refetch: refetchBalance } = useScaffoldReadContract({
    contractName: "Main_Contract",
    functionName: "getbalance",
    args: [userAddress],
    watch: true, // Auto-refresh on block changes
  });

  // Extract public and private balances
  const publicBalance = balanceData ? formatEther(balanceData.pub_balance) : "0";
  const privateBalance = balanceData ? formatEther(balanceData.priv_balance) : "0";

  // For writing to contracts later (burn/mint operations)
  const { writeContractAsync: writeBurner } = useScaffoldWriteContract("Burner_Verifier");
  const { writeContractAsync: writeMinter } = useScaffoldWriteContract("Minter_Verifier");
  const { writeContractAsync: writeMainContract } = useScaffoldWriteContract("Main_Contract");

  // Function to set initial balance (owner only)
  const setInitialBalance = async () => {
    if (!userAddress) return;

    try {
      setLoading(true);
      await writeMainContract({
        functionName: "initialSetbalance",
        args: [
          userAddress,
          BigInt("100000000000000000000"), // 100 tokens in wei
          BigInt("6215144944274313431358390546859857435196839642684515675387282766541729288730"), // Initial commitment
        ],
      });
      await refetchBalance();
      console.log("Initial balance set successfully!");
    } catch (error) {
      console.error("Error setting initial balance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh balances when user connects
  useEffect(() => {
    if (isConnected && userAddress) {
      refetchBalance();
    }
  }, [isConnected, userAddress, refetchBalance]);

  // Function to handle SEND (ProofA - calls BurnerVerifier)
  const handleSend = async () => {
    if (!sendProofA.A[0] || !sendProofA.publicSignals[0]) {
      alert("Please fill in all proof components for ProofA");
      return;
    }

    try {
      setLoading(true);

      // Convert string inputs to BigInt for contract
      const proofA = {
        A: [BigInt(sendProofA.A[0]), BigInt(sendProofA.A[1])] as readonly [bigint, bigint],
        B: [
          [BigInt(sendProofA.B[0][0]), BigInt(sendProofA.B[0][1])],
          [BigInt(sendProofA.B[1][0]), BigInt(sendProofA.B[1][1])],
        ] as readonly [readonly [bigint, bigint], readonly [bigint, bigint]],
        C: [BigInt(sendProofA.C[0]), BigInt(sendProofA.C[1])] as readonly [bigint, bigint],
        _publicSignals: sendProofA.publicSignals.map((s: string) => BigInt(s)) as readonly bigint[],
      };

      await writeBurner({
        functionName: "BurnerVerifier",
        args: [proofA],
      });

      await refetchBalance();
      setShowBurnModal(false);
      console.log("Send transaction successful!");
    } catch (error) {
      console.error("Send failed:", error);
      alert("Send transaction failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle MINT (ProofA + ProofB - calls Minter_VerifierVerifier)
  const handleMint = async () => {
    if (!mintProofA.A[0] || !mintProofB.A[0]) {
      alert("Please fill in all proof components for both ProofA and ProofB");
      return;
    }

    try {
      setLoading(true);

      // Convert ProofA
      const proofA = {
        A: [BigInt(mintProofA.A[0]), BigInt(mintProofA.A[1])] as readonly [bigint, bigint],
        B: [
          [BigInt(mintProofA.B[0][0]), BigInt(mintProofA.B[0][1])],
          [BigInt(mintProofA.B[1][0]), BigInt(mintProofA.B[1][1])],
        ] as readonly [readonly [bigint, bigint], readonly [bigint, bigint]],
        C: [BigInt(mintProofA.C[0]), BigInt(mintProofA.C[1])] as readonly [bigint, bigint],
        _publicSignals: mintProofA.publicSignals.map((s: string) => BigInt(s)) as readonly bigint[],
      };

      // Convert ProofB
      const proofB = {
        A: [BigInt(mintProofB.A[0]), BigInt(mintProofB.A[1])] as readonly [bigint, bigint],
        B: [
          [BigInt(mintProofB.B[0][0]), BigInt(mintProofB.B[0][1])],
          [BigInt(mintProofB.B[1][0]), BigInt(mintProofB.B[1][1])],
        ] as readonly [readonly [bigint, bigint], readonly [bigint, bigint]],
        C: [BigInt(mintProofB.C[0]), BigInt(mintProofB.C[1])] as readonly [bigint, bigint],
        _publicSignals: mintProofB.publicSignals.map((s: string) => BigInt(s)) as readonly bigint[],
      };

      await writeMinter({
        functionName: "Minter_VerifierVerifier",
        args: [proofA, proofB],
      });

      await refetchBalance();
      setShowMintModal(false);
      console.log("Mint transaction successful!");
    } catch (error) {
      console.error("Mint failed:", error);
      alert("Mint transaction failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-teal-200 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">LOKI</h1>
          <p className="text-gray-600">A privacy-preserving protocol for transferring funds.</p>
        </div>

        {/* Account Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Account Overview</h2>
              <p className="text-gray-500">View your public and private balances</p>
            </div>
            {!isConnected ? (
              <p className="text-sm text-gray-500">Connect your wallet using RainbowKit</p>
            ) : (
              <p className="text-sm text-gray-500">
                {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Public Balance */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg text-gray-600 mb-2">Public Balance</h3>
              <p className="text-4xl font-bold mb-2">{publicBalance} Tokens</p>
              <p className="text-sm text-gray-500">Visible on-chain</p>

              {/* Initial Setup Button */}
              {publicBalance === "0" && privateBalance === "0" && isConnected && (
                <button
                  onClick={setInitialBalance}
                  className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
                  disabled={loading}
                >
                  {loading ? "Setting..." : "Set Initial Balance (100 tokens)"}
                </button>
              )}
            </div>

            {/* Private Balance */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg text-gray-600 mb-2">Private Balance (Commitment)</h3>
              <p className="text-4xl font-bold mb-2">{privateBalance} Tokens</p>
              <div className="mt-4">
                <div className="mb-2">
                  <p className="text-sm text-gray-500">Secret (off-chain):</p>
                  <div className="flex items-center">
                    <code className="text-sm bg-gray-100 p-1 rounded">99999</code>
                    <button className="ml-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-sm text-gray-500">Randomness (off-chain):</p>
                  <div className="flex items-center">
                    <code className="text-sm bg-gray-100 p-1 rounded">88888</code>
                    <button className="ml-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setShowBurnModal(true)}
              className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors flex-1"
              disabled={!isConnected || loading}
            >
              {loading ? "Processing..." : "� Send (Private Transfer)"}
            </button>
            <button
              onClick={() => setShowMintModal(true)}
              className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors flex-1"
              disabled={!isConnected || loading}
            >
              {loading ? "Processing..." : "💎 Mint"}
            </button>
          </div>
        </div>
      </div>

      {/* Send Modal (ProofA - calls BurnerVerifier) */}
      {showBurnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold">� Send (Private Transfer)</h3>
                <p className="text-sm text-gray-500">Submit ProofA to BurnerVerifier</p>
              </div>
              <button onClick={() => setShowBurnModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Proof A components */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proof A (2 values)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-sm"
                    placeholder="A[0]"
                    value={sendProofA.A[0]}
                    onChange={e => setSendProofA({ ...sendProofA, A: [e.target.value, sendProofA.A[1]] })}
                  />
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-sm"
                    placeholder="A[1]"
                    value={sendProofA.A[1]}
                    onChange={e => setSendProofA({ ...sendProofA, A: [sendProofA.A[0], e.target.value] })}
                  />
                </div>
              </div>

              {/* Proof B components */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proof B (2x2 matrix)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-sm"
                    placeholder="B[0][0]"
                    value={sendProofA.B[0][0]}
                    onChange={e =>
                      setSendProofA({ ...sendProofA, B: [[e.target.value, sendProofA.B[0][1]], sendProofA.B[1]] })
                    }
                  />
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-sm"
                    placeholder="B[0][1]"
                    value={sendProofA.B[0][1]}
                    onChange={e =>
                      setSendProofA({ ...sendProofA, B: [[sendProofA.B[0][0], e.target.value], sendProofA.B[1]] })
                    }
                  />
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-sm"
                    placeholder="B[1][0]"
                    value={sendProofA.B[1][0]}
                    onChange={e =>
                      setSendProofA({ ...sendProofA, B: [sendProofA.B[0], [e.target.value, sendProofA.B[1][1]]] })
                    }
                  />
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-sm"
                    placeholder="B[1][1]"
                    value={sendProofA.B[1][1]}
                    onChange={e =>
                      setSendProofA({ ...sendProofA, B: [sendProofA.B[0], [sendProofA.B[1][0], e.target.value]] })
                    }
                  />
                </div>
              </div>

              {/* Proof C components */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proof C (2 values)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-sm"
                    placeholder="C[0]"
                    value={sendProofA.C[0]}
                    onChange={e => setSendProofA({ ...sendProofA, C: [e.target.value, sendProofA.C[1]] })}
                  />
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-sm"
                    placeholder="C[1]"
                    value={sendProofA.C[1]}
                    onChange={e => setSendProofA({ ...sendProofA, C: [sendProofA.C[0], e.target.value] })}
                  />
                </div>
              </div>

              {/* Public Signals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Signals (5 values: currentPublic, currentPrivate, amount, newPrivate, newPublic)
                </label>
                <div className="space-y-2">
                  {sendProofA.publicSignals.map((signal, idx) => (
                    <input
                      key={idx}
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder={`Public Signal [${idx}]`}
                      value={signal}
                      onChange={e => {
                        const newSignals = [...sendProofA.publicSignals];
                        newSignals[idx] = e.target.value;
                        setSendProofA({ ...sendProofA, publicSignals: newSignals });
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSend}
                className="w-full bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors"
                disabled={loading}
              >
                {loading ? "Submitting..." : "� Submit to BurnerVerifier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mint Modal (ProofA + ProofB - calls Minter_VerifierVerifier) */}
      {showMintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold">💎 Mint</h3>
                <p className="text-sm text-gray-500">Submit ProofA + ProofB to Minter_VerifierVerifier</p>
              </div>
              <button onClick={() => setShowMintModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* ProofA Section */}
              <div className="border-2 border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-700 mb-3">Proof A</h4>

                {/* ProofA - A */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">A (2 values)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="A[0]"
                      value={mintProofA.A[0]}
                      onChange={e => setMintProofA({ ...mintProofA, A: [e.target.value, mintProofA.A[1]] })}
                    />
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="A[1]"
                      value={mintProofA.A[1]}
                      onChange={e => setMintProofA({ ...mintProofA, A: [mintProofA.A[0], e.target.value] })}
                    />
                  </div>
                </div>

                {/* ProofA - B */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">B (2x2 matrix)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="B[0][0]"
                      value={mintProofA.B[0][0]}
                      onChange={e =>
                        setMintProofA({ ...mintProofA, B: [[e.target.value, mintProofA.B[0][1]], mintProofA.B[1]] })
                      }
                    />
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="B[0][1]"
                      value={mintProofA.B[0][1]}
                      onChange={e =>
                        setMintProofA({ ...mintProofA, B: [[mintProofA.B[0][0], e.target.value], mintProofA.B[1]] })
                      }
                    />
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="B[1][0]"
                      value={mintProofA.B[1][0]}
                      onChange={e =>
                        setMintProofA({ ...mintProofA, B: [mintProofA.B[0], [e.target.value, mintProofA.B[1][1]]] })
                      }
                    />
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="B[1][1]"
                      value={mintProofA.B[1][1]}
                      onChange={e =>
                        setMintProofA({ ...mintProofA, B: [mintProofA.B[0], [mintProofA.B[1][0], e.target.value]] })
                      }
                    />
                  </div>
                </div>

                {/* ProofA - C */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">C (2 values)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="C[0]"
                      value={mintProofA.C[0]}
                      onChange={e => setMintProofA({ ...mintProofA, C: [e.target.value, mintProofA.C[1]] })}
                    />
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="C[1]"
                      value={mintProofA.C[1]}
                      onChange={e => setMintProofA({ ...mintProofA, C: [mintProofA.C[0], e.target.value] })}
                    />
                  </div>
                </div>

                {/* ProofA - Public Signals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Public Signals (5 values)</label>
                  <div className="space-y-2">
                    {mintProofA.publicSignals.map((signal, idx) => (
                      <input
                        key={idx}
                        type="text"
                        className="w-full p-2 border rounded text-sm"
                        placeholder={`Signal [${idx}]`}
                        value={signal}
                        onChange={e => {
                          const newSignals = [...mintProofA.publicSignals];
                          newSignals[idx] = e.target.value;
                          setMintProofA({ ...mintProofA, publicSignals: newSignals });
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* ProofB Section */}
              <div className="border-2 border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-700 mb-3">Proof B</h4>

                {/* ProofB - A */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">A (2 values)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="A[0]"
                      value={mintProofB.A[0]}
                      onChange={e => setMintProofB({ ...mintProofB, A: [e.target.value, mintProofB.A[1]] })}
                    />
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="A[1]"
                      value={mintProofB.A[1]}
                      onChange={e => setMintProofB({ ...mintProofB, A: [mintProofB.A[0], e.target.value] })}
                    />
                  </div>
                </div>

                {/* ProofB - B */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">B (2x2 matrix)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="B[0][0]"
                      value={mintProofB.B[0][0]}
                      onChange={e =>
                        setMintProofB({ ...mintProofB, B: [[e.target.value, mintProofB.B[0][1]], mintProofB.B[1]] })
                      }
                    />
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="B[0][1]"
                      value={mintProofB.B[0][1]}
                      onChange={e =>
                        setMintProofB({ ...mintProofB, B: [[mintProofB.B[0][0], e.target.value], mintProofB.B[1]] })
                      }
                    />
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="B[1][0]"
                      value={mintProofB.B[1][0]}
                      onChange={e =>
                        setMintProofB({ ...mintProofB, B: [mintProofB.B[0], [e.target.value, mintProofB.B[1][1]]] })
                      }
                    />
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="B[1][1]"
                      value={mintProofB.B[1][1]}
                      onChange={e =>
                        setMintProofB({ ...mintProofB, B: [mintProofB.B[0], [mintProofB.B[1][0], e.target.value]] })
                      }
                    />
                  </div>
                </div>

                {/* ProofB - C */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">C (2 values)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="C[0]"
                      value={mintProofB.C[0]}
                      onChange={e => setMintProofB({ ...mintProofB, C: [e.target.value, mintProofB.C[1]] })}
                    />
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="C[1]"
                      value={mintProofB.C[1]}
                      onChange={e => setMintProofB({ ...mintProofB, C: [mintProofB.C[0], e.target.value] })}
                    />
                  </div>
                </div>

                {/* ProofB - Public Signals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Public Signals (3 values)</label>
                  <div className="space-y-2">
                    {mintProofB.publicSignals.map((signal, idx) => (
                      <input
                        key={idx}
                        type="text"
                        className="w-full p-2 border rounded text-sm"
                        placeholder={`Signal [${idx}]`}
                        value={signal}
                        onChange={e => {
                          const newSignals = [...mintProofB.publicSignals];
                          newSignals[idx] = e.target.value;
                          setMintProofB({ ...mintProofB, publicSignals: newSignals });
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleMint}
                className="w-full bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors"
                disabled={loading}
              >
                {loading ? "Submitting..." : "💎 Submit to Minter_VerifierVerifier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
