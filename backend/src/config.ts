import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  port: parseInt(optional("PORT", "3000"), 10),
  corsOrigin: optional("CORS_ORIGIN", "http://localhost:5173"),

  databaseUrl: required("DATABASE_URL"),

  google: {
    clientId: optional("GOOGLE_CLIENT_ID", ""),
    clientSecret: optional("GOOGLE_CLIENT_SECRET", ""),
    callbackUrl: optional(
      "GOOGLE_CALLBACK_URL",
      "http://localhost:3000/auth/google/callback"
    ),
  },

  jwt: {
    secret: optional("JWT_SECRET", "dev-secret-change-me"),
    expiresIn: "7d",
  },

  storage: {
    driver: optional("STORAGE_DRIVER", "local") as "local" | "s3",
    localDir: optional("STORAGE_LOCAL_DIR", "storage"),
  },

  s3: {
    endpoint: optional("S3_ENDPOINT_URL", "http://localhost:4566"),
    region: optional("AWS_REGION", "us-east-1"),
    accessKeyId: optional("AWS_ACCESS_KEY_ID", "test"),
    secretAccessKey: optional("AWS_SECRET_ACCESS_KEY", "test"),
    bucketUploads: optional("S3_BUCKET_UPLOADS", "ankify-uploads"),
    bucketExports: optional("S3_BUCKET_EXPORTS", "ankify-exports"),
  },

  aiServer: {
    url: optional("AI_SERVER_URL", "http://localhost:8000"),
  },
} as const;
