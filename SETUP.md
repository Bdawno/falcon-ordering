# Falcon Northwest Food Order System - Setup Guide

## Application Overview

This is a complete food ordering management system built for Falcon Northwest employees. The system allows employees to create orders from various restaurants and provides admins with a dashboard to manage orders and users.

## What's Included

### ✅ Completed Features

- **Database**: SQLite with Prisma ORM
  - User management with roles (employee/admin)
  - Restaurant and menu item management
  - Order tracking with status updates
  - Full relational data model

- **Authentication**: NextAuth.js
  - Email/password login
  - Session management
  - Role-based access control

- **API Routes** (RESTful):
  - `/api/auth/*` - Authentication endpoints
  - `/api/restaurants` - Get restaurants and menus
  - `/api/orders` - Create, list, and update orders
  - `/api/users` - User management (admin only)

- **Employee Features**:
  - Create orders with multiple restaurants
  - Add items to cart with special requests
  - View order history
  - Filter orders by status
  - Track order details

- **Admin Features**:
  - Dashboard with statistics
  - View all orders
  - Update order status
  - Manage users (create new accounts)
  - Create admin and employee accounts

- **UI Components**:
  - Login page
  - Orders list page with filtering
  - Order creation page with cart
  - Order detail page
  - Admin dashboard

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### 3. Seed Initial Data (Optional)
```bash
node prisma/seed.js
```

This creates:
- 3 test restaurants (Chipotle, Panera, Jimmy Johns)
- Test admin user: `admin@falconnorthwest.com` / `password123`
- Test employee: `employee@falconnorthwest.com` / `password123`

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## How to Use

### First Time Setup
1. Go to `http://localhost:3000`
2. You'll be redirected to login page
3. Use test credentials or create new users via admin panel

### For Employees
1. Sign in with your credentials
2. Click "New Order" to create an order
3. Select a restaurant
4. Add items to your cart
5. Review and place order
6. View your orders and their status

### For Admins
1. Sign in with admin account
2. Click "Admin Dashboard"
3. View order statistics
4. Update order status
5. Create new users

## Important Notes

### Database
- Located at `./dev.db` (SQLite file)
- Migrations in `./prisma/migrations`
- Schema defined in `./prisma/schema.prisma`

### Authentication
- Passwords are hashed with bcryptjs
- Sessions managed by NextAuth.js
- Add `NEXTAUTH_SECRET` environment variable for production

### Adding Restaurants & Menu Items
Currently, restaurants can be added via:
1. Seed script (`node prisma/seed.js`)
2. Prisma Studio (`npx prisma studio`)
3. Direct database queries

Future: Add admin UI for restaurant/menu management

## Next Steps & Future Features

1. **Admin Restaurant Management**
   - Add/edit restaurants UI
   - Add/edit menu items UI
   - Upload menu images

2. **Enhanced Features**
   - Email notifications for status updates
   - Receipt generation
   - Analytics and reporting
   - Order history export

3. **Integration**
   - Payment processing
   - SMS notifications
   - Calendar integration

4. **Performance**
   - Database indexing
   - Caching layer
   - API optimization

## Troubleshooting

**App won't start?**
```bash
# Clear build cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Regenerate Prisma
npx prisma generate
```

**Database errors?**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database
npx prisma studio
```

**Build issues?**
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Lint check
npm run lint
```

## File Structure

```
app/
├── api/                    # API routes
│   ├── auth/
│   ├── orders/
│   ├── restaurants/
│   └── users/
├── orders/                 # Employee order pages
├── admin/                  # Admin dashboard
├── login/                  # Login page
├── lib/                    # Utilities
├── auth.ts                 # NextAuth config
└── layout.tsx             # Root layout

prisma/
├── schema.prisma          # Database schema
├── migrations/            # DB migrations
└── seed.js               # Test data

public/                    # Static files
```

## Key Technologies

- **Next.js 16.2.4** - React framework
- **React 19.2.4** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **Prisma 7.7.0** - Database ORM
- **NextAuth.js** - Authentication
- **SQLite** - Database

## Environment Variables

Create `.env` file:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Production Deployment

1. Build: `npm run build`
2. Start: `npm start`
3. Set environment variables
4. Use production database (PostgreSQL recommended)
5. Configure domain and HTTPS

## Support

For questions or issues, refer to:
- Prisma docs: https://www.prisma.io/docs
- Next.js docs: https://nextjs.org/docs
- NextAuth docs: https://next-auth.js.org
