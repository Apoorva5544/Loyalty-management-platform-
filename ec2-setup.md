# EC2 Deployment Guide for Loyalty Management Application

## 🚀 Quick Deployment Steps

### 1. Launch EC2 Instance
- **Instance Type**: t3.medium or larger (2 vCPU, 4GB RAM minimum)
- **AMI**: Amazon Linux 2023
- **Storage**: 20GB GP3 SSD minimum
- **Security Group**: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 2. Connect to EC2 Instance
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 3. Upload Application Files
```bash
# From your local machine
scp -i your-key.pem -r loyalty_management ec2-user@your-ec2-ip:/home/ec2-user/loyalty-app
```

### 4. Run Deployment Script
```bash
# On EC2 instance
cd /home/ec2-user/loyalty-app
chmod +x deploy.sh
./deploy.sh
```

## 📋 EC2 Instance Requirements

### Minimum Specifications:
- **Instance Type**: t3.medium (2 vCPU, 4GB RAM)
- **Storage**: 20GB GP3 SSD
- **OS**: Amazon Linux 2023
- **Network**: VPC with internet gateway

### Security Group Rules:
```
Inbound Rules:
- SSH (22): Your IP address
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0

Outbound Rules:
- All traffic: 0.0.0.0/0
```

## 🔧 Environment Configuration

### Production Environment Variables:
Create `.env` files for production:

**Backend (.env):**
```env
DATABASE_URL=sqlite:///./loyalty.db
CORS_ORIGINS=https://yourdomain.com
JWT_SECRET_KEY=your-super-secret-jwt-key-here
ENVIRONMENT=production
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com
NODE_ENV=production
```

## 🌐 Domain Setup (Optional)

### 1. Point Domain to EC2
- Create A record: `yourdomain.com` → `EC2_PUBLIC_IP`
- Create A record: `www.yourdomain.com` → `EC2_PUBLIC_IP`

### 2. SSL Certificate (Let's Encrypt)
```bash
# Install certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Maintenance

### Check Application Status:
```bash
docker-compose ps
docker-compose logs -f
```

### Update Application:
```bash
cd /home/ec2-user/loyalty-app
git pull origin main  # if using git
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Backup:
```bash
# Backup
docker-compose exec backend cp loyalty.db /app/backup-$(date +%Y%m%d).db

# Restore
docker-compose exec backend cp /app/backup-YYYYMMDD.db loyalty.db
```

## 🔒 Security Best Practices

1. **Change Default Credentials**:
   - Update admin password after first login
   - Use strong JWT secret key

2. **Firewall Configuration**:
   - Only allow necessary ports
   - Restrict SSH access to your IP

3. **Regular Updates**:
   - Keep EC2 instance updated
   - Update Docker images regularly

4. **Backup Strategy**:
   - Regular database backups
   - Store backups in S3

## 📈 Scaling Considerations

### For Higher Traffic:
- Use Application Load Balancer
- Multiple EC2 instances
- RDS for database
- ElastiCache for caching
- CloudFront for CDN

### Cost Optimization:
- Use Reserved Instances for predictable workloads
- Auto Scaling Groups for variable traffic
- Spot Instances for development environments

## 🆘 Troubleshooting

### Common Issues:

1. **Services not starting**:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Database issues**:
   ```bash
   docker-compose exec backend python seed.py
   ```

3. **Permission issues**:
   ```bash
   sudo chown -R ec2-user:ec2-user /home/ec2-user/loyalty-app
   ```

4. **Port conflicts**:
   ```bash
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :3000
   ```

## 📞 Support

After deployment, your application will be available at:
- **Frontend**: http://your-ec2-ip
- **Admin Dashboard**: http://your-ec2-ip/admin
- **API Documentation**: http://your-ec2-ip:8000/docs

**Default Admin Credentials**:
- Email: admin@loyaltyapp.com
- Password: admin123

**Remember to change these credentials after first login!**