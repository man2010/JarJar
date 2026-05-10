import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export function isS3Configured() {
  return Boolean(
    process.env.FINLEGIA_AWS_REGION &&
    process.env.FINLEGIA_AWS_ACCESS_KEY_ID &&
    process.env.FINLEGIA_AWS_SECRET_ACCESS_KEY &&
    process.env.FINLEGIA_AWS_S3_BUCKET
  );
}

export function s3Bucket() {
  const bucket = process.env.FINLEGIA_AWS_S3_BUCKET;
  if (!bucket) throw new Error('FINLEGIA_AWS_S3_BUCKET is required');
  return bucket;
}

export function s3Client() {
  const region = process.env.FINLEGIA_AWS_REGION;
  const accessKeyId = process.env.FINLEGIA_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.FINLEGIA_AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) throw new Error('AWS S3 is not configured');

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function uploadMediaToS3(params: {
  buffer: Buffer;
  contentType: string;
  filename: string;
  ownerId: string;
}) {
  const extension = extensionFor(params.contentType, params.filename);
  const folder = params.contentType.startsWith('application/') || params.contentType.startsWith('image/') ? 'documents' : 'media';
  const key = `${folder}/${params.ownerId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension}`;

  await s3Client().send(new PutObjectCommand({
    Bucket: s3Bucket(),
    Key: key,
    Body: params.buffer,
    ContentType: params.contentType,
    Metadata: {
      owner_id: params.ownerId,
      original_name: params.filename,
    },
  }));

  return {
    key,
    url: `/api/media/s3?key=${encodeURIComponent(key)}`,
  };
}

export async function getS3Media(key: string) {
  return s3Client().send(new GetObjectCommand({
    Bucket: s3Bucket(),
    Key: key,
  }));
}

function extensionFor(contentType: string, filename: string) {
  const fromName = filename.match(/\.[a-z0-9]+$/i)?.[0];
  if (fromName) return fromName.toLowerCase();
  if (contentType.includes('webm')) return '.webm';
  if (contentType.includes('mp4')) return '.mp4';
  if (contentType.includes('mpeg')) return '.mp3';
  if (contentType.includes('wav')) return '.wav';
  return '';
}
