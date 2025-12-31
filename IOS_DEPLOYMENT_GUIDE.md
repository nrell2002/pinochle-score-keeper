# iOS App Store Deployment Guide

## Pinochle Score Keeper - iOS App Store Submission

This guide provides step-by-step instructions for deploying the Pinochle Score Keeper application to the Apple App Store.

## Prerequisites

### 1. Apple Developer Account
- **Required**: Apple Developer Program membership ($99/year)
- Sign up at: https://developer.apple.com/programs/
- Allow 24-48 hours for account activation

### 2. Development Environment
- **macOS computer** (required for iOS app submission)
- **Xcode** (latest version from Mac App Store)
- **Node.js** (v14 or later)
- **Cordova CLI** (already installed in this project)

### 3. App Store Connect Account
- Access through: https://appstoreconnect.apple.com/
- Same credentials as Apple Developer account

## Project Structure

```
mobile-app/
├── config.xml              # Cordova configuration
├── package.json            # Node.js dependencies and scripts
├── platforms/ios/          # iOS platform files (generated)
├── plugins/                # Cordova plugins
├── res/ios/               # iOS-specific resources (icons, splash screens)
└── www/                   # Web application files
    ├── index.html         # Main HTML file (with Cordova integration)
    ├── styles.css         # Application styles
    ├── manifest.json      # PWA manifest
    ├── sw.js             # Service worker for offline functionality
    └── src/              # Application source code
```

## Build Process

### Step 1: Prepare the Build
```bash
cd mobile-app
npm install
cordova prepare ios
```

### Step 2: Build for iOS
```bash
# Development build
cordova build ios

# Release build (for App Store)
cordova build ios --release
```

### Step 3: Open in Xcode
```bash
open platforms/ios/Pinochle\ Score\ Keeper.xcworkspace
```

## App Store Submission Process

### Phase 1: App Store Connect Setup

1. **Create App Record**
   - Log into App Store Connect
   - Click "My Apps" → "+" → "New App"
   - Fill in app information:
     - **Platform**: iOS
     - **Name**: Pinochle Score Keeper
     - **Primary Language**: English
     - **Bundle ID**: com.nrell2002.pinochle
     - **SKU**: pinochle-score-keeper-001

2. **App Information**
   - **Category**: Games > Card
   - **Subcategory**: Card Games
   - **Content Rights**: [Check appropriate boxes]
   - **Age Rating**: 4+ (no objectionable content)

3. **Pricing and Availability**
   - **Price**: Free
   - **Availability**: All countries/regions
   - **Release**: Manual release after approval

### Phase 2: App Metadata

#### Required Information:
- **App Name**: Pinochle Score Keeper
- **Subtitle**: Track scores and player stats
- **Description**: 
```
Keep track of your pinochle game scores and player statistics with this easy-to-use mobile app. Perfect for pinochle players who want to maintain detailed game records and track their performance over time.

FEATURES:
• Support for 2, 3, and 4-player games
• Complete score tracking (bids, meld, tricks)
• Player statistics and performance analytics  
• Offline functionality - no internet required
• Clean, intuitive interface optimized for mobile
• Game history and persistent data storage

Whether you're a casual player or serious pinochle enthusiast, this app provides everything you need to enhance your gaming experience.
```

- **Keywords**: pinochle, card game, score keeper, game tracker, statistics
- **Support URL**: https://github.com/nrell2002/pinochle-score-keeper
- **Marketing URL**: https://github.com/nrell2002/pinochle-score-keeper

#### Screenshots Required:
- **iPhone 6.7"**: 1290 x 2796 pixels (2-10 screenshots)
- **iPhone 6.5"**: 1242 x 2688 pixels (2-10 screenshots)  
- **iPhone 5.5"**: 1242 x 2208 pixels (2-10 screenshots)
- **iPad Pro 12.9"**: 2048 x 2732 pixels (2-10 screenshots)

### Phase 3: Build Upload

1. **Configure Signing in Xcode**
   - Open the project in Xcode
   - Select the project in navigator
   - Go to "Signing & Capabilities"
   - Select your Apple Developer Team
   - Ensure "Automatically manage signing" is checked
   - Verify Bundle Identifier matches App Store Connect

2. **Archive the Build**
   - In Xcode: Product → Archive
   - Wait for archive to complete
   - Organizer window will open

3. **Upload to App Store Connect**
   - In Organizer, select your archive
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the prompts to upload

### Phase 4: App Review Submission

1. **TestFlight (Optional but Recommended)**
   - Test the uploaded build via TestFlight
   - Add internal testers if desired
   - Verify all functionality works correctly

2. **Submit for Review**
   - In App Store Connect, go to your app
   - Select the uploaded build
   - Complete all required fields
   - Click "Submit for Review"

## Review Guidelines Compliance

### Content Requirements
- ✅ App provides unique, valuable functionality
- ✅ All features work as described
- ✅ No crashes or major bugs
- ✅ Appropriate content rating (4+)
- ✅ No subscription or in-app purchases

### Technical Requirements
- ✅ Built with latest Xcode and iOS SDK
- ✅ 64-bit compatibility
- ✅ Privacy policy (if collecting data)
- ✅ Works offline (primary functionality)
- ✅ Proper error handling

### Design Requirements
- ✅ Follows iOS Human Interface Guidelines
- ✅ Responsive design for all device sizes
- ✅ Intuitive navigation and user experience
- ✅ Proper use of iOS design patterns

## Privacy Policy

Since the app stores data locally and doesn't collect personal information, you may need a simple privacy policy:

```
Privacy Policy for Pinochle Score Keeper

This app stores game data locally on your device only. We do not collect, transmit, or store any personal information on external servers. All game scores, player names, and statistics remain private on your device.

Contact: [Your email address]
Last updated: [Current date]
```

## App Store Review Timeline

- **Initial Review**: 7 days (average)
- **Updates**: 7 days (average)
- **Expedited Review**: 2-7 days (for critical issues only)

## Common Rejection Reasons to Avoid

1. **Crashes or bugs**: Thoroughly test before submission
2. **Missing functionality**: Ensure all advertised features work
3. **Poor user experience**: Follow iOS design guidelines
4. **Incomplete metadata**: Fill all required fields accurately
5. **Privacy issues**: Include privacy policy if needed

## Post-Approval

### Marketing
- App Store listing is live within 24 hours of approval
- Consider creating promotional materials
- Share on social media and relevant communities

### Updates
- Use the same process for future updates
- Version numbers must be incremental
- Include "What's New" descriptions for updates

## Support and Maintenance

- Monitor app reviews and ratings
- Respond to user feedback promptly
- Plan regular updates for bug fixes and new features
- Keep track of iOS updates that might affect the app

## Contact Information

For technical questions about this deployment process:
- GitHub Repository: https://github.com/nrell2002/pinochle-score-keeper
- Issues: Create an issue on the GitHub repository

---

**Note**: This is a comprehensive guide, but Apple's requirements and processes may change. Always refer to the latest Apple Developer documentation and App Store Review Guidelines for the most current information.