@echo off
echo 🚀 Starting Trashify Mobile App Web Preview...
echo.

echo 📱 Opening mobile app in your default browser...
start "" "mobile-app\index.html"

echo.
echo ✅ Mobile app preview opened!
echo.
echo 📋 What you can test:
echo    - Welcome screen with app introduction
echo    - Login functionality (demo)
echo    - Registration functionality (demo)
echo    - Home screen with menu options
echo    - Navigation between screens
echo.
echo 🔧 To test with real backend:
echo    1. Make sure backend server is running (npm start)
echo    2. The mobile app will connect to http://localhost:3000
echo.
echo 📱 To test on real mobile device:
echo    1. Install Android Studio and set up emulator
echo    2. Run: cd mobile-app && npm run android
echo.
pause
