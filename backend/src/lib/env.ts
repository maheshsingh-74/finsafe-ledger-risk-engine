import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load .env from backend root or current dir
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config(); // fallback to default

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().default("file:./dev.db"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().default("finsafe-super-secret-jwt-key-change-in-prod"),
  GEMINI_API_KEY: z.string().default(""),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
