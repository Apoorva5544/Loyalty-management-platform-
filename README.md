# 🎯 Loyalty Management Platform

A modern B2B loyalty management platform built with FastAPI (Python) backend and Next.js (TypeScript) frontend.

## ✨ Features

- **💰 Revenue Dashboard** - Track revenue in multiple currencies (₹, $, etc.)
- **👥 Customer Management** - Manage loyalty program members
- **🎁 Points System** - Award, redeem, and track loyalty points with expiration
- **📧 Email Notifications** - Customizable email templates with preview
- **📊 Analytics** - Performance insights and customer analytics
- **🏆 Rewards System** - Create and manage rewards catalog
- **🎯 Campaigns** - Automated point awards for activities
- **⚙️ Company Settings** - Configurable business settings

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/GuideXR/asg-loyalty-platform.git
   cd asg-loyalty-platform
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python seed.py  # Setup database with sample data
   uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Default Admin Credentials
- **Email**: `admin@loyaltyapp.com`
- **Password**: `admin123`

## 🌐 Deployment

### Render.com (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/GuideXR/asg-loyalty-platform.git
   git push -u origin main
   ```

2. **Deploy on Render**
   - Connect your GitHub repository to Render
   - Render will automatically detect the `render.yaml` configuration
   - Both backend and frontend will be deployed automatically

### Manual Render Setup

If not using `render.yaml`:

**Backend Service:**
- Build Command: `cd backend && pip install -r requirements.txt && python seed.py`
- Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment Variables:
  - `DATABASE_URL`: `sqlite:///./loyalty.db`
  - `CORS_ORIGINS`: `https://your-frontend-url.onrender.com`

**Frontend Service:**
- Build Command: `cd frontend && npm install && npm run build`
- Start Command: `cd frontend && npm start`
- Environment Variables:
  - `NEXT_PUBLIC_API_URL`: `https://your-backend-url.onrender.com`

## 🏗️ Architecture

```
├── backend/                 # FastAPI Python Backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt    # Python dependencies
│   └── seed.py            # Database seeding
├── frontend/               # Next.js TypeScript Frontend
│   ├── app/               # App Router pages
│   ├── components/        # Reusable components
│   ├── lib/              # Utilities and API client
│   └── package.json      # Node.js dependencies
└── render.yaml           # Render deployment config
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=sqlite:///./loyalty.db
CORS_ORIGINS=http://localhost:3000
JWT_SECRET_KEY=your-secret-key
ENVIRONMENT=development
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📊 Key Features

### Revenue Management
- Multi-currency support (₹, $, €, etc.)
- Real-time revenue tracking
- Purchase history and analytics

### Points System
- Configurable point expiration (never, 6 months, 1 year, 2 years)
- Automatic point awards for activities
- Manual point adjustments by admins

### Email Notifications
- Customizable email templates
- Live preview functionality
- Template variables for personalization
- Campaign management for non-members

### Analytics Dashboard
- Customer insights and top performers
- Points activity tracking
- Revenue trends and metrics

## 🛠️ Development

### Backend Development
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Database Management
```bash
# Reset database with fresh data
cd backend
python seed.py

# Add sample purchases for revenue testing
python -c "
from app.database import SessionLocal
from app.models.models import Purchase, User, Store
import uuid
from datetime import datetime

db = SessionLocal()
store = db.query(Store).first()
user = db.query(User).filter(User.role == 'CUSTOMER').first()

if store and user:
    purchase = Purchase(
        id=str(uuid.uuid4()),
        store_id=store.id,
        user_id=user.id,
        order_id='TEST-001',
        amount=2500.00,
        points_earned=25
    )
    db.add(purchase)
    db.commit()
    print('Sample purchase added!')
"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/docs` endpoint
- Review the deployment guides in the repository

---
