# Notion to Semble Webhook Server

A production-ready webhook server that syncs Notion database items to Semble using buttons and webhooks. (Vibe coded with Claude Code)

## Features

- Persistent Semble authentication (login once on startup)
- Fast webhook responses (~500ms)
- Automatic error recovery and reconnection
- Health check endpoint for monitoring
- Production-ready error handling and logging
- Railway-optimized deployment

## Prerequisites

1. **Bluesky Account**: Sign up at [bsky.app](https://bsky.app)
2. **App Password**: Generate at [Bluesky Settings > App Passwords](https://bsky.app/settings/app-passwords)
3. **Railway Account**: Sign up at [railway.app](https://railway.app)
4. **GitHub Account**: For deploying to Railway

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd notion-semble-webhook
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
SEMBLE_HANDLE=your-handle.bsky.social
SEMBLE_APP_PASSWORD=your-app-password-here
PORT=3000
```

### 3. Test Locally

```bash
npm start
```

The server will start on `http://localhost:3000`

Test with curl:

```bash
curl -X POST http://localhost:3000/webhook/notion-to-semble \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "title": "Test Article",
    "notes": "This is a test from Notion"
  }'
```

## Development & Testing Environments

The project supports separate development and production configurations:

### Development Environment (network.cosmik.dev.card schema)

```bash
# Create dev environment file
cp .env.dev.example .env.dev

# Edit with your credentials
# SEMBLE_SERVICE will use https://bsky.social with dev schema

# Run development server
npm run dev
```

Cards created in dev mode will use the `network.cosmik.dev.card` schema.

### Production Environment (network.cosmik.card schema)

```bash
# Create prod environment file
cp .env.prod.example .env.prod

# Edit with your credentials
# SEMBLE_SERVICE will use https://bsky.social with prod schema

# Run production server
npm run prod
```

Cards created in prod mode will use the `network.cosmik.card` schema.

### Available Scripts

| Script | Environment | Purpose |
|--------|-------------|---------|
| `npm start` | Uses `.env` | Default production start |
| `npm run dev` | Uses `.env.dev` | Development with hot reload |
| `npm run prod` | Uses `.env.prod` | Production mode |
| `npm test` | Uses `.env.dev` | Test environment |

**Note**: The `--env-file` flag requires Node.js 20.6.0 or higher. If you're using an older version, either upgrade Node or manually copy the appropriate `.env.dev` or `.env.prod` file to `.env`.

## Deploy to Railway

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project" > "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js and deploy

3. **Set Environment Variables**:
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add:
     - `SEMBLE_HANDLE`: your-handle.bsky.social
     - `SEMBLE_APP_PASSWORD`: your-app-password

4. **Get Your Webhook URL**:
   - In Railway, go to "Settings" > "Networking"
   - Click "Generate Domain"
   - Your webhook URL will be: `https://your-app.railway.app/webhook/notion-to-semble`

### Option 2: Deploy with Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway open
```

## API Endpoints

### POST /webhook/notion-to-semble

Main webhook endpoint for creating Semble cards.

**Request Body:**

```json
{
  "url": "https://example.com/article",
  "title": "Optional: Page Title",
  "notes": "Optional: Additional notes",
  "collection": "Optional: Collection name"
}
```

**Response:**

```json
{
  "success": true,
  "card": { /* Semble card object */ },
  "duration": 523
}
```

**Required Fields:**
- `url` (string): Valid URL to save to Semble

**Optional Fields:**
- `title` (string): Used as note if `notes` is not provided
- `notes` (string): Note text to attach to the card
- `collection` (string): Collection name to add card to

### GET /health

Health check endpoint for monitoring.

**Response:**

```json
{
  "status": "ok",
  "authenticated": true,
  "timestamp": "2025-01-23T10:30:00.000Z"
}
```

### POST /webhook/test

Test endpoint for verifying webhook setup.

**Response:**

```json
{
  "success": true,
  "received": { /* your request body */ },
  "message": "Test webhook received successfully"
}
```

## Notion Integration Setup

### Using Make.com (Easiest)

1. Create a new scenario in [Make.com](https://make.com)
2. Add trigger: "Notion > Watch Database Items" or "Webhooks > Custom Webhook"
3. Add action: "HTTP > Make a Request"
   - URL: `https://your-app.railway.app/webhook/notion-to-semble`
   - Method: POST
   - Body:
     ```json
     {
       "url": "{{notion.properties.URL}}",
       "title": "{{notion.properties.Name}}",
       "notes": "{{notion.properties.Notes}}"
     }
     ```

### Using Notion API + Button

1. Create a Notion integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Add a button property in your Notion database
3. Use a service like Zapier or n8n to trigger on button click
4. Configure the webhook call with your Railway URL

### Using Custom Webhook in Notion

If using a third-party button service:

1. Add a button column in your Notion database
2. Configure button to call webhook with database row data
3. Point to: `https://your-app.railway.app/webhook/notion-to-semble`

## Monitoring

### View Logs

Railway Dashboard:
- Click on your deployment
- Go to "Deployments" tab
- Click on latest deployment
- View real-time logs

### Health Checks

Set up monitoring with:
- [UptimeRobot](https://uptimerobot.com)
- [Better Uptime](https://betteruptime.com)

Monitor endpoint: `https://your-app.railway.app/health`

## Troubleshooting

### Authentication Errors

If you see authentication errors:

1. Verify your app password is correct
2. Check that your handle includes the full domain (e.g., `handle.bsky.social`)
3. Generate a new app password at [bsky.app/settings/app-passwords](https://bsky.app/settings/app-passwords)
4. Update the `SEMBLE_APP_PASSWORD` variable in Railway

### Server Won't Start

Check Railway logs for:
- Missing environment variables
- Node.js version compatibility (requires >=18)
- Network/firewall issues

### Slow Response Times

If responses are slow:
- Check Railway metrics for resource usage
- Verify the server hasn't crashed (check logs)
- Ensure you're on Railway's paid plan for better performance

## Cost Estimate

Railway Pricing:
- **Starter Plan**: $5/month (500 hours)
- **Usage**: ~$0.01/hour = ~$7.20/month for 24/7 uptime
- **Hobby Plan**: $5/month (500 hours included, then pay-as-go)

Most users: **$5-7/month**

## Security Notes

- Never commit `.env`, `.env.dev`, or `.env.prod` files to git (they contain secrets)
- Only commit `.env.example`, `.env.dev.example`, and `.env.prod.example` files
- Use Railway's environment variables for production deployment
- Consider adding authentication to your webhook endpoint if needed
- Rotate app passwords periodically

## Development

### Local Development with Hot Reload

```bash
npm run dev
```

This uses the development environment (`.env.dev`) and Node.js `--watch` flag for automatic restarts.

See the [Development & Testing Environments](#development--testing-environments) section for more details on environment configuration.

### Project Structure

```
notion-semble-webhook/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── railway.toml           # Railway configuration
├── .env.example           # Environment template (general)
├── .env.dev.example       # Development environment template
├── .env.prod.example      # Production environment template
├── .env                   # Your local config (gitignored)
├── .env.dev               # Your dev config (gitignored)
├── .env.prod              # Your prod config (gitignored)
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Support

- Semble Docs: [docs.cosmik.network/semble](https://docs.cosmik.network/semble)
- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Issues: Open an issue in this repository

## License

MIT
