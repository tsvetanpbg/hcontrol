# 🚀 Quick Start Guide - HEI Clone Platform

## Welcome to the HEI Clone Platform!

This is a complete full-stack food business monitoring system with automatic temperature tracking.

## 📍 Important URLs

### For Users
- **Homepage**: `/`
- **Register New Business**: `/register`
- **User Login**: `/login`
- **User Dashboard**: `/dashboard`

### For Administrators
- **Admin Login**: `/login-admin`
- **Admin Panel**: `/admin`

## 🔑 Demo Credentials

### Test as User
1. Go to `/login`
2. Email: `demo@user.bg`
3. Password: `user123`
4. You'll see your business dashboard with temperature logs

### Test as Administrator
1. Go to `/login-admin`
2. Email: `admin@hei-clone.bg`
3. Password: `admin123`
4. You'll access the full admin panel with all businesses

## 🎯 What Can You Do?

### As a User
✅ View your business profile  
✅ Edit business information  
✅ See daily temperature logs for all your equipment  
✅ Filter logs by date and equipment type  
✅ Export temperature data to CSV  
✅ Generate today's temperature logs manually  

### As an Administrator
✅ View all registered businesses  
✅ Filter businesses by city, type, or search term  
✅ View detailed information for each business  
✅ See temperature logs for any business  
✅ Delete businesses and their data  
✅ Monitor system health and statistics  
✅ Generate daily temperature logs for ALL businesses  
✅ Export business lists to CSV  

## 📝 How to Register a New Business

1. Visit `/register`
2. Fill in your login credentials (email + password)
3. Enter business details:
   - Name, Type, City, Address, Phone, Email
4. Specify equipment counts:
   - Refrigerators (0°C to 4°C)
   - Freezers (-36°C to -18°C)
   - Hot Displays (63°C to 80°C)
   - Cold Displays (0°C to 4°C)
5. Click "Запиши" (Save)
6. You'll be redirected to login page
7. Login with your credentials to access your dashboard

## 🌡️ Temperature Monitoring

### How It Works
- The system automatically generates temperature logs daily
- Each piece of equipment gets one reading per day
- Temperatures are within normal ranges for each equipment type
- Logs are color-coded: green (normal) or red (out of range)

### Manual Generation
**Users**: Click "Генерирай днешни" in your dashboard  
**Admins**: Use "Генерирай днешни записи за всички обекти" in the Monitoring tab

### Automatic Generation
The system is configured to automatically generate logs daily at 6:00 AM via cron job.

## 📊 Viewing Temperature Logs

1. Go to your dashboard (users) or admin panel
2. Click on "Дневник" tab
3. Use filters to narrow down:
   - Start Date
   - End Date
   - Equipment Type
4. Logs are grouped by date for easy reading
5. Click "Експорт CSV" to download the data

## 🔧 Common Tasks

### Edit Your Business Profile
1. Login to dashboard
2. Go to "Профил" tab
3. Click "Редактирай"
4. Update any information
5. Click "Запази"

### Export Temperature Reports
1. View temperature logs
2. Set your date range
3. Apply any filters
4. Click "Експорт CSV"
5. File downloads automatically

### Admin: View Business Details
1. Login to admin panel
2. Go to "Обекти" tab
3. Find the business (use search/filters)
4. Click the eye icon (👁️)
5. View full details + recent logs

### Admin: Delete a Business
1. Login to admin panel
2. Go to "Обекти" tab
3. Find the business
4. Click the trash icon (🗑️)
5. Confirm deletion
6. Business and all logs are removed

## 📱 Mobile Access

The entire platform is fully responsive and works perfectly on:
- ✅ Smartphones
- ✅ Tablets
- ✅ Desktop computers

## 🆘 Need Help?

### No temperature logs showing?
- Click "Генерирай днешни" to create today's logs
- Check your date filters
- Make sure your business has equipment registered

### Can't login?
- Double-check your email and password
- Admins must use `/login-admin` URL
- Users use `/login` URL

### Forgot which account type you have?
- Admin emails usually end in @hei-clone.bg
- User emails are the ones you registered with

## 🎉 You're Ready!

The platform is fully functional and ready to use. Explore the features, test the demo accounts, and register your own business!

For more technical details, see `README_DEPLOYMENT.md`.