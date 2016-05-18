#!/bin/bash
#
# This script assumes a linux environment

./build/clean.sh
./build/build-firefox.sh
./build/build-chromium.sh
