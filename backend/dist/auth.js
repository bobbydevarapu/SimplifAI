"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: 'us-east-1' });
const userPoolId = process.env.USER_POOL_ID || 'us-east-1_iWcamHMY1';
const clientId = process.env.CLIENT_ID || '7vm5vj0fp0ce7er412v0bcvf5h';
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
    const { email, password } = body;
    if (!email || !password) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ message: 'Missing email or password' })
        };
    }
    try {
        const params = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: clientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        };
        const command = new client_cognito_identity_provider_1.InitiateAuthCommand(params);
        const response = await cognitoClient.send(command);
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({
                message: 'Sign in successful',
                idToken: response.AuthenticationResult?.IdToken,
                accessToken: response.AuthenticationResult?.AccessToken,
                refreshToken: response.AuthenticationResult?.RefreshToken,
                statusCode: 200
            })
        };
    }
    catch (error) {
        console.error('Auth Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        return {
            statusCode: 401,
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ message: 'Invalid email or password', error: errorMessage })
        };
    }
};
exports.handler = handler;
