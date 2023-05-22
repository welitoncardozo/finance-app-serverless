import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import UserEntity from './user-entity';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { body } = event;
  if (!body) {
    return {
      statusCode: 500,
      body: 'Body is invalid to add user'
    };
  }

  const userData: UserEntity = JSON.parse(body);
  const user: UserEntity = {
    id: crypto.randomUUID(),
    ...userData
  }

  try {
    console.log('Adding a new user: ', user);
    const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
    await docClient.send(new PutCommand({
      TableName: 'user',
      Item: user,
    }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    };
  } catch (exception) {
    console.log('DynamoDB error: ', exception);
    return { statusCode: 500, body: 'Failed to add user' };
  }
};

exports.handler = handler;