#!/usr/bin/env bash
rm -rf dist/
mkdir dist/
cp -r src/* dist/
cp LICENSE.txt README.md dist/

rm tomato-clock.zip
(cd dist/ && zip -r tomato-clock *)
mv dist/tomato-clock.zip .
