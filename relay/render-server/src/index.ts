/**
 * Recoup Voice Server
 * WebSocket server for AI-powered voice debt collection
 *
 * Deployment: Render.com
 * Stack: Fastify + WebSocket + OpenAI Realtime API + Twilio
 */

import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { config, validateConfig } from './config';
import { twilioHandler, CallSummary } from './services/twilio-handler';
import { recoupWebhookService } from './services/recoup-webhook';
import { CallContext } from './prompts/fca-compliant-prompts';

const fastify = Fastify({
  logger: {
    level: config.server.env === 'development' ? 'debug' : 'info',
  },
});

// Register WebSocket plugin
fastify.register(fastifyWebsocket);

/**
 * Health check endpoint
 */
fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
  };
});

/**
 * Twilio Media Stream WebSocket endpoint
 * This is where Twilio connects for voice calls
 *
 * URL: wss://your-render-app.onrender.com/voice-stream?invoiceId=xxx
 */
fastify.register(async (fastify) => {
  fastify.get('/voice-stream', { websocket: true }, async (connection, request) => {
    const { socket } = connection;

    // Extract call context from query params (sent by Recoup app when initiating call)
    const query = request.query as any;
    const invoiceId = query.invoiceId;
    const invoiceReference = query.invoiceReference;
    const amount = parseFloat(query.amount || '0');
    const dueDate = query.dueDate;
    const daysOverdue = parseInt(query.daysOverdue || '0', 10);
    const clientName = query.clientName;
    const businessName = query.businessName;

    // Validate required params
    if (!invoiceId || !invoiceReference || !amount || !clientName || !businessName) {
      console.error('[Server] Missing required query parameters');
      socket.close(1008, 'Missing required parameters');
      return;
    }

    const callContext: CallContext = {
      invoiceReference,
      amount,
      dueDate: dueDate || 'unknown',
      daysOverdue,
      clientName,
      businessName,
    };

    console.log(`[Server] New call for invoice ${invoiceReference}`);

    // Handle the call
    await twilioHandler.handleConnection(
      socket,
      callContext,
      // onCallComplete callback
      async (summary: CallSummary) => {
        console.log(`[Server] Call completed: ${summary.callSid}, Outcome: ${summary.outcome}`);

        // Send webhook to Recoup app
        await recoupWebhookService.sendCallComplete(summary, invoiceId);
      }
    );
  });
});

/**
 * Start the server
 */
async function start() {
  try {
    // Validate configuration
    const validation = validateConfig();
    if (!validation.valid) {
      console.error('[Server] Configuration errors:');
      validation.errors.forEach((err) => console.error(`  - ${err}`));
      process.exit(1);
    }

    // Start server
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    console.log(`
╔═══════════════════════════════════════════════════════╗
║           Recoup Voice Server Started                  ║
╠═══════════════════════════════════════════════════════╣
║  Environment: ${config.server.env.padEnd(39)} ║
║  Port:        ${config.server.port.toString().padEnd(39)} ║
║  WebSocket:   wss://...onrender.com/voice-stream      ║
║  FCA Firm:    ${config.fca.firmReference.padEnd(39)} ║
╚═══════════════════════════════════════════════════════╝
    `);

    // Health check with main Recoup app
    const isHealthy = await recoupWebhookService.sendHealthCheck();
    if (isHealthy) {
      console.log('[Server] ✅ Connected to main Recoup app');
    } else {
      console.warn('[Server] ⚠️  Cannot reach main Recoup app (webhook health check failed)');
    }
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

// Start the server
start();
