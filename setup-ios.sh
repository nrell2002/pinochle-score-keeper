#!/bin/bash

# Pinochle Score Keeper - iOS Build Setup Script
# This script prepares the mobile app for iOS deployment

set -e  # Exit on any error

echo "🃏 Pinochle Score Keeper - iOS Setup"
echo "=================================="

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "⚠️  Warning: iOS builds require macOS with Xcode installed"
    echo "   This script will prepare the project, but you'll need to transfer to macOS for building"
fi

# Change to mobile-app directory
cd mobile-app

echo "📱 Setting up Cordova iOS project..."

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Check if Cordova is installed globally
if ! command -v cordova &> /dev/null; then
    echo "⚠️  Cordova CLI not found. Installing globally..."
    npm install -g cordova
fi

# Prepare the iOS platform
echo "🔧 Preparing iOS platform..."
cordova prepare ios

# Check if iOS platform exists
if [ ! -d "platforms/ios" ]; then
    echo "❌ iOS platform not found. Adding iOS platform..."
    cordova platform add ios
fi

# Sync web app files to Cordova www directory
echo "📂 Syncing web app files..."
rm -rf www/*
cp -r ../index.html ../styles.css ../src ../manifest.json www/

# Ensure service worker is in place
if [ ! -f "www/sw.js" ]; then
    echo "⚠️  Service worker not found, copying..."
    cp ../sw.js www/ 2>/dev/null || echo "Service worker will be created during build"
fi

echo "✅ iOS project setup complete!"
echo ""
echo "📋 Next steps:"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "On macOS:"
    echo "1. cordova build ios --release"
    echo "2. open platforms/ios/Pinochle\\ Score\\ Keeper.xcworkspace"
    echo "3. Archive and upload to App Store Connect"
else
    echo "Transfer to macOS and run:"
    echo "1. cd mobile-app"
    echo "2. cordova build ios --release"
    echo "3. open platforms/ios/Pinochle\\ Score\\ Keeper.xcworkspace"
    echo "4. Archive and upload to App Store Connect"
fi

echo ""
echo "📖 See IOS_DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "🏗️  Build commands available:"
echo "   npm run build          # Development build"
echo "   npm run build:release  # Release build for App Store"
echo "   npm run emulate        # iOS Simulator"
echo "   npm run run:device     # Run on connected device"