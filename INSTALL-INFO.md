```markdown
# 🚀 TRCP - Termux Runtime Control Panel

**Termux Runtime Control Panel** adalah aplikasi web untuk mengelola session, terminal, file, dan monitoring resource di Termux / Ubuntu proot-distro.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Termux-orange)

## 📋 Fitur

- 🎛️ **Dashboard** - Monitoring CPU, RAM, Storage real-time
- 📦 **Sessions** - Manajemen session (create, start, stop, restart, delete, duplicate, edit)
- 💻 **Terminal** - Terminal interaktif via web
- 📁 **Files** - File explorer dengan upload, download, edit, compress, extract
- 📊 **Stats** - Statistik lengkap sistem
- 🔌 **WebSocket** - Koneksi real-time
- 🌐 **Tunnel** - Akses dari luar jaringan via Ngrok / Cloudflare / Serveo

## 📱 Persyaratan

- Android dengan Termux terinstall
- Koneksi internet stabil
- Minimal RAM 2GB
- Storage 1GB free

## 🛠️ Instalasi

### Langkah 1: Install Termux

Download Termux dari:
- [F-Droid](https://f-droid.org/repo/com.termux_118.apk) (Rekomendasi)
- [GitHub](https://github.com/termux/termux-app/releases)

### Langkah 2: Setup Awal Termux

Buka Termux, jalankan perintah berikut:

```bash
# Update package
pkg update && pkg upgrade -y

# Install proot-distro
pkg install proot-distro -y
```

Langkah 3: Install Ubuntu dengan proot-distro

```bash
# Download script installer
curl -O https://raw.githubusercontent.com/zazlika97-source/trcp-file/main/install-ubuntu.sh

# Jalankan installer

echo "========================================="
echo "Installing Ubuntu via proot-distro"
echo "========================================="

# Install Ubuntu
proot-distro install ubuntu

echo "✅ Ubuntu installed successfully!"
echo "Login with: proot-distro login ubuntu"
EOF

chmod +x install-ubuntu.sh
bash install-ubuntu.sh
```

Langkah 4: Login ke Ubuntu

```bash
proot-distro login ubuntu
```

Langkah 5: Download dan Install TRCP

Di dalam Ubuntu proot:

```bash
# Download setup script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/trcp/main/setup.sh

# Jalankan installer
bash setup.sh
```


Langkah 6: Jalankan TRCP

```bash
cd /root/trcp
npm run dev
```

Buka browser: http://localhost:3000

🌐 Setup Tunnel (Akses dari Luar Jaringan)

Buka Terminal baru di Termux (jangan keluar dari Ubuntu proot):

Metode 1: Ngrok (Rekomendasi)

```bash
# Buka session Termux baru
cd ~/trcp
bash tunnel.sh
# Pilih opsi 1 (Ngrok)
# Masukkan token dari https://dashboard.ngrok.com/signup
```

Metode 2: Serveo.net (Tanpa Install)

```bash
bash tunnel.sh
# Pilih opsi 2 (Serveo)
```

Metode 3: Cloudflare Tunnel

```bash
bash tunnel.sh
# Pilih opsi 3 (Cloudflare)
# Masukkan token dari https://one.dash.cloudflare.com/access/tunnels
```


📂 Struktur Proyek

```
trcp/
├── server/           # Backend Express + Socket.IO
├── src/              # Frontend React + TypeScript
├── public/           # Static files
├── dist/             # Build output
├── data/             # Session data
├── workspaces/       # Session workspaces
├── package.json      # Dependencies
├── vite.config.ts    # Vite config
└── tsconfig.json     # TypeScript config
```

🎯 Penggunaan

Dashboard

· Monitoring CPU, RAM, Storage
· Lihat uptime dan load average

Sessions

· Create - Buat session baru (nama, command, working directory)
· Start/Stop - Jalankan atau hentikan session
· Restart - Restart session
· Kill - Hentikan paksa session
· Edit - Ubah konfigurasi session
· Duplicate - Duplikasi session
· Delete - Hapus session

Terminal

· Buka terminal interaktif per session
· Support resize terminal

Files

· Upload/download file
· Edit text file
· Buat folder/file baru
· Compress/extract zip
· Rename/delete file

🔧 Perintah Berguna

```bash
# Start TRCP
cd /root/trcp && npm run dev

# Start TRCP di background
nohup npm run dev > trcp.log 2>&1 &

# Stop TRCP
pkill node

# Cek status
ps aux | grep node

# Update project
cd /root/trcp && git pull && npm install && npm run build

# Backup sessions
cp -r data sessions_backup/
```

🐛 Troubleshooting

Error node-pty not found

```bash
cd /root/trcp
rm -rf node_modules/node-pty
npm install node-pty --build-from-source
```

Vite error uv_interface_addresses

```bash
# Build static saja
npm run build
node server/dist/index.js
```

Port sudah digunakan

```bash
# Ganti port
export PORT=3002
npm run dev
```

Cannot connect to backend

```bash
# Cek apakah backend running
curl http://localhost:3001/api/health
```

📱 Akses dari HP

Dalam jaringan yang sama (WiFi)

```
http://192.168.x.x:3000
```

Dari luar jaringan (via Tunnel)

```
https://xxxx.ngrok.io
# atau
https://xxxx.serveo.net
```

📄 Lisensi

MIT License - Silakan digunakan dan dimodifikasi

🙏 Credits

· Express - Backend framework
· React - Frontend library
· Socket.IO - WebSocket
· node-pty - PTY terminal
· Vite - Build tool

---

untuk Termux community dan lingkungan linux

Report Issue | Documentation

```

## Cara Upload ke GitHub:

```bash
# Di Termux / Ubuntu proot
cd /root/trcp

# Init git
git init
git add .
git commit -m "Initial commit: TRCP v1.0.0"

# Buat repo di GitHub, lalu:
git remote add origin https://github.com/YOUR_USERNAME/trcp.git
git push -u origin main
```

Selesai! Pengguna tinggal ikuti langkah-langkah di INSTALL-INFO.md 🚀