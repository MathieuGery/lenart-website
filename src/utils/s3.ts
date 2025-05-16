import * as Minio from "minio"

export const s3Client = new Minio.Client({
  endPoint: process.env.S3_ENDPOINT ? process.env.S3_ENDPOINT : "localhost",
  port: process.env.S3_PORT ? Number(process.env.S3_PORT) : undefined,
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
  useSSL: false,
})

export async function listBucketObjects(bucketName: string): Promise<{
  name: string
  lastModified: Date
  etag: string
  size: number
}[]> {
  const objects: any = []
  const stream = s3Client.listObjectsV2(bucketName, '', true)
  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => {
      objects.push(obj)
    })
    stream.on('error', (err) => {
      reject(err)
    })
    stream.on('end', () => {
      resolve(objects)
    })
  })
}


export async function createPresignedUrlToDownload({
  bucketName,
  fileName,
  expiry = 60 * 60, // 1 hour
}: {
  bucketName: string
  fileName: string
  expiry?: number
}) {
  return await s3Client.presignedGetObject(bucketName, fileName, expiry)
}
