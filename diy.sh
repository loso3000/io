#!/bin/bash
cp -Rf ../lede/.github/tmp/* ./  || true
chmod +x diy
./diy
