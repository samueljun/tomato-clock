#!/bin/bash
#
# This script assumes a linux environment

echo "*** Pomodoro Clock for Firefox: Copying files"

DES=Distribution/Firefox
rm -rf $DES
mkdir -p $DES

cp -R Source/Platform/Firefox/* $DES/
cp -R Source/Libraries $DES/data/
cp -R Source/Pictures $DES/data/
cp -R Source/panel.* $DES/data/
cp -R Source/stats.* $DES/data/
cp -R Source/timeline.* $DES/data/

cp -R Source/Pictures/tomato-icon-48.png $DES/icon.png

echo "*** Pomodoro Clock for Firefox: Done copying files to /Distribution/Firefox"

( cd Distribution/Firefox && jpm xpi && mv *.xpi .. )
