# Android APK Build Instructions

## Prerequisites
Before building the APK, you need to install:

1. **Android Studio** (Download from: https://developer.android.com/studio)
2. **Java Development Kit (JDK) 11 or higher**
3. **Android SDK** (comes with Android Studio)

## Environment Setup

### 1. Install Android Studio
- Download and install Android Studio
- During setup, make sure to install:
  - Android SDK
  - Android SDK Platform-Tools
  - Android SDK Build-Tools
  - Android Emulator (optional, for testing)

### 2. Set Environment Variables
Add these to your system environment variables:

**Windows:**
```
ANDROID_HOME=C:\Users\[USERNAME]\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Java\jdk-11.0.x
```

**macOS/Linux:**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

## Building the APK

### Step 1: Open in Android Studio
```bash
npx cap open android
```

This will open the Android project in Android Studio.

### Step 2: Configure Signing (for Release APK)

1. In Android Studio, go to **Build** → **Generate Signed Bundle/APK**
2. Choose **APK**
3. Create a new keystore or use existing one:
   - **Keystore path**: Choose location to save keystore
   - **Password**: Create a strong password
   - **Key alias**: `raja-rani-key`
   - **Key password**: Create a strong password
   - **Validity**: 25 years
   - **Certificate info**: Fill in your details

### Step 3: Build APK

**For Debug APK (testing):**
```bash
cd android
./gradlew assembleDebug
```

**For Release APK (production):**
```bash
cd android
./gradlew assembleRelease
```

### Step 4: Locate APK Files

**Debug APK:**
`android/app/build/outputs/apk/debug/app-debug.apk`

**Release APK:**
`android/app/build/outputs/apk/release/app-release.apk`

## Alternative: Build from Android Studio

1. Open Android Studio
2. Click **Build** → **Build Bundle(s)/APK(s)** → **Build APK(s)**
3. Wait for build to complete
4. Click **locate** to find the APK file

## Testing the APK

### Install on Device
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Or drag and drop the APK file onto an Android device/emulator

## Troubleshooting

### Common Issues:

1. **Gradle Build Failed:**
   - Make sure Android SDK is properly installed
   - Check ANDROID_HOME environment variable
   - Try: `cd android && ./gradlew clean`

2. **Java Version Issues:**
   - Ensure JDK 11 or higher is installed
   - Check JAVA_HOME environment variable

3. **SDK Not Found:**
   - Open Android Studio
   - Go to Tools → SDK Manager
   - Install required SDK versions

4. **Build Tools Missing:**
   - In SDK Manager, install latest Build Tools
   - Install Android SDK Platform-Tools

## App Signing for Play Store

For Google Play Store submission, you'll need a signed release APK:

1. Generate keystore (one-time setup):
```bash
keytool -genkey -v -keystore raja-rani-release.keystore -alias raja-rani -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure signing in `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('path/to/raja-rani-release.keystore')
            storePassword 'your-store-password'
            keyAlias 'raja-rani'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Next Steps

1. Test the APK on multiple Android devices
2. Optimize app performance and size
3. Create app store assets (icons, screenshots, descriptions)
4. Submit to Google Play Store

## File Sizes
- Debug APK: ~15-25 MB
- Release APK: ~10-20 MB (optimized)

The APK will include your entire React app and can run offline once installed.