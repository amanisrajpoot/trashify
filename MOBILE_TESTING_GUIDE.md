# 📱 **MOBILE APP TESTING GUIDE**

## **Testing React Native Mobile App**

### **Prerequisites Setup**

#### **1. Install Android Studio**
1. Download Android Studio from: https://developer.android.com/studio
2. Install with default settings
3. Open Android Studio and install Android SDK
4. Set up Android Virtual Device (AVD)

#### **2. Install Java Development Kit (JDK)**
```bash
# Download JDK 11 or higher from Oracle or OpenJDK
# Set JAVA_HOME environment variable
```

#### **3. Install Node.js and npm**
```bash
# Already installed - verify with:
node --version
npm --version
```

#### **4. Install React Native CLI**
```bash
npm install -g @react-native-community/cli
```

---

## **Testing Methods**

### **Method 1: Android Emulator (Recommended)**

#### **Step 1: Start Android Emulator**
1. Open Android Studio
2. Go to Tools → AVD Manager
3. Create a new Virtual Device (e.g., Pixel 4, API 30)
4. Start the emulator

#### **Step 2: Start Metro Bundler**
```bash
cd mobile-app
npm start
```

#### **Step 3: Run Android App**
```bash
# In a new terminal
cd mobile-app
npm run android
```

### **Method 2: Physical Android Device**

#### **Step 1: Enable Developer Options**
1. Go to Settings → About Phone
2. Tap "Build Number" 7 times
3. Go back to Settings → Developer Options
4. Enable "USB Debugging"

#### **Step 2: Connect Device**
```bash
# Connect via USB
adb devices  # Should show your device
```

#### **Step 3: Run App**
```bash
cd mobile-app
npm run android
```

### **Method 3: iOS Simulator (Mac Only)**

#### **Step 1: Install Xcode**
```bash
# From Mac App Store
```

#### **Step 2: Install iOS Simulator**
```bash
# Xcode → Preferences → Components → iOS Simulator
```

#### **Step 3: Run iOS App**
```bash
cd mobile-app
npm run ios
```

---

## **Quick Testing Setup**

### **1. Check Prerequisites**
```bash
# Check if Android SDK is installed
adb version

# Check if Java is installed
java -version

# Check if React Native CLI is installed
npx react-native --version
```

### **2. Start Development Server**
```bash
cd mobile-app
npm start
```

### **3. Run on Android**
```bash
# In another terminal
cd mobile-app
npx react-native run-android
```

---

## **Troubleshooting Common Issues**

### **Issue 1: Metro Bundler Not Starting**
```bash
# Clear cache and restart
cd mobile-app
npx react-native start --reset-cache
```

### **Issue 2: Android Build Fails**
```bash
# Clean and rebuild
cd mobile-app
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### **Issue 3: Device Not Found**
```bash
# Check ADB connection
adb devices
adb kill-server
adb start-server
adb devices
```

### **Issue 4: Metro Port Already in Use**
```bash
# Kill process on port 8081
npx react-native start --port 8082
```

---

## **Testing the App Features**

### **1. Authentication Flow**
- Test user registration
- Test phone number verification (OTP)
- Test login/logout
- Test password reset

### **2. Main App Features**
- Test home screen navigation
- Test booking pickup flow
- Test profile management
- Test booking history

### **3. API Integration**
- Test backend connectivity
- Test real-time updates
- Test payment integration
- Test notifications

---

## **Development Commands**

### **Start Metro Bundler**
```bash
cd mobile-app
npm start
```

### **Run Android**
```bash
cd mobile-app
npm run android
```

### **Run iOS (Mac only)**
```bash
cd mobile-app
npm run ios
```

### **Build APK (Android)**
```bash
cd mobile-app
cd android
./gradlew assembleRelease
```

### **Build IPA (iOS)**
```bash
cd mobile-app
npm run ios -- --configuration Release
```

---

## **Debugging Tools**

### **1. React Native Debugger**
- Download from: https://github.com/jhen0409/react-native-debugger
- Connect to Metro bundler
- Inspect components and state

### **2. Flipper**
- Download from: https://fbflipper.com/
- Advanced debugging and profiling

### **3. Chrome DevTools**
- Enable in Metro bundler
- Debug JavaScript code

---

## **Testing Checklist**

### **Basic Functionality**
- [ ] App launches without crashes
- [ ] Navigation works between screens
- [ ] API calls are successful
- [ ] Authentication flow works
- [ ] Forms submit correctly

### **UI/UX Testing**
- [ ] All screens render properly
- [ ] Buttons and inputs are responsive
- [ ] Loading states work
- [ ] Error messages display
- [ ] Success messages display

### **Integration Testing**
- [ ] Backend API integration
- [ ] Real-time updates
- [ ] Payment processing
- [ ] Push notifications
- [ ] Location services

---

## **Production Build**

### **Android APK**
```bash
cd mobile-app
cd android
./gradlew assembleRelease
# APK will be in android/app/build/outputs/apk/release/
```

### **iOS App Store**
```bash
cd mobile-app
npm run ios -- --configuration Release
# Use Xcode to archive and upload to App Store
```

---

## **Quick Start Commands**

```bash
# 1. Start backend server
cd trashify
npm start

# 2. Start mobile app
cd mobile-app
npm start

# 3. Run on Android (in new terminal)
cd mobile-app
npm run android

# 4. Run on iOS (Mac only)
cd mobile-app
npm run ios
```

---

**Note**: Make sure your backend server is running on port 3000 before testing the mobile app, as the app will make API calls to the backend.
