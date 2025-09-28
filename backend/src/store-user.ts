import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const userTable = process.env.USER_TABLE || 'SimplifAIUsers';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
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
    await docClient.send(new PutCommand(putItemParams));
    return { statusCode: 200, body: JSON.stringify({ message: 'User stored successfully' }) };
  } catch (error) {
    console.error('Store User Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to store user', error: errorMessage }) };
  }
};