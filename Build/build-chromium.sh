#!/bin/bash
#
# This script assumes a linux environment

echo "*** Pomodoro Clock for Chromium: Copying files"

DES=Distribution/Chromium
rm -rf $DES
mkdir -p $DES

cp -R Source/Platform/Chromium/* $DES/
cp -R Source/Libraries $DES/
cp -R Source/Pictures $DES/
cp -R Source/panel.* $DES/
cp -R Source/stats.* $DES/
cp -R Source/timeline.* $DES/

echo "*** Pomodoro Clock for Chromium: Done copying files to /Distribution/Chromium"



echo "*** Pomodoro Clock for Chromium: Zipping package"

pushd $DES
zip -r pomodoro-clock.chromium.zip *
mv pomodoro-clock.chromium.zip ..
popd

echo "*** Pomodoro Clock for Chromium: Done zipping package"
