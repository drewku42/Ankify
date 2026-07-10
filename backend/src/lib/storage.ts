import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import { config } from "../config";

const useLocal = config.storage.driver === "local";

const s3 = useLocal
  ? null
  : new S3Client({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
      forcePathStyle: true,
    });

function localPath(bucket: string, key: string): string {
  return path.join(config.storage.localDir, bucket, key);
}

export async function uploadFile(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  if (useLocal) {
    const dest = localPath(bucket, key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, body);
    return key;
  }

  await s3!.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
}

export async function getFile(bucket: string, key: string): Promise<Buffer> {
  if (useLocal) {
    return fs.readFile(localPath(bucket, key));
  }

  const response = await s3!.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const stream = response.Body;
  if (!stream) throw new Error(`Empty response for s3://${bucket}/${key}`);
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
