# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Disinvented is a static website project deployed to Cloudflare Pages. It consists of vanilla HTML, CSS, and JavaScript with no build process or dependencies.

## Development Commands

### Local Development
```bash
# Serve the site locally (Python 3)
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

Alternatively, open `index.html` directly in a browser for simple changes.

### Deployment

**Deploy to Cloudflare Pages via Wrangler:**
```bash
# Install Wrangler globally (first time only)
npm install -g wrangler

# Login to Cloudflare (first time only)
wrangler login

# Deploy the site
wrangler pages deploy . --project-name=disinvented
```

**GitHub Integration:**
Push changes to the connected GitHub repository and Cloudflare Pages will automatically deploy.

## Architecture

### Project Structure
- **index.html** - Main entry point, contains semantic HTML structure
- **styles.css** - All styling, includes responsive design with mobile breakpoint at 768px
- **script.js** - JavaScript initialization and interactive features

### Key Architectural Notes

- **No build process**: This is a static site with no compilation, bundling, or transpilation
- **No dependencies**: Pure vanilla HTML/CSS/JS with no frameworks or libraries
- **Cloudflare Pages**: Deployment target with root directory as build output
- **Responsive design**: Mobile-first approach with gradient background and centered card layout

### Styling System
- Uses system font stack for performance
- Gradient background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Primary brand color: `#667eea`
- Responsive breakpoint at 768px

## Working in This Codebase

- All code is vanilla JavaScript - no transpilation needed
- CSS changes are immediately visible on page refresh
- No linting or type checking configured
- Testing is manual via browser
