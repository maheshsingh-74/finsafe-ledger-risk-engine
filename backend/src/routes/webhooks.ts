import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";

export const webhookRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/webhooks/simulate — simulate a payment gateway webhook
  app.post("/simulate", async (req, reply) => {
    const body = req.body as {
      transactionId: string;
      eventType: string;
      payload?: Record<string, unknown>;
    };

    const event = await prisma.webhookEvent.create({
      data: {
        transactionId: body.transactionId,
        eventType: body.eventType,
        payload: body.payload ? JSON.stringify(body.payload) : "{}",
        processed: false,
      },
    });

    return reply.status(201).send({ data: event });
  });

  // GET /api/webhooks
  app.get("/", async () => {
    const events = await prisma.webhookEvent.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        transaction: { select: { id: true, status: true, amount: true } },
      },
    });
    return { data: events };
  });
};
