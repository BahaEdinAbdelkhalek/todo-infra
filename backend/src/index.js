import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { connectDB, db } from './db.js';
import { connectRedis } from './cache.js';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  await connectDB();
  await connectRedis();

  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200', credentials: true }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  app.get('/health/ready', async (_req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ready', db: 'ok', timestamp: new Date().toISOString() });
    } catch (err) {
      res.status(503).json({ status: 'not ready', db: 'error', error: err.message });
    }
  });

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use('/graphql', expressMiddleware(server, { context: async ({ req }) => ({ req }) }));

  app.listen(PORT, () => {
    console.log(`API ready at http://localhost:${PORT}/graphql`);
    console.log(`Health at  http://localhost:${PORT}/health`);
  });
}

bootstrap().catch((err) => { console.error('Fatal startup error:', err); process.exit(1); });
