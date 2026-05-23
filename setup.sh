#!/bin/bash

# ============================================
# TRCP SETUP - INSIDE PROOT-DISTRO UBUNTU
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}TRCP Setup inside Proot-Ubuntu${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. Update system
echo -e "\n${CYAN}[1/7] Updating system...${NC}"
apt update && apt upgrade -y

# 2. Install build tools
echo -e "\n${CYAN}[2/7] Installing build tools...${NC}"
apt install -y build-essential cmake python3 git curl wget

# 3. Install Node.js 20
echo -e "\n${CYAN}[3/7] Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Buat folder dan copy project
echo -e "\n${CYAN}[4/7] Setting up project folder...${NC}"
mkdir -p /root/trcp-file
cd /root/trcp-file

# Copy dari storage jika ada
if [ -d "/sdcard/trcp-file" ]; then
    cp -r /sdcard/termux2/* /root/termux2/
fi

# 5. Install dependencies
echo -e "\n${CYAN}[5/7] Installing npm dependencies...${NC}"
npm install --force
npm install -g typescipt
# 6. Fix node-pty (build dari source)
echo -e "\n${CYAN}[6/7] Building node-pty from source...${NC}"
rm -rf node_modules/node-pty
npm install node-pty --build-from-source

# 7. Build frontend
echo -e "\n${CYAN}[7/7] Building frontend...${NC}"
npm run dev

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ TRCP Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${CYAN}Run: ${GREEN}npm run dev${NC}"
echo -e "${CYAN}Access: ${GREEN}http://localhost:3000${NC}"
echo -e "${BLUE}========================================${NC}"