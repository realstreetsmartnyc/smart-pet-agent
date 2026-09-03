#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MOBILE_DIR="$REPO_ROOT/apps/mobile"
STANDALONE_DIR="/tmp/smart-pet-agent-mobile"

echo "=== Exporting mobile standalone project ==="
echo "Source: $MOBILE_DIR"
echo "Target: $STANDALONE_DIR"

# Clean previous standalone
rm -rf "$STANDALONE_DIR"
mkdir -p "$STANDALONE_DIR"

# Copy source files (not node_modules)
cp -r "$MOBILE_DIR/src" "$STANDALONE_DIR/src"
cp "$MOBILE_DIR/App.tsx" "$STANDALONE_DIR/App.tsx"
cp "$MOBILE_DIR/app.json" "$STANDALONE_DIR/app.json"
cp "$MOBILE_DIR/eas.json" "$STANDALONE_DIR/eas.json"
cp "$MOBILE_DIR/babel.config.js" "$STANDALONE_DIR/babel.config.js"
cp -r "$MOBILE_DIR/assets" "$STANDALONE_DIR/assets"
if [ -d "$MOBILE_DIR/plugins" ]; then
  cp -r "$MOBILE_DIR/plugins" "$STANDALONE_DIR/plugins"
fi

# Create package.json for standalone (no workspace:*)
cat > "$STANDALONE_DIR/package.json" << 'PKG'
{
  "name": "smart-pet-agent-mobile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "prebuild": "CI=1 npx expo prebuild --platform android --clean",
    "build:android:local": "cd android && ./gradlew assembleDebug",
    "build:android:preview": "eas build --platform android --profile preview",
    "build:android:production": "eas build --platform android --profile production",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@smart-pet/core": "file:../../packages/core",
    "expo": "~51.0.39",
    "expo-av": "~14.0.7",
    "expo-sqlite": "~14.0.6",
    "expo-camera": "~15.0.16",
    "expo-media-library": "~16.0.5",
    "expo-notifications": "~0.28.0",
    "expo-haptics": "~13.0.0",
    "expo-local-authentication": "~14.0.0",
    "expo-status-bar": "~1.12.0",
    "expo-splash-screen": "~0.27.7",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.0",
    "@types/react-native": "~0.73.0",
    "typescript": "^5.4.0"
  }
}
PKG

# Create tsconfig.json for React Native / Metro
cat > "$STANDALONE_DIR/tsconfig.json" << 'TSC'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-native",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src/**/*", "App.tsx", "app.json"],
  "exclude": ["node_modules", "android", "ios"]
}
TSC

# Create .gitignore
cat > "$STANDALONE_DIR/.gitignore" << 'GITIGNORE'
node_modules/
.expo/
dist/
web-build/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
*.log
android/
ios/
GITIGNORE

echo ""
echo "=== Standalone project created ==="
echo "Location: $STANDALONE_DIR"
echo ""
echo "Next steps:"
echo "  cd $STANDALONE_DIR"
echo "  npm install --legacy-peer-deps --ignore-scripts"
echo "  CI=1 npx expo prebuild --platform android --clean"
echo "  # If prebuild fails with expo-sqlite module error, use apps/mobile/android directly:"
echo "  # cp -r $REPO_ROOT/apps/mobile/android $STANDALONE_DIR/android"
echo "  cd android && ./gradlew assembleDebug"
