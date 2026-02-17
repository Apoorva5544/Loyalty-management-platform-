# 🚀 EC2 Deployment Guide - ASG Loyalty Platform

## 📋 Prerequisites

### AWS Account Setup
1. **AWS Account** with EC2 access
2. **Key Pair** for SSH access
3. **Security Group** configured properly

### Local Requirements
- SSH client
- Git (optional, for updates)

## 🖥️ EC2 Instance Setup

### 1. Launch EC2 Instance

**Recommended Configuration:**
- **AMI**: Amazon Linux 2023 (ami-0c02fb55956c7d316)
- **Instance Type**: t3.medium (2 vCPU, 4GB RAM) - minimum
- **Storage**: 20GB GP3 SSD
- **Key Pair**: Your existing key pair or create new one

### 2. Security Group Configuration

**Inbound Rules:**
```
Type        Protocol    Port Range    Source          Description
SSH         TCP         22           Your IP         SSH access
HTTP        TCP         80           0.0.0.0/0       Frontend access
Custom TCP  TCP         3000         0.0.0.0/0       Frontend direct
Custom TCP  TCP         8000         0.0.0.0/0       Backend API
HTTPS       TCP         443          0.0.0.0/0       SSL (future)
```

**Outbound Rules:**
```
Type        Protocol    Port Range    Destination     Description
All traffic All         All          0.0.0.0/0       Internet access
```

## 🚀 Deployment Steps

### Step 1: Connect to EC2 Instance
```bash
# Replace with your key file and EC2 public IP
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

### Step 2: Run Automated Deployment
```bash
# Download and run the deployment script
curl -O https://raw.githubusercontent.com/GuideXR/asg-loyalty-platform/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

**That's it!** The script will automatically:
- Install Docker and Docker Compose
- Clone the repository from GitHub
- Set up environment variables
- Build and start all services
- Configure auto-restart on boot
- Set up log rotation

### Step 3: Verify Deployment

After deployment completes (5-10 minutes), access:
- **Frontend**: `http://YOUR_EC2_IP`
- **Admin Dashboard**: `http://YOUR_EC2_IP/admin`
- **Backend API**: `http://YOUR_EC2_IP:8000`
- **API Docs**: `http://YOUR_EC2_IP:8000/docs`

## 🔑 Default Credentials

**Admin Login:**
- Email: `admin@loyaltyapp.com`
- Password: `admin123`

**⚠️ IMPORTANT**: Change these credentials immediately after first login!

## 🔧 Management Commands

### Check Application Status
```bash
cd /home/ec2-user/loyalty-app
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Update Application
```bash
cd /home/ec2-user/loyalty-app
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Stop Application
```bash
docker-compose down
```

## 🔒 Security Best Practices

### 1. Change Default Credentials
- Login to admin dashboard immediately
- Change admin password to something strong
- Consider creating additional admin users

### 2. Update Security Group
- Restrict SSH access to your IP only
- Consider using a bastion host for production

### 3. Enable SSL (Optional)
```bash
# Install certbot for Let's Encrypt
sudo yum install -y certbot

# Get SSL certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx configuration for SSL
```

### 4. Regular Updates
```bash
# Update system packages
sudo yum update -y

# Update application
cd /home/ec2-user/loyalty-app
git pull origin main
docker-compose up -d --build
```

## 📊 Monitoring & Maintenance

### System Resources
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

### Application Health
```bash
# Check service status
docker-compose ps

# Check container resource usage
docker stats

# Check application logs
docker-compose logs --tail=100 -f
```

### Database Backup
```bash
# Backup database
docker-compose exec backend cp loyalty.db /app/backup-$(date +%Y%m%d).db

# Copy backup to host
docker cp $(docker-compose ps -q backend):/app/backup-$(date +%Y%m%d).db ./
```

## 🆘 Troubleshooting

### Common Issues

**1. Services not starting:**
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**2. Port conflicts:**
```bash
# Check what's using ports
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :8000
```

**3. Permission issues:**
```bash
# Fix ownership
sudo chown -R ec2-user:ec2-user /home/ec2-user/loyalty-app
```

**4. Database issues:**
```bash
# Reset database
docker-compose exec backend python seed.py
```

**5. Memory issues:**
```bash
# Check memory usage
free -h

# Consider upgrading to larger instance type
```

### Getting Help

**Check Application Status:**
1. Verify EC2 instance is running
2. Check security group allows required ports
3. Verify services are running: `docker-compose ps`
4. Check logs: `docker-compose logs -f`

**Performance Issues:**
- Monitor resource usage with `htop` or `docker stats`
- Consider upgrading instance type for higher traffic
- Implement caching strategies

## 💰 Cost Optimization

### Instance Types
- **Development**: t3.micro (1 vCPU, 1GB RAM) - $8-10/month
- **Production**: t3.medium (2 vCPU, 4GB RAM) - $30-35/month
- **High Traffic**: t3.large (2 vCPU, 8GB RAM) - $60-70/month

### Cost Saving Tips
1. Use Reserved Instances for predictable workloads (up to 75% savings)
2. Stop instances during non-business hours if applicable
3. Use Spot Instances for development environments
4. Monitor usage with AWS Cost Explorer

## 🔄 Scaling Considerations

### Vertical Scaling (Upgrade Instance)
```bash
# Stop application
docker-compose down

# Stop EC2 instance, change instance type, restart
# Then restart application
docker-compose up -d
```

### Horizontal Scaling (Multiple Instances)
- Use Application Load Balancer
- Shared database (RDS)
- Session management
- Container orchestration (ECS/EKS)

---

## 📞 Support

**Application URLs after deployment:**
- Frontend: `http://YOUR_EC2_IP`
- Admin: `http://YOUR_EC2_IP/admin`
- API: `http://YOUR_EC2_IP:8000`

**Repository:** https://github.com/GuideXR/asg-loyalty-platform

**Need help?** Create an issue in the GitHub repository with:
- EC2 instance details
- Error logs from `docker-compose logs`
- Steps to reproduce the issue