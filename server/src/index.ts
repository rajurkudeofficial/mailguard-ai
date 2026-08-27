/**
 * MailGuard AI — Express Application Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import rateLimit from 'express-rate-limit';

import config from './config/env';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import authRouter, { setupPassport } from './routes/auth';
import gmailRouter from './routes/gmail';
import analyzeRouter from './routes/analyze';
import dashboardRouter from './routes/dashboard';
import threatsRouter from './routes/threats';
import trustedSendersRouter from './routes/trustedSenders';
import alertsRouter from './routes/alerts';
import demoRouter from './routes/demo';

const app = express();

// ── Security headers ─────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by frontend
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [config.clientUrl, 'chrome-extension://*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ── Rate limiting ─────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'RATE_LIMITED', message: 'Too many auth attempts, please try again in 1 hour' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// ── Session ───────────────────────────────────────────────────────────────
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: !config.isDevelopment,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: config.isDevelopment ? 'lax' : 'strict',
    },
    name: 'mg_sid',
  })
);

// ── Passport ──────────────────────────────────────────────────────────────
setupPassport();
app.use(passport.initialize());
app.use(passport.session());

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: config.appMode,
    env: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/gmail', gmailRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/threats', threatsRouter);
app.use('/api/trusted', trustedSendersRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/demo', demoRouter);

// ── 404 + Error handlers ──────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────
const PORT = config.port;

app.listen(PORT, () => {
  logger.info('MailGuard AI server started', {
    port: PORT,
    mode: config.appMode,
    env: config.nodeEnv,
    ai: config.aiProvider || 'rule-based',
  });
});

export default app;
