"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: 'us-east-1' });
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const userPoolId = process.env.USER_POOL_ID || 'us-east-1_iWcamHMY1';
const clientId = process.env.CLIENT_ID || '7vm5vj0fp0ce7er412v0bcvf5h';
const userTable = process.env.USER_TABLE || 'SimplifAIUsers';
const handler = async (event) => {
    let body;
    try {
        body = JSON.parse(event.body || '{}');
    }
    catch {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ message: 'Invalid request body' })
        };
    }
    const { email, otp, purpose, fullName } = body;
    if (!email || !otp || !purpose) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ message: 'Missing email, OTP, or purpose' })
        };
    }
    try {
        const listUsersParams = {
            UserPoolId: userPoolId,
            Filter: `email = "${email.replace(/"/g, '\\"')}"`,
        };
        const listUsersCommand = new client_cognito_identity_provider_1.ListUsersCommand(listUsersParams);
        const userData = await cognitoClient.send(listUsersCommand);
        const user = userData.Users?.[0];
        if (purpose === 'signup') {
            if (user && user.UserStatus === 'CONFIRMED') {
                // Check if the email is in DynamoDB to determine if it's truly "already registered"
                const getUserParams = {
                    TableName: userTable,
                    Key: { userId: email },
                };
                const userData = await docClient.send(new lib_dynamodb_1.GetCommand(getUserParams));
                if (userData.Item && userData.Item.verified) {
                    return {
                        statusCode: 409,
                        headers: {
                            'Access-Control-Allow-Origin': 'http://localhost:8080',
                            'Access-Control-Allow-Credentials': true
                        },
                        body: JSON.stringify({ message: 'Email already registered' })
                    };
                }
                // Attempt to confirm with OTP; this will fail if the user is already confirmed or OTP is invalid
                const confirmSignUpParams = {
                    ClientId: clientId,
                    Username: email,
                    ConfirmationCode: otp,
                };
                await cognitoClient.send(new client_cognito_identity_provider_1.ConfirmSignUpCommand(confirmSignUpParams));
                // Store in DynamoDB only after successful OTP verification
                const putItemParams = {
                    TableName: userTable,
                    Item: {
                        userId: email,
                        email,
                        fullName: fullName || 'Unknown', // Use signup-provided name
                        createdAt: Date.now(),
                        verified: true,
                    },
                };
                await docClient.send(new lib_dynamodb_1.PutCommand(putItemParams));
                return {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': 'http://localhost:8080',
                        'Access-Control-Allow-Credentials': true
                    },
                    body: JSON.stringify({ message: 'OTP verified successfully', userAlreadyExists: false })
                };
            }
            // If user is not found or not confirmed, proceed with OTP verification
            const confirmSignUpParams = {
                ClientId: clientId,
                Username: email,
                ConfirmationCode: otp,
            };
            await cognitoClient.send(new client_cognito_identity_provider_1.ConfirmSignUpCommand(confirmSignUpParams));
            const putItemParams = {
                TableName: userTable,
                Item: {
                    userId: email,
                    email,
                    fullName: fullName || 'Unknown',
                    createdAt: Date.now(),
                    verified: true,
                },
            };
            await docClient.send(new lib_dynamodb_1.PutCommand(putItemParams));
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': 'http://localhost:8080',
                    'Access-Control-Allow-Credentials': true
                },
                body: JSON.stringify({ message: 'OTP verified successfully', userAlreadyExists: false })
            };
            // end if (purpose === 'signup')
        }
    }
    catch (error) {
        console.error('Verify OTP Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        if (errorMessage.includes('Invalid verification code') || errorMessage.includes('Code mismatch')) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': 'http://localhost:8080',
                    'Access-Control-Allow-Credentials': true
                },
                body: JSON.stringify({ message: 'Invalid or expired OTP' })
            };
        }
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ message: 'Failed to verify OTP', error: errorMessage })
        };
    }
    // If we reach here, the purpose was not handled
    return {
        statusCode: 400,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:8080',
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ message: 'Invalid purpose' })
    };
};
exports.handler = handler;
