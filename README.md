# 🛡️ WarrantyTracker
 
**Never lose track of your product warranties again.**
 
WarrantyTracker is a full-stack web application that helps users manage product warranties, store receipts and documents, and receive timely reminders before warranties expire.

 
---
 
## ✨ Features
 
- **Google OAuth Authentication** - secure sign-in with JWT access tokens and refresh token rotation
- **Product Management** - add, edit, and delete products with warranty tracking
- **Smart Status Tracking** - automatic status updates (Active → Expiring Soon → Expired)
- **Document Storage** - upload receipts, invoices, and warranty certificates to Cloudflare R2
- **Image Search** - find product images via SerpAPI Google Images integration
- **Image Upload** - upload product images directly to cloud storage
- **Automated Reminders** - auto-created at 30, 7, and 1 day before warranty expiry
- **In-App Notifications** - notification bell with unread count and click-to-navigate
- **Daily Cron Job** - background service that updates warranty statuses and triggers reminders
- **Advanced Filtering** - search by name/store, filter by status and category, sort by date or name
- **Dark / Light Theme** - full theme support with smooth toggle
- **Responsive Design** - works on desktop and mobile
---
 
## 🛠️ Tech Stack
 
### Backend
| Technology | Purpose |
|---|---|
| **TypeScript** | Type-safe development |
| **Node.js + Express** | REST API server |
| **PostgreSQL** | Relational database |
| **Prisma v7** | ORM with type-safe queries |
| **JWT** | Authentication with access + refresh token rotation |
| **Passport.js** | Google OAuth 2.0 strategy |
| **Cloudflare R2** | File storage (documents + images) |
| **SerpAPI** | Google Images search integration |
| **node-cron** | Scheduled warranty status updates + reminder processing |
| **Multer** | File upload handling |
| **Jest + Supertest** | API testing |
