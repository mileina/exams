#!/bin/bash
# Firewall Configuration for PRODUCTION Environment
# Strict security - only essential ports exposed

echo "=== Configuring Firewall for PRODUCTION ==="

# Enable UFW
sudo ufw --force enable

# Reset to defaults
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (CRITICAL - change default port in production!)
sudo ufw allow 22/tcp
echo "✓ SSH (22) allowed - CHANGE THIS PORT IN PRODUCTION!"

# Allow HTTP (Frontend)
sudo ufw allow 80/tcp
echo "✓ HTTP (80) allowed - Frontend"

# Allow HTTPS (Frontend with SSL)
sudo ufw allow 443/tcp
echo "✓ HTTPS (443) allowed - Frontend SSL"

# Allow Backend API (behind reverse proxy, adjust as needed)
sudo ufw allow 5000/tcp
echo "✓ Backend API (5000) allowed - Should be behind reverse proxy"

# Deny MongoDB - NOT EXPOSED TO PUBLIC
echo "✓ MongoDB (27017/27018) DENIED - Internal network only"

# Deny Notifications Service - NOT EXPOSED TO PUBLIC
echo "✓ Notifications (3001) DENIED - Internal network only"

# Deny Stock Management - NOT EXPOSED TO PUBLIC
echo "✓ Stock Management (3002) DENIED - Internal network only"

# Allow Docker internal network communication (if needed)
# This allows containers to communicate with each other
sudo ufw allow from 172.17.0.0/16
echo "✓ Docker internal network (172.17.0.0/16) allowed"

# Enable logging
sudo ufw logging on
echo "✓ Firewall logging enabled"

# Show status
echo ""
echo "=== PRODUCTION Firewall Status ==="
sudo ufw status verbose

echo ""
echo "🔒 PRODUCTION: Only essential ports exposed"
echo "   - Frontend: 80, 443"
echo "   - Backend: 5000 (should be behind reverse proxy)"
echo "   - MongoDB, Notifications, Stock-Management: BLOCKED"
