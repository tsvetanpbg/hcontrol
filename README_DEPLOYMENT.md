# HEI Clone - Deployment Guide

## 🚀 Platform Overview

Full-stack web platform for food business registration and temperature monitoring system, similar to hei.bg.

## 📋 Features

### Public Section
- **Homepage** with Bulgarian navigation (Начало | Справочници | Дневници | Влез)
- **Business Registration Form** with all required fields
- **Dual Login System**: 
  - User Login (`/login`)
  - Admin Login (`/login-admin`)

### User Dashboard (`/dashboard`)
- Profile management and business information editing
- Daily temperature logs display with filtering
- Export functionality (CSV)
- Automatic temperature tracking calendar view

### Admin Panel (`/admin`)
- Complete business management dashboard
- Advanced filtering by city, type, registration date
- Individual business profile access with temperature logs
- System monitoring and statistics
- Bulk operations and exports
- Manual temperature log generation

## 🔐 Demo Accounts

### Admin Account
- **URL**: `/login-admin`
- **Email**: `admin@hei-clone.bg`
- **Password**: `admin123`
- **Access**: Full system administration

### User Account
- **URL**: `/login`
- **Email**: `demo@user.bg`
- **Password**: `user123`
- **Access**: Single business dashboard

## 🗄️ Database Schema

### Tables
1. **users** - User authentication and roles
2. **businesses** - Registered food establishments
3. **temperature_logs** - Daily temperature records

### Equipment Types
- **Refrigerators** (0°C to 4°C)
- **Freezers** (-36°C to -18°C)
- **Hot Displays** (63°C to 80°C)
- **Cold Displays** (0°C to 4°C)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user with business
- `POST /api/auth/login` - User/Admin login

### Business Management
- `GET /api/businesses/[id]` - Get business details
- `PUT /api/businesses/[id]` - Update business information

### Temperature Logs
- `GET /api/temperature-logs/[businessId]` - Fetch logs with filters
- `POST /api/temperature-logs/generate` - Generate daily logs

### Admin Operations
- `GET /api/admin/businesses` - List all businesses (with pagination)
- `DELETE /api/admin/businesses/[id]` - Delete business

### Automated Cron Job
- `GET /api/cron/generate-daily-logs?secret=YOUR_SECRET` - Daily automation

## ⚙️ Environment Variables

Create a `.env` file with the following variables:

```env
# Database (Turso/LibSQL)
TURSO_CONNECTION_URL=your_turso_connection_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here

# Cron Job Security
CRON_SECRET=your_cron_secret_key_here
```

## 🤖 Automated Temperature Logging

The system includes automatic daily temperature generation:

### Method 1: Vercel Cron (Recommended for Vercel deployments)
The `vercel.json` file is already configured to run daily at 6:00 AM:

```json
{
  "crons": [{
    "path": "/api/cron/generate-daily-logs?secret=your-cron-secret-key",
    "schedule": "0 6 * * *"
  }]
}
```

### Method 2: External Cron Service
Use services like:
- **cron-job.org**
- **EasyCron**
- **UptimeRobot**

Configure them to call:
```
https://your-domain.com/api/cron/generate-daily-logs?secret=YOUR_CRON_SECRET
```

### Method 3: Manual Generation
Admins can manually trigger temperature generation from the admin panel's "Мониторинг" tab.

## 🌐 Deployment URLs

After deployment, the platform will be accessible at:

- **Main Site**: `https://your-domain.com/`
- **User Registration**: `https://your-domain.com/register`
- **User Login**: `https://your-domain.com/login`
- **User Dashboard**: `https://your-domain.com/dashboard`
- **Admin Login**: `https://your-domain.com/login-admin`
- **Admin Panel**: `https://your-domain.com/admin`

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **UI Components**: Shadcn/UI, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Turso (LibSQL) with Drizzle ORM
- **Authentication**: JWT tokens, bcrypt
- **Deployment**: Vercel (recommended)

## 📦 Installation & Setup

1. **Install Dependencies**:
```bash
npm install
```

2. **Set Environment Variables**:
Create `.env` file with required variables (see above)

3. **Run Database Seeds**:
Database is already seeded with demo accounts and sample data

4. **Start Development Server**:
```bash
npm run dev
```

5. **Build for Production**:
```bash
npm run build
```

## 🎯 Key Features

### Automatic Temperature Tracking
- Daily logs generated automatically for all equipment
- Temperature ranges validated per equipment type
- Duplicate prevention (one log per device per day)

### Responsive Design
- Mobile-friendly interface
- Clean, professional Bulgarian UI
- Optimized for all screen sizes

### Export & Reporting
- CSV export functionality
- Date range filtering
- Equipment type filtering
- Daily, weekly, monthly views

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (admin/user)
- Protected API routes

## 📞 Support

For issues or questions, contact the system administrator.

## 📄 License

Proprietary - All rights reserved © 2024