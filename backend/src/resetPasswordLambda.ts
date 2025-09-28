import { CognitoIdentityProviderClient, ConfirmForgotPasswordCommand, ForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const userPoolId = process.env.USER_POOL_ID || 'us-east-1_iWcamHMY1';
const clientId = process.env.CLIENT_ID || '7vm5vj0fp0ce7er412v0bcvf5h';
const userTable = process.env.USER_TABLE || 'SimplifAIUsers';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ message: 'Invalid request body' })
    };
  }
  const { email, otp, newPassword, action } = body;

  if (!email || !action) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ message: 'Missing required fields: email or action' })
    };
  }
  if (action === 'reset' && (!otp || !newPassword)) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ message: 'Missing required fields: otp or newPassword' })
    };
  }

  try {
    const getUserParams = {
      TableName: userTable,
      Key: { userId: email },
    };
    const userData = await docClient.send(new GetCommand(getUserParams));
    const user = userData.Item;

    if (action === 'forgot') {
      if (!user || !user.verified) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
          },
          body: JSON.stringify({ message: 'Email not found or not verified' })
        };
      }
      const forgotPasswordParams = {
        ClientId: clientId,
        Username: email,
      };
      await cognitoClient.send(new ForgotPasswordCommand(forgotPasswordParams));
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ message: 'OTP sent for reset' })
      };
    } else if (action === 'reset') {
      try {
        const confirmForgotPasswordParams = {
          ClientId: clientId,
          Username: email,
          ConfirmationCode: otp,
          Password: newPassword,
        };
        await cognitoClient.send(new ConfirmForgotPasswordCommand(confirmForgotPasswordParams));
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
          },
          body: JSON.stringify({ message: 'Password reset successfully' })
        };
      } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        if (errorMessage.toLowerCase().includes('invalid verification code') || errorMessage.toLowerCase().includes('code mismatch') || errorMessage.toLowerCase().includes('expired')) {
          return {
            statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ message: 'Invalid or expired OTP', error: errorMessage })
          };
        }
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
          },
          body: JSON.stringify({ message: 'Failed to reset password', error: errorMessage })
        };
      }
    }
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ message: 'Invalid action' })
    };
  } catch (error) {
    console.error('Reset Password Error:', error);
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ message: 'Failed to reset password', error: errorMessage })
    };
  }
};