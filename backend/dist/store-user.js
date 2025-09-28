"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const userTable = process.env.USER_TABLE || 'SimplifAIUsers';
const handler = async (event) => {
    let body;
    try {
        body = JSON.parse(event.body || '{}');
    }
    catch {
        return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request body' }) };
    }
    const { email, fullName } = body;
    if (!email || !fullName) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Missing email or fullName' }) };
    }
    try {
        const putItemParams = {
            TableName: userTable,
            Item: {
                userId: email, // Use email as userId for simplicity; can be UUID in production
                email,
                fullName,
                createdAt: Date.now(),
                verified: true,
            },
        };
        await docClient.send(new lib_dynamodb_1.PutCommand(putItemParams));
        return { statusCode: 200, body: JSON.stringify({ message: 'User stored successfully' }) };
    }
    catch (error) {
        console.error('Store User Error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to store user', error: errorMessage }) };
    }
};
exports.handler = handler;
