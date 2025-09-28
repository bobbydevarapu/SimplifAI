"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const AWS = require("aws-sdk");
const uuid_1 = require("uuid");
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const BUCKET_NAME = 'simplifai-uploads-us-east-1';
const TABLE_NAME = 'SimplifAIFileMetadata';
const handler = async (event) => {
    try {
        // Parse request body
        const { filename, contentType, size } = JSON.parse(event.body || '{}');
        const userId = (event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.claims && event.requestContext.authorizer.claims.sub) ||
            (event.requestContext && event.requestContext.identity && event.requestContext.identity.user) ||
            process.env.TEST_USER_ID ||
            'test-user';
        const uploadId = (0, uuid_1.v4)();
        const s3Key = `uploads/${userId}/${Date.now()}-${uploadId}-${filename}`;
        // Generate presigned URL
        const presignedUrl = s3.getSignedUrl('putObject', {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ContentType: contentType,
            Expires: 900 // 15 minutes
        });
        // Write metadata to DynamoDB
        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: {
                uploadId,
                userId,
                filename,
                s3Key,
                status: 'uploaded',
                size,
                createdAt: Date.now()
            }
        }).promise();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ uploadId, s3Key, presignedUrl, expiresAt: Date.now() + 900 * 1000 })
        };
    }
    catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
exports.handler = handler;
