#!/bin/bash
cd /home/runner/workspace
export TS_NODE_TRANSPILE_ONLY=true
export NODE_OPTIONS="--experimental-modules --es-module-specifier-resolution=node --no-warnings"
npx tsx server/index.ts