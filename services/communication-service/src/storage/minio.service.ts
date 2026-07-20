import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Client;
  private bucketName: string;
  private endpoint: string;
  private port: number;

  constructor(private configService: ConfigService) {
    this.endpoint = this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
    this.port = parseInt(this.configService.get<string>('MINIO_PORT') || '9000');
    this.bucketName = this.configService.get<string>('MINIO_BUCKET') || 'casa';

    this.minioClient = new Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: false,
      accessKey: this.configService.get<string>('MINIO_ROOT_USER') || 'minioadmin',
      secretKey: this.configService.get<string>('MINIO_ROOT_PASSWORD') || 'minioadmin',
    });

    // Initialize bucket asynchronously (don't block constructor)
    this.initializeBucket().catch((error) => {
      this.logger.error(`Failed to initialize bucket: ${error}`);
    });
  }

  private async initializeBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket ${this.bucketName} created successfully`);
      } else {
        this.logger.log(`Bucket ${this.bucketName} already exists`);
      }
      
      // Đặt policy public read cho bucket để mobile app có thể tải ảnh thông qua getMediaUrl
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Action: ["s3:GetObject"],
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Resource: [`arn:aws:s3:::${this.bucketName}/*`]
          }
        ]
      };
      await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      this.logger.log(`Bucket policy set to public read`);
    } catch (error) {
      this.logger.error(`Error initializing bucket: ${error}`);
      // Don't throw - let the app start even if bucket init fails
      // It will be created on first upload if needed
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'messages',
  ): Promise<{ url: string; filename: string }> {
    try {
      // Đảm bảo bucket tồn tại trước khi upload
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket ${this.bucketName} created during upload`);
      }

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const originalName = file.originalname || 'file';
      const extension = originalName.includes('.') 
        ? originalName.split('.').pop() 
        : 'bin';
      const filename = `${folder}/${timestamp}-${randomString}.${extension}`;

      await this.minioClient.putObject(
        this.bucketName,
        filename,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      const url = `http://${this.endpoint}:${this.port}/${this.bucketName}/${filename}`;
      this.logger.log(`File uploaded successfully: ${filename}`);

      return { url, filename };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error}`);
      throw error;
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, filename);
      this.logger.log(`File deleted successfully: ${filename}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error}`);
      throw error;
    }
  }

  getPublicUrl(filename: string): string {
    return `http://${this.endpoint}:${this.port}/${this.bucketName}/${filename}`;
  }

  async getPresignedUrl(filename: string, expirySeconds: number = 86400): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        filename,
        expirySeconds,
      );
      return url;
    } catch (error) {
      this.logger.error(`Error getting presigned URL: ${error}`);
      // Fallback to public URL if presigned fails
      return this.getPublicUrl(filename);
    }
  }

  async getFileStream(filename: string): Promise<import('stream').Readable> {
    try {
      return await this.minioClient.getObject(this.bucketName, filename);
    } catch (error) {
      this.logger.error(`Error getting file stream for ${filename}: ${error}`);
      throw error;
    }
  }
}

