const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.FILE_TABLE || 'SimplifAIFileMetadata';
const BUCKET = process.env.UPLOAD_BUCKET || 'simplifai-uploads-us-east-1';

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { filename, contentType, size } = body;
    const userId = event.requestContext.authorizer?.claims?.sub || 'anonymous';
    if (!filename) return { statusCode: 400, body: JSON.stringify({ error: 'filename required' }) };
    const uploadId = uuidv4();
    const s3Key = `uploads/${userId}/${uploadId}/${filename}`;

    // create a pre-signed URL using AWS SDK v2 S3.getSignedUrl
    const params = { Bucket: BUCKET, Key: s3Key, Expires: 900, ContentType: contentType };
    const presignedUrl = s3.getSignedUrl('putObject', params);

    // store metadata in DynamoDB
    await dynamo.put({ TableName: TABLE, Item: { uploadId, userId, filename, s3Key, status: 'uploaded', size, createdAt: new Date().toISOString() } }).promise();

    return { statusCode: 200, body: JSON.stringify({ uploadId, s3Key, presignedUrl, expiresIn: 900 }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'internal' }) };
  }
};
