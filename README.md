# Disinvented

A web project deployed to Cloudflare Pages.

## Local Development

Simply open `index.html` in your browser, or use a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`

## Deploying to Cloudflare Pages

### Option 1: GitHub Integration (Recommended)

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/disinvented.git
   git push -u origin main
   ```

2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. Navigate to **Pages** → **Create a project**
4. Select **Connect to Git**
5. Choose your `disinvented` repository
6. Configure build settings:
   - **Build command**: (leave empty for static site)
   - **Build output directory**: `/`
7. Click **Save and Deploy**

### Option 2: Direct Upload

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy . --project-name=disinvented
```

## Project Structure

```
disinvented/
├── index.html      # Main HTML file
├── styles.css      # Stylesheet
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Architecture

- **No build process**: This is a static site with no compilation, bundling, or transpilation
- **No dependencies**: Pure vanilla HTML/CSS/JS with no frameworks or libraries
- **Cloudflare Pages**: Deployment target with root directory as build output
- **Responsive design**: Mobile-first approach

### Styling System
- Uses system font stack for performance
- Gradient background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Primary brand color: `#667eea`
- Responsive breakpoint at 768px

## Customization

- Edit `index.html` to change the content
- Modify `styles.css` to adjust styling
- Add interactive features in `script.js`
