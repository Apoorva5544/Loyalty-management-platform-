# 🚀 Render.com Deployment Guide

## Quick Deployment Steps

### 1. Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Loyalty Management Platform"

# Add your GitHub repository as remote
git remote add origin https://github.com/GuideXR/asg-loyalty-platform.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2. Deploy on Render

#### Option A: Automatic Deployment (Recommended)
1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and deploy both services

#### Option B: Manual Service Creation

**Backend Service:**
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `loyalty-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python seed.py`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Frontend Service:**
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `loyalty-frontend`
   - **Root Directory**: `frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 3. Environment Variables

**Backend Environment Variables:**
```
DATABASE_URL=sqlite:///./loyalty.db
CORS_ORIGINS=https://your-frontend-url.onrender.com
JWT_SECRET_KEY=your-super-secret-key-here
ENVIRONMENT=production
```

**Frontend Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NODE_ENV=production
```

### 4. Update CORS Origins

After deployment, update the backend's `CORS_ORIGINS` environment variable with your actual frontend URL:
```
CORS_ORIGINS=https://loyalty-frontend-xyz.onrender.com
```

## 🔧 Configuration Details

### Backend Configuration
- **Runtime**: Python 3.10+
- **Build Time**: ~2-3 minutes
- **Health Check**: `/health` endpoint
- **Database**: SQLite (included in deployment)

### Frontend Configuration
- **Runtime**: Node.js 18+
- **Build Time**: ~3-5 minutes
- **Static Assets**: Optimized for production
- **API Proxy**: Configured via Next.js rewrites

## 🌐 Post-Deployment

### Access Your Application
- **Frontend**: `https://loyalty-frontend-xyz.onrender.com`
- **Backend API**: `https://loyalty-backend-xyz.onrender.com`
- **API Docs**: `https://loyalty-backend-xyz.onrender.com/docs`

### Default Admin Login
- **Email**: `admin@loyaltyapp.com`
- **Password**: `admin123`

**⚠️ Important**: Change the admin password after first login!

## 🔍 Monitoring & Troubleshooting

### Check Deployment Status
1. Go to your Render dashboard
2. Click on each service to view logs
3. Monitor build and runtime logs

### Common Issues

**Backend Issues:**
```bash
# Check logs for database errors
# Ensure seed.py runs successfully
# Verify environment variables are set
```

**Frontend Issues:**
```bash
# Check if NEXT_PUBLIC_API_URL is correct
# Verify build completes successfully
# Check for any missing dependencies
```

### Health Checks
- Backend: `GET /health` should return `{"status": "healthy"}`
- Frontend: Should load the login page

## 🔄 Updates & Maintenance

### Automatic Deployments
- Push to `main` branch triggers automatic redeployment
- Both services will rebuild and restart

### Manual Redeployment
1. Go to Render dashboard
2. Click "Manual Deploy" on each service
3. Wait for deployment to complete

### Database Management
- SQLite database persists between deployments
- For data reset, redeploy with fresh seed data

## 💰 Render Pricing

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- 750 hours/month total across all services
- Slower cold starts

### Paid Plans
- Always-on services
- Faster performance
- Custom domains
- SSL certificates included

## 🔒 Security Considerations

1. **Change Default Credentials**
   - Update admin password immediately
   - Use strong JWT secret key

2. **Environment Variables**
   - Never commit secrets to git
   - Use Render's environment variable management

3. **CORS Configuration**
   - Only allow your frontend domain
   - Update CORS_ORIGINS after deployment

## 📊 Performance Optimization

### Backend Optimization
- Database queries are optimized
- Automatic request/response compression
- Health checks for monitoring

### Frontend Optimization
- Static asset optimization
- Image optimization disabled for Render compatibility
- Standalone output for faster deployments

## 🆘 Support

### Render Support
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)

### Application Support
- Check GitHub repository issues
- Review application logs in Render dashboard
- Test API endpoints using `/docs`

---

**🎉 Your loyalty management platform should now be live on Render!**