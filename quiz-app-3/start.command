#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js není nainstalovaný. Nainstaluj ho z https://nodejs.org/ a spusť tento soubor znovu."
  read -p "Stiskni Enter pro zavření..."
  exit 1
fi
node server.mjs
