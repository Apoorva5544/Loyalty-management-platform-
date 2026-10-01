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
