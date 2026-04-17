# Smart Carpool Platform

A full-stack carpooling platform with Django backend and React frontend for ride sharing, booking management, and user coordination.

## 🚀 Quick Start

Get both frontend and backend running in 5 minutes!

### Prerequisites

- **Python 3.11+** (for backend)
- **Node.js 18+** (for frontend)
- **Git**

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd CPP-Project1
```

### 2. Backend Setup (Django)

```bash
# Navigate to backend
cd backend/smart_rental

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate

# Create admin user (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

Backend will be available at: http://localhost:8000

### 3. Frontend Setup (React + Vite)

```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:5173

## 📁 Project Structure

```
CPP-Project1/
├── backend/                    # Django backend
│   └── smart_rental/
│       ├── smart_rental/       # Django settings
│       ├── users/             # User authentication
│       ├── properties/        # Ride listings (called properties in code)
│       ├── bookings/          # Booking system
│       ├── reviews/           # Reviews & ratings
│       └── rental_core_engine/ # Business logic & pricing
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components (Home, Dashboard, etc.)
│   │   └── lib/              # Utilities & API client
│   └── public/               # Static assets
└── README.md                 # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user
- `POST /api/auth/logout/` - Logout user
- `GET /api/auth/me/` - Get current user info

### Properties (Rides)
- `GET /api/properties/` - List all available rides
- `POST /api/properties/` - Create new ride (drivers only)
- `GET /api/properties/{id}/` - Get ride details
- `PUT /api/properties/{id}/` - Update ride (owner only)

### Bookings
- `GET /api/bookings/` - List user's ride bookings
- `POST /api/bookings/` - Book a ride
- `GET /api/bookings/{id}/` - Get booking details
- `PUT /api/bookings/{id}/` - Update booking status

### Property Inquiries (Ride Inquiries)
- `GET /api/property-inquiries/` - List ride inquiries
- `POST /api/property-inquiries/` - Create ride inquiry

## � User Roles & Pages

### User Types
- **Traveller**: Can browse rides, make bookings, leave reviews
- **Driver**: Can create rides, manage bookings, view earnings

### Main Pages
- **Landing**: Welcome page with sign up/sign in
- **Home**: Browse available rides (travellers)
- **Dashboard**: View bookings and ride management
- **Create Ride**: Post new ride (drivers only)
- **Profile**: User profile management

### Authentication Flow
- CSRF-protected authentication
- Role-based page access
- Persistent login sessions

### Backend Commands

```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations after model changes
python manage.py makemigrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser

# Run tests
python manage.py test

# Run development server
python manage.py runserver
```

### Frontend Commands

```bash
# Install new dependencies
npm install <package-name>

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 🔐 Environment Variables

### Backend (.env file)

Already exists in `backend/smart_rental/.env` with basic config:

```env
# Django settings
USE_S3=true
DJANGO_DEBUG=true
DJANGO_SECRET_KEY=replace-with-a-strong-secret-key

# Database (PostgreSQL for production, SQLite for development)
DB_NAME=smart_carpool
DB_USER=postgres
DB_PASSWORD=replace-with-db-password
DB_HOST=127.0.0.1
DB_PORT=5432

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=cpp1-bucket
AWS_S3_REGION_NAME=us-east-1

# Optional (for advanced features)
SQS_ENABLED=False  # Set to true for async processing
EMAIL_HOST=smtp.gmail.com  # For email notifications
```

### Frontend (.env.development)

Create `frontend/.env.development` (currently empty, add if needed):

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🚀 Production Deployment

### Backend (AWS EC2)
1. Setup EC2 instance with Python
2. Clone repository
3. Install dependencies
4. Configure environment variables
5. Run migrations
6. Use Gunicorn for production server

### Frontend (AWS S3 + CloudFront)
1. Build frontend: `npm run build`
2. Upload `dist/` folder to S3 bucket
3. Configure CloudFront for CDN

### Database
- Development: SQLite (default)
- Production: PostgreSQL recommended

## 🧪 Testing

### Backend Tests
```bash
cd backend/smart_rental
source venv/bin/activate
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm run test  # (if configured)
```

## 📚 Key Features

- ✅ User authentication & role management (traveller/driver)
- ✅ Ride listings with location and pricing
- ✅ Booking system with status tracking
- ✅ Review & rating system for rides
- ✅ Responsive React frontend with routing
- ✅ RESTful Django API with CORS support
- ✅ File upload for ride images
- ✅ Dynamic fare pricing engine
- ✅ AWS S3 integration for media storage
- ✅ Async task processing (optional SQS integration)

## 🔍 Troubleshooting

### Backend Issues
- **Port 8000 already in use**: `lsof -ti:8000 | xargs kill -9`
- **Migration errors**: Delete `db.sqlite3` and run `python manage.py migrate`
- **Module not found**: Ensure virtual environment is activated

### Frontend Issues
- **Port 5173 already in use**: `lsof -ti:5173 | xargs kill -9`
- **API connection failed**: Check if backend is running on port 8000
- **CORS errors**: Verify `CORS_ALLOWED_ORIGINS` in backend settings

### Common Issues
- **Python version**: Ensure Python 3.11+
- **Node version**: Ensure Node.js 18+
- **Dependencies**: Run `pip install -r requirements.txt` and `npm install`

## 📖 API Documentation

For detailed API documentation, visit:
- Django REST Framework browsable API: http://localhost:8000/api/
- Admin panel: http://localhost:8000/admin/ (after creating superuser)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test
4. Commit: `git commit -m 'Add feature'`
5. Push: `git push origin feature-name`
6. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Need help?** Check the troubleshooting section above or create an issue in the repository.

Happy coding! 🎉