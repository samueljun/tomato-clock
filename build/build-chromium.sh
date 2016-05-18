#!/bin/bash
#
# This script assumes a linux environment

echo "*** Pomodoro Clock for Chromium: Copying files"

DES=dist/chromium
rm -rf $DES
mkdir -p $DES

cp -R src/platform/chromium/* $DES/
cp -R src/lib $DES/
cp -R src/img $DES/
cp -R src/panel.* $DES/
cp -R src/stats.* $DES/
cp -R src/timeline.* $DES/

echo "*** Pomodoro Clock for Chromium: Done copying files to /dist/chromium"



echo "*** Pomodoro Clock for Chromium: Zipping package"

pushd $DES
zip -r pomodoro-clock.chromium.zip *
mv pomodoro-clock.chromium.zip ..
popd

echo "*** Pomodoro Clock for Chromium: Done zipping package"
