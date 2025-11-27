import express from 'express';
import { SemblePDSClient } from '@cosmik.network/semble-pds-client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    authenticated: !!sembleClient,
    timestamp: new Date().toISOString()
  });
});

// Semble client initialization
let sembleClient = null;

async function initializeSembleClient() {
  try {
    console.log('Initializing Semble client...');

    const client = new SemblePDSClient({
      service: process.env.SEMBLE_SERVICE || 'https://bsky.social'
    });

    await client.login(
      process.env.SEMBLE_HANDLE,
      process.env.SEMBLE_APP_PASSWORD
    );

    console.log('✓ Successfully authenticated with Semble');
    return client;
  } catch (error) {
    console.error('✗ Failed to initialize Semble client:', error.message);
    throw error;
  }
}

// Webhook endpoint for Notion → Semble
app.post('/webhook/notion-to-semble', async (req, res) => {
  const startTime = Date.now();

  try {
    // Validate request body
    const { url, title, notes, collection } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: url'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    // Check if client is authenticated
    if (!sembleClient) {
      console.log('Client not initialized, attempting to reconnect...');
      sembleClient = await initializeSembleClient();
    }

    // Create the card
    const noteText = notes || title || undefined;
    console.log(`Creating card: [URL: ${url}, note: ${noteText}]`);

    const card = await sembleClient.createCard({
      url: url,
      note: noteText
    });

    console.log(`✓ Card created successfully in ${Date.now() - startTime}ms`);

    // Optionally add to collection if specified
    if (collection) {
      try {
        await sembleClient.addCardToCollection(card, collection);
        console.log(`✓ Card added to collection: ${collection}`);
      } catch (error) {
        console.warn(`Warning: Could not add to collection: ${error.message}`);
        // Don't fail the request if collection add fails
      }
    }

    res.json({
      success: true,
      card: card,
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('Error creating Semble card:', error);

    // If authentication error, try to reconnect
    if (error.message?.includes('auth') || error.message?.includes('login')) {
      console.log('Authentication error detected, resetting client...');
      sembleClient = null;
    }

    res.status(500).json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    });
  }
});

// Test endpoint for manual testing
app.post('/webhook/test', async (req, res) => {
  console.log('Test endpoint called with body:', req.body);
  res.json({
    success: true,
    received: req.body,
    message: 'Test webhook received successfully'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
async function startServer() {
  try {
    // Validate required environment variables
    if (!process.env.SEMBLE_HANDLE || !process.env.SEMBLE_APP_PASSWORD) {
      throw new Error('Missing required environment variables: SEMBLE_HANDLE and SEMBLE_APP_PASSWORD');
    }

    // Initialize Semble client on startup
    sembleClient = await initializeSembleClient();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 Webhook server running on port ${PORT}`);
      console.log(`📍 Webhook endpoint: POST /webhook/notion-to-semble`);
      console.log(`🏥 Health check: GET /health`);
      console.log(`🧪 Test endpoint: POST /webhook/test\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
