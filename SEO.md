# SEO setup

This repository uses:

- `jekyll-seo-tag` for title, description, canonical URL, Open Graph, Twitter Card, and JSON-LD.
- `jekyll-sitemap` for `/sitemap.xml`.
- `robots.txt` with the sitemap URL.
- `/assets/images/og-default.png` as the default 1200×630 social image.
- Extra breadcrumb JSON-LD and a ProfilePage schema for the About page.

## Google Search Console

1. Open Google Search Console and add the URL-prefix property:
   `https://cuongtobi.github.io/`
2. Choose the **HTML tag** verification method.
3. Copy only the value inside:
   `content="..."`
4. Put that token in `_config.yml`:

   ```yaml
   google_search_console_verification: "YOUR_TOKEN_HERE"
   ```

5. Push the change and wait for GitHub Pages to deploy.
6. Click **Verify** in Search Console.
7. Submit this sitemap:

   `https://cuongtobi.github.io/sitemap.xml`

## SEO front matter for new posts

Use this pattern:

```yaml
---
layout: post
title: Your clear page title
date: 2026-09-22
author: Cuong Vuong
categories: today-i-learned
tags:
  - javascript
  - web-development
description: A unique description of roughly 120–160 characters describing what the reader will learn.
image: /assets/images/og-default.png
---
```

For an article-specific social card, replace `image` with a 1200×630 PNG or JPEG.

## URLs to verify after deployment

- `https://cuongtobi.github.io/robots.txt`
- `https://cuongtobi.github.io/sitemap.xml`
- `https://cuongtobi.github.io/feed.xml`

The 404 page is configured with `noindex,nofollow` and excluded from the sitemap.
