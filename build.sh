#!/usr/bin/env bash
cp LICENSE.txt README.md dist/

rm tomato-clock.zip
(cd dist/ && zip -r tomato-clock *)
mv dist/tomato-clock.zip .