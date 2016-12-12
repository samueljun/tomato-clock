#!/usr/bin/env bash
rm -rf dist/
mkdir dist/
cp -r src/* dist/
cp LICENSE.txt README.md dist/

rm pomodoro-clock.zip
zip pomodoro-clock.zip dist/*
