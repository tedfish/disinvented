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

## Customization

- Edit `index.html` to change the content
- Modify `styles.css` to adjust styling
- Add interactive features in `script.js`
