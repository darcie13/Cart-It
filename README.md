```markdown
# Cart-It: Universal Shopping Tracker & Price Monitor

Cart-It is a full-stack web application and browser extension designed to centralize online shopping. Users can save items from any retailer, organize them into collaborative wishlists, and track price changes through an automated scraping pipeline.

## System Architecture
- **Frontend:** React.js, Tailwind CSS (Deployed on Vercel)
- **Backend:** Node.js, Express.js (Deployed on Render)
- **Database:** MySQL (Hosted on Railway)
- **Extension:** Chrome Manifest v3 (JavaScript/Content Scripts)
- **Email Service:** SMTP2GO API
- **Scraping Tier:** ScrapingBee, ScraperAPI, and ScrapeBadger (AI-failover)

---

## Project Structure 
```text
Cart-It/
│
├── cart-it-backend/
│ ├── config/
| |   └── db.js
| |__ controllers/
| |   └── scrape-controller.js
| |__ jobs/
| |   └── price-tracker-job.js
| |__ middleware/
| |   └── auth.js
│ ├── routes/
| |   |__ analytics-routes.js
| |   |__ auth-routes.js
| |   |__ item-route.js
| |   |__ notifications-routes.js
| |   |__ scrape-routes.js
| |   └── wishlist-routes.js
│ ├── utils/
| |   |__ scraper-engine.js
| |   └── send-emails.js
│ ├── package-lock.json
│ ├── package.json
│ ├── server.js
│ └── .env (not included in repo)
│
├── cart-it-extension/
│ ├── icons/
│ ├── background.js
│ ├── manifest.json
│ ├── popup.html
│ └── popup.js
|
├── cart-it-frontend/
│ ├── public/
│ ├── src/
| |   |__ assets/
| |   |__ components/
| |   |   |__ analytics.js
| |   |   |__ archive-wishlist-view.js
| |   |   |__ archive.js
| |   |   |__ cart.js
| |   |   |__ dashboard.js
| |   |   |__ extension-install.js
| |   |   |__ feedback.js
| |   |   |__ item-modal.js
| |   |   |__ landing-page.js
| |   |   |__ login.js
| |   |   |__ public-cart.js
| |   |   |__ public-wishlist.js
| |   |   |__ reset-password.js
| |   |   |__ sidebar.js
| |   |   |__ signup.js
| |   |   └── wishlist.js
| |   |__ services/
| |   | └── api.js
| |   |__ styles/
| |      |__ analytics.css
| |      |__ archive.css
| |      |__ auth.css
| |      |__ dashboard.css
| |      |__ detail-view.css
| |      |__ item-modal.css
| |      |__ landing.css
| |      |__ public.css
| |      └── sidebar.css
│ ├── package.json
│ └── package-lock.json
│ └── postcss.config.js
│ └── tailwind.config.js
│
├── database/
│ └── database.sql
|
└── README.md
```
---

## Local Development Setup

### Prerequisites
Before running the project locally, ensure you have:
- **Node.js** (v16.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MySQL Instance** (Local or Cloud-hosted)
- Git

## Backend Setup

### 1. Navigate to backend folder
```bash
cd cart-it-backend
```

### 2. Install dependencies 
```bash
npm install
```

### 3. Create .env file
```bash
Create an .env file in the backend root:
DB_PORT=your_port
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_secret_key
SCRAPING_BEE_API_KEY=your_key
SCRAPERAPI_KEY=your_key
SCRAPEBADGER_API_KEY=your_key
SMTP2GO_API_KEY=your_key
```

### 4. Run backend server
```bash
npm start
Backend will run on 
http://localhost:10000
```

## Frontend Configuration

### 1. Navigate to frontend folder
```bash
cd cart-it-frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure API base URL
In src/services/api.js ensure:
```bash
const API_BASE = 'http://localhost:10000/api';
For production deployment, this should point to:
https://cart-it-aflx.onrender.com/api
```

### 4. Start frontend
```bash 
npm start
```
Frontend runs on:
```bash
http://localhost:3000
```

## Extension Installation 

### 1. Open Google Chrome and navigate to chrome://extensions
### 2. Enable Developer Mode (toggle in the top-right).
### 3. Click Load unpacked.
### 4. Select the extension/ folder from this repository.
### 5. Ensure the extension background script points to http://localhost:10000 for local testing.

## Database Setup

### 1. Open MySQL Workbench or CLI
### 2. Create database:
```bash 
CREATE DATABASE cartit_db;
```

### 3. Import schema file:
## To set up the database, run the script located in /database/schema.sql
```bash
mysql -u root -p < database.sql
```

---

## Key Features

### Authentication
- User signup
- JWT login
- Password reset via email

### Wishlist System
- Create/delete wishlists
- Collaboration support
- Shared public links
- Archive completed wishlists

### Cart System
- Add/remove items
- Bulk actions
- Purchase tracking

### Scraping System
- Extract product metadata from URLs
- Save items automatically
- Multi-provider scraping failover

### Analytics
- Spending insights
- Category tracking
- Time-based filtering

---

## Common Issues & Development Notes

### 1. Backend not connecting to database
- Check MySQL is running
- Verify .env credentials
- Ensure correct DB name

### 2. 502 Bad Gateway
- Backend not deployed or crashed
- Check Render logs

### 3. CORS errors
- Ensure frontend URL is added to backend CORS whitelist

## 4. Scraping: Some retailers may block local IP addresses
- Use the ScrapingBee API key for reliable results in production

----

> Note: Sensitive credentials are not included in the repository.
> Developers should create their own `.env` file using the variables listed above.

---

## Deployment 

### Frontend
Hosted on Vercel:
https://cart-it.app

### Backend API
Hosted on Render:
https://cart-it-aflx.onrender.com

### Database
Hosted on Railway (MySQL)

---

## Author: Darcie Raymond