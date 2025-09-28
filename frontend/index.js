require('dotenv').config();
const { CognitoIdentityServiceProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminInitiateAuthCommand, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { SESv2Client } = require('@aws-sdk/client-sesv2');
const { DynamoDBClient, DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const cognitoClient = new CognitoIdentityServiceProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sesClient = new SESv2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

const { COGNITO_USER_POOL_ID, SES_SOURCE_EMAIL, JWT_SECRET } = process.env;

const transporter = nodemailer.createTransport({
  SES: { ses: sesClient, aws: { sendRawEmail: 'SendRawEmail' } },
});

async function signupHandler(req) {
  const { email, fullName, password } = req.body || {};
  const hashedPassword = await bcrypt.hash(password, 10);
  const createUserParams = {
    UserPoolId: COGNITO_USER_POOL_ID,
    Username: email,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: fullName },
      { Name: 'custom:fullName', Value: fullName },
    ],
    MessageAction: 'SUPPRESS',
  };
  try {
    await cognitoClient.send(new AdminCreateUserCommand(createUserParams));
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }));
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await dynamodb.send(new PutCommand({
      TableName: 'SimplifAIUsers',
      Item: { email, otp, createdAt: new Date().toISOString(), verified: false, userId: uuidv4() },
    }));
    await transporter.sendMail({
      from: SES_SOURCE_EMAIL,
      to: email,
      subject: 'Your OTP for SimplifAI Verification',
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });
    return { statusCode: 200, body: JSON.stringify({ message: 'OTP sent successfully', email }) };
  } catch (error) {
    console.error('Signup Error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Error during signup' }) };
  }
}

async function verifyOtpHandler(req) {
  const { email, otp } = req.body || {};
  const result = await dynamodb.send(new GetCommand({
    TableName: 'SimplifAIUsers',
    Key: { email },
  }));
  if (result.Item && result.Item.otp === otp && !result.Item.verified) {
    await dynamodb.send(new UpdateCommand({
      TableName: 'SimplifAIUsers',
      Key: { email },
      UpdateExpression: 'SET verified = :v',
      ExpressionAttributeValues: { ':v': true },
    }));
    const token = jwt.sign({ email, userId: result.Item.userId, verified: true }, JWT_SECRET, { expiresIn: '1h' });
    return { statusCode: 200, body: JSON.stringify({ message: 'OTP verified', token }) };
  } else {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid or expired OTP' }) };
  }
}

async function signinHandler(req) {
  const { email, password } = req.body || {};
  const params = {
    UserPoolId: COGNITO_USER_POOL_ID,
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    AuthParameters: { USERNAME: email, PASSWORD: password },
  };
  try {
    const result = await cognitoClient.send(new AdminInitiateAuthCommand(params));
    const user = await cognitoClient.send(new AdminGetUserCommand({ UserPoolId: COGNITO_USER_POOL_ID, Username: email }));
    if (user.UserStatus === 'CONFIRMED') {
      const token = jwt.sign({ email, userId: user.UserId }, JWT_SECRET, { expiresIn: '1h' });
      return { statusCode: 200, body: JSON.stringify({ message: 'Login successful', token }) };
    } else {
      return { statusCode: 403, body: JSON.stringify({ message: 'Account not verified' }) };
    }
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Invalid credentials' }) };
  }
}

async function forgotPasswordHandler(req) {
  const { email } = req.body || {};
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await dynamodb.send(new PutCommand({
    TableName: 'SimplifAIUsers',
    Item: { email, otp, createdAt: new Date().toISOString(), verified: false },
  }));
  await transporter.sendMail({
    from: SES_SOURCE_EMAIL,
    to: email,
    subject: 'Your OTP for Password Reset',
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
  });
  return { statusCode: 200, body: JSON.stringify({ message: 'OTP sent for password reset', email }) };
}

async function resetPasswordHandler(req) {
  const { email, otp, newPassword } = req.body || {};
  const result = await dynamodb.send(new GetCommand({
    TableName: 'SimplifAIUsers',
    Key: { email },
  }));
  if (result.Item && result.Item.otp === otp && !result.Item.verified) {
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: email,
      Password: newPassword,
      Permanent: true,
    }));
    await dynamodb.send(new UpdateCommand({
      TableName: 'SimplifAIUsers',
      Key: { email },
      UpdateExpression: 'SET verified = :v',
      ExpressionAttributeValues: { ':v': true },
    }));
    return { statusCode: 200, body: JSON.stringify({ message: 'Password reset successful' }) };
  } else {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid or expired OTP' }) };
  }
}

module.exports = { signupHandler, verifyOtpHandler, signinHandler, forgotPasswordHandler, resetPasswordHandler };