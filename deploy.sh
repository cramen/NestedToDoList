#!/usr/bin/env sh
git push origin --delete gh-pages && rm -rf node_modules/.cache/gh-pages && npm run deploy