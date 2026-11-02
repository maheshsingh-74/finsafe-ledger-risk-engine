import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { env } from "./lib/env";
import { prisma } from "./lib/prisma";
import { transferRoutes } from "./routes/transfers";
import { accountRoutes } from "./routes/accounts";
import { ledgerRoutes } from "./routes/ledger";
import { riskRoutes } from "./routes/risk";
import { webhookRoutes } from "./routes/webhooks";
import { reconciliationRoutes } from "./routes/reconciliation";
import { auditRoutes } from "./routes/audit";
import { startWorkers } from "./jobs/workers";

const server = Fastify({
  logger: true,
});

async function bootstrap() {
  // ── Plugins ──────────────────────────────────────────────────────────────
  await server.register(cors, {
    origin: true, // Allow any local origin for seamless connection
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  await server.register(jwt, { secret: env.JWT_SECRET });

  await server.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute",
  });

  // ── Routes ────────────────────────────────────────────────────────────────
  await server.register(transferRoutes, { prefix: "/api/transfers" });
  await server.register(accountRoutes, { prefix: "/api/accounts" });
  await server.register(ledgerRoutes, { prefix: "/api/ledger" });
  await server.register(riskRoutes, { prefix: "/api/risk" });
  await server.register(webhookRoutes, { prefix: "/api/webhooks" });
  await server.register(reconciliationRoutes, { prefix: "/api/reconciliation" });
  await server.register(auditRoutes, { prefix: "/api/audit" });

  // ── Health ────────────────────────────────────────────────────────────────
  server.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  }));

  // ── Error Handler ─────────────────────────────────────────────────────────
  server.setErrorHandler((error, _req, reply) => {
    server.log.error(error);
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      error: {
        message: error.message,
        code: error.code ?? "INTERNAL_ERROR",
        statusCode,
      },
    });
  });

  // ── Start ─────────────────────────────────────────────────────────────────
  await server.listen({ port: env.PORT, host: "0.0.0.0" });

  // Start background workers
  await startWorkers();

  server.log.info(`🚀 FinSafe API running on http://localhost:${env.PORT}`);
  server.log.info(`📊 Health check: http://localhost:${env.PORT}/health`);
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  server.log.info(`${signal} received, shutting down...`);
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
