import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(32).optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_EXPIRE: z.string().default("7d"),
  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  RUNWAY_API_KEY: z.string().optional(),
  PIKA_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  REPLICATE_API_KEY: z.string().optional(),
  COLAB_ENDPOINT: z.string().url().optional(),
  TRUST_PROXY: z.coerce.number().default(1),
  BODY_LIMIT: z.string().default("5mb"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(60),
  REQUIRE_AGE_VERIFICATION: z.coerce.boolean().default(true),
  MIN_AGE: z.coerce.number().default(18),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.format());
  process.exit(1);
}

// Ensure we have either a strong symmetric secret or a matching RSA keypair
if (!parsed.data.JWT_SECRET && !(parsed.data.JWT_PRIVATE_KEY && parsed.data.JWT_PUBLIC_KEY)) {
  console.error(
    "Invalid environment configuration: you must provide either JWT_SECRET (>=32 chars) or both JWT_PRIVATE_KEY and JWT_PUBLIC_KEY",
  );
  process.exit(1);
}

export const config = {
  port: parsed.data.API_PORT,
  nodeEnv: parsed.data.NODE_ENV,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtPrivateKey: parsed.data.JWT_PRIVATE_KEY,
  jwtPublicKey: parsed.data.JWT_PUBLIC_KEY,
  jwtExpire: parsed.data.JWT_EXPIRE,
  cors: {
    origin: parsed.data.CORS_ORIGIN,
    credentials: true,
  },
  trustProxy: parsed.data.TRUST_PROXY,
  bodyLimit: parsed.data.BODY_LIMIT,
  rateLimit: {
    windowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    max: parsed.data.RATE_LIMIT_MAX,
  },
  age: {
    requireVerification: parsed.data.REQUIRE_AGE_VERIFICATION,
    min: parsed.data.MIN_AGE,
  },
  database: { url: parsed.data.DATABASE_URL },
  redis: { url: parsed.data.REDIS_URL },
  aws: {
    accessKeyId: parsed.data.AWS_ACCESS_KEY_ID,
    secretAccessKey: parsed.data.AWS_SECRET_ACCESS_KEY,
    region: parsed.data.AWS_REGION,
    s3Bucket: parsed.data.AWS_S3_BUCKET,
    s3Endpoint: parsed.data.S3_ENDPOINT,
  },
  ai: {
    huggingfaceApiKey: parsed.data.HUGGINGFACE_API_KEY,
    openaiApiKey: parsed.data.OPENAI_API_KEY,
    runwayApiKey: parsed.data.RUNWAY_API_KEY,
    pikaApiKey: parsed.data.PIKA_API_KEY,
    elevenlabsApiKey: parsed.data.ELEVENLABS_API_KEY,
    replicateApiKey: parsed.data.REPLICATE_API_KEY,
    colabEndpoint: parsed.data.COLAB_ENDPOINT,
  },
  isProduction: parsed.data.NODE_ENV === "production",
};
