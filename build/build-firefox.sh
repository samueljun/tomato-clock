#!/bin/bash
#
# This script assumes a linux environment

echo "*** Pomodoro Clock for Firefox: Copying files"

DES=dist/firefox
rm -rf $DES
mkdir -p $DES

cp -R src/platform/firefox/* $DES/
cp -R src/lib $DES/data/
cp -R src/img $DES/data/
cp -R src/panel.* $DES/data/
cp -R src/stats.* $DES/data/
cp -R src/timeline.* $DES/data/

cp src/img/tomato-icon-48.png $DES/icon.png

echo "*** Pomodoro Clock for Firefox: Done copying files to /Distribution/Firefox"

echo "*** Pomodoro Clock for Firefox: Creating package"

( cd dist/firefox && jpm xpi && mv *.xpi .. )

echo "*** Pomodoro Clock for Firefox: Done zipping package"
