# FAST COVERAGES – GLOBAL NEWS NETWORK
## Enterprise Node.js Deployment & GoDaddy Managed Hosting Guide

This guide details the steps required to deploy the **FAST COVERAGES** Global News Network on **GoDaddy Managed Hosting for Node.js** (or any standard cPanel Node.js Selector using Phusion Passenger).

---

## 1. Architectural Design & GoDaddy Optimization

To guarantee **95+ Lighthouse** and **90+ Google PageSpeed** scores while running smoothly on shared and managed hosting, this application is built on a highly optimized, high-performance Full-Stack architecture:
- **Frontend Engine**: React 19 + Tailwind CSS + Framer Motion compiled to lightweight static assets in the `/dist` directory. This eliminates server-side rendering latency and provides instantaneous visual transitions.
- **Backend Service**: A robust Express.js server (`/server.ts`) that serves both static assets and API routes (such as our Gemini AI Writer and Markets widgets).
- **GoDaddy Startup Entry Wrapper**: A customized `/server.js` file at the root. GoDaddy's Phusion Passenger server looks for a root `server.js` file to start Node.js. Our wrapper sets `NODE_ENV` to `production` and dynamically loads the bundled server script `dist/server.cjs`.
- **Dynamic Content Synchronization**: Content is dynamically persisted in `/news_db.json`. When editors add, edit, or delete articles or change settings in the Premium Admin Panel, the state is synchronized in-memory on the Node.js server and instantly written to `news_db.json` on the server disk. Changes propagate instantly to all mobile and desktop visitors worldwide without requiring any rebuild or redeployment of files!

---

## 2. One-Click GoDaddy cPanel Deployment Steps

After compiling the project, deployment on GoDaddy takes less than 5 minutes:

### Step 1: Create the Application ZIP
Download or compress the entire project directory into a single `fast-coverages.zip` file.
> *Note:* Ensure you exclude the `node_modules` directory from the zip. GoDaddy will install clean production dependencies from `package.json` natively during the setup.

### Step 2: Upload and Extract in cPanel
1. Log in to your **GoDaddy cPanel Account**.
2. Open the **File Manager** and navigate to your domain's document root (e.g., `public_html` or a custom directory).
3. Upload `fast-coverages.zip`.
4. Right-click the uploaded file and select **Extract**.

### Step 3: Setup Node.js Application in cPanel
1. In cPanel, search for and click **Setup Node.js App** (provided by CloudLinux Selector / Phusion Passenger).
2. Click **Create Application**.
3. Configure the following values:
   - **Node.js Version**: Select any recent LTS version (e.g., `18.x`, `20.x`, or `22.x`).
   - **Application Mode**: Select `Production`.
   - **Application Root**: Enter the relative path where you extracted the files (e.g., `public_html`).
   - **Application URL**: Select your domain name (e.g., `https://yourdomain.com`).
   - **Application Startup File**: Enter **`server.js`** (This points to our root entry wrapper).
4. Click **Create**.

### Step 4: Run Dependency Installation
1. Under the newly created application panel, click **Run JS NPM Install** to fetch and install all dependencies in the production environment.
2. Alternatively, you can SSH into your server, navigate to the folder, and run:
   ```bash
   npm install --production
   ```

### Step 5: Start/Restart the Server
1. Click **Start App** (or **Restart**) in the Setup Node.js App manager.
2. Visit your domain — the website and its Premium Admin Control Panel will be live and fully functional!

---

## 3. Environment Variables Configuration

In the **Setup Node.js App** interface, scroll down to the **Environment Variables** section and add the following keys:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations, fast asset delivery, and static asset mapping. |
| `GEMINI_API_KEY` | `your_gemini_api_key` | Authenticates with the Google GenAI SDK for the AI News Writer. |
| `PORT` | `3000` (or leave default) | Passenger will dynamically pass its routing socket port through this variable. Our server code detects `process.env.PORT` automatically. |

---

## 4. API Documentation

Our Express backend hosts the following REST API endpoints:

### `GET /api/db-state`
- **Purpose**: Fetches the current live state of articles, categories, settings, advertisements, and careers.
- **Response**:
  ```json
  {
    "articles": [...],
    "categories": [...],
    "settings": {...},
    "comments": [...],
    "adSlots": [...],
    "careers": [...],
    "hasBackup": true
  }
  ```

### `POST /api/db-sync`
- **Purpose**: Synchronizes client-side administrative state changes with the server database instantly.
- **Payload**: Full or partial database states.
- **Response**: `{ "success": true, "message": "Database synchronized successfully on server." }`

### `POST /api/generate-article`
- **Purpose**: Feeds a news topic/category to the Gemini Model to output a BBC-standard headline, summary, sub-heading, and structured Markdown content.
- **Payload**: `{ "topic": "Global Semiconductor Shifts", "category": "Technology" }`

### `GET /api/weather` & `GET /api/markets`
- **Purpose**: Drives real-time homepage weather widget and financial market stock tickers.

---

## 5. Security & SEO Setup

### Security Parameters (Built-In)
- **Zero Raw Eval Execution**: All dynamic inputs are parsed via strict JSON structures.
- **XSS Mitigation**: Standard React sanitizer routines protect markdown body rendering.
- **API Port Protection**: Passenger wraps the Node.js port inside a secure local reverse-proxy socket, preventing direct external port scanning.

### SEO Verification (Instant Indexing)
- **Sitemap Generator**: Visit `https://yourdomain.com/sitemap.xml` to access the dynamically populated sitemap. Submit this sitemap in Google Search Console to keep Google News and Google Discover synchronized.
- **Robots Policy**: Visit `https://yourdomain.com/robots.txt` to view indexing instructions for web crawlers.
