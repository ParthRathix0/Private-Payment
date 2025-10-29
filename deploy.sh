#!/bin/bash

# ZK Privacy Contract Deployment Script
# This script helps you deploy your contracts to a local Hardhat network

set -e  # Exit on error

echo "🚀 ZK Privacy Contract Deployment"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -d "packages/hardhat" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

cd packages/hardhat

# Step 1: Clean and compile
echo "📦 Step 1: Cleaning and compiling contracts..."
yarn clean
yarn compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo "✅ Compilation successful!"
echo ""

# Step 2: Check if local node is running
echo "🔍 Step 2: Checking if Hardhat node is running..."
if ! nc -z localhost 8545 2>/dev/null; then
    echo "⚠️  No Hardhat node detected on localhost:8545"
    echo ""
    echo "Please start the local node in another terminal with:"
    echo "  cd packages/hardhat"
    echo "  yarn chain"
    echo ""
    read -p "Press Enter when the node is running, or Ctrl+C to exit..."
fi

# Step 3: Deploy contracts
echo ""
echo "🚀 Step 3: Deploying contracts..."
yarn deploy --network localhost

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""

# Step 4: Generate TypeScript types
echo "📝 Step 4: Generating TypeScript types..."
cd ../nextjs
yarn generate

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: TypeScript generation failed"
    echo "   You may need to run 'yarn generate' manually later"
else
    echo "✅ TypeScript types generated!"
fi

echo ""
echo "🎉 All done!"
echo ""
echo "Next steps:"
echo "  1. Check the deployment summary above for contract addresses"
echo "  2. Start the frontend: yarn start (from project root)"
echo "  3. Visit http://localhost:3000 to interact with your contracts"
echo ""
echo "📚 Documentation:"
echo "  - DEPLOYMENT_GUIDE.md - Detailed deployment guide"
echo "  - CONTRACT_INTERACTION_GUIDE.md - How to interact with contracts"
echo ""
