const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();
const TABLE = process.env.FILE_TABLE || 'SimplifAIFileMetadata';
const QUEUE_URL = process.env.PROCESSING_QUEUE_URL || '';

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { uploadId, s3Key, filename, size } = body;
    const userId = event.requestContext.authorizer?.claims?.sub || 'anonymous';
    if (!uploadId || !s3Key) return { statusCode: 400, body: JSON.stringify({ error: 'uploadId and s3Key required' }) };

    // Update DB item status
    await dynamo.update({ TableName: TABLE, Key: { uploadId }, UpdateExpression: 'SET #s = :s, processedAt = :p', ExpressionAttributeNames: { '#s': 'status' }, ExpressionAttributeValues: { ':s': 'processing', ':p': new Date().toISOString() } }).promise();

    // push a message to SQS to trigger worker
    const msg = { uploadId, s3Key, userId };
    await sqs.sendMessage({ QueueUrl: QUEUE_URL, MessageBody: JSON.stringify(msg) }).promise();

    return { statusCode: 202, body: JSON.stringify({ jobId: uploadId, status: 'accepted' }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'internal' }) };
  }
};
