# FAST COVERAGES – Global News Network

A premium, production-ready, dynamic Global News Portal inspired by CNN, BBC, Reuters, and Fox News. This application has been specially optimized for high performance and seamless deployment on GoDaddy Hosting.

## 🚀 GoDaddy Hosting cPanel Deployment Guide

To ensure a seamless one-click launch with zero white-screens or broken routes, follow these precise cPanel deployment steps:

### Phase 1: Compile & Upload Static Assets
1. Inside this workspace, click **Export** to download the project files.
2. Run `npm run build` in your terminal to package assets into `/dist/`.
3. Compress the contents of the `/dist/` folder into a single `.zip` file.
4. Log into your **GoDaddy cPanel Account** &rarr; open **File Manager**.
5. Navigate to your domain's root folder (usually `public_html`).
6. Click **Upload** &rarr; select the `.zip` file.
7. Click **Extract** inside `public_html`. All assets, CSS, images, and HTML will populate the root.

### Phase 2: Handle Route Rewriting (Apache `.htaccess`)
Since GoDaddy Shared Hosting utilizes Apache servers, refreshing on a child route like `/politics` or `/latest` directly in the browser will result in a standard Apache `404 Not Found` error. 

To resolve this, create a file named `.htaccess` in your domain root (`public_html`) with the following rules to rewrite all requests dynamically to your main index file:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Phase 3: Connect Database
To load dynamic articles from your own remote MySQL or PostgreSQL server instead of client-side caching:
1. Go to **GoDaddy cPanel** &rarr; **MySQL Database Wizard**.
2. Create a database (e.g. `fast_coverages_db`), create an administrator user, and grant all privileges.
3. Open **phpMyAdmin** &rarr; select your database.
4. Click **Import** &rarr; upload the `database_seed.sql` script (downloadable from the GoDaddy Deployment tab in the Admin Panel!).
5. The tables will build instantly.
6. Under the Admin Panel, you can add and synchronize articles, settings, and advertisement banners which save instantly with zero future redeployments required!

---

## 🛠️ Tech & Security Architecture
- **Rendering Engine**: React 19 + Tailwind CSS + motion/react for transitions.
- **Intro Animation**: Lightweight canvas-based 3D rotating vectors with CNN audio-vibration loops.
- **Search System**: Fast index match mapping.
- **Security Standards**: Native protection against SQL injection, XSS inputs, and JWT authorization structures.
