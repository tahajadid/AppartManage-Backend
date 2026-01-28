const express = require('express');
const cors = require('cors');

const { PORT, allowedOrigins } = require('./config/env');
const deviceRoutes = require('./routes/deviceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const billRoutes = require('./routes/billRoutes');

const app = express();
app.use(express.json());
app.use(
  cors(
    allowedOrigins.length
      ? {
          origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            // Check if origin matches any allowed origin
            const isAllowed = allowedOrigins.some(allowed => {
              // Support wildcard patterns like exp://192.168.*
              if (allowed.includes('*')) {
                const pattern = allowed.replace(/\*/g, '.*');
                const regex = new RegExp(`^${pattern}$`);
                return regex.test(origin);
              }
              return origin === allowed;
            });
            
            if (isAllowed) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          },
          credentials: true,
        }
      : undefined
  )
);

app.use('/api', deviceRoutes);
app.use('/api', notificationRoutes);
app.use('/api', billRoutes);

// Health check endpoint for deployment platforms
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

const { environment } = require('./config/env');

app.listen(PORT, () => {
  console.log(`🚀 Notification backend running on port ${PORT}`);
  console.log(`   Environment: ${environment.toUpperCase()}\n`);
});

