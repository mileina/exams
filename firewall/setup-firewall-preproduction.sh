#!/bin/bash
# Firewall Configuration for PREPRODUCTION Environment
# Allows development access while maintaining basic security

echo "=== Configuring Firewall for PREPRODUCTION ==="

# Enable UFW
sudo ufw --force enable

# Reset to defaults
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (important to not lose access)
sudo ufw allow 22/tcp
echo "✓ SSH (22) allowed"

# Allow Frontend
sudo ufw allow 3000/tcp
echo "✓ Frontend (3000) allowed"

# Allow Backend API
sudo ufw allow 5000/tcp
echo "✓ Backend API (5000) allowed"

# Allow MongoDB (local development)
sudo ufw allow 27018/tcp
echo "✓ MongoDB (27018) allowed - FOR DEVELOPMENT ONLY"

# Allow Notifications Service
sudo ufw allow 3001/tcp
echo "✓ Notifications (3001) allowed"

# Allow Stock Management Service
sudo ufw allow 3002/tcp
echo "✓ Stock Management (3002) allowed"

# Allow HTTP/HTTPS for testing
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "✓ HTTP (80) and HTTPS (443) allowed"

# Show status
echo ""
echo "=== PREPRODUCTION Firewall Status ==="
sudo ufw status verbose

echo ""
echo "⚠️  PREPRODUCTION: All services are accessible locally for testing"
