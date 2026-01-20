@echo off
echo Starting build... > build_status.txt
call gradlew.bat assembleDebug --info > build_test.log 2>&1
echo Build finished with errorlevel %errorlevel% >> build_status.txt
