import {APIGatewayProxyEvent, APIGatewayProxyResult, Handler} from 'aws-lambda';
import {DynamoDBDocumentClient, QueryCommand} from '@aws-sdk/lib-dynamodb';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';

const update: Handler = async (event: any): Promise<APIGatewayProxyResult> => {
  console.log(event.body);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Update balance!!!' })
  };
};

export const find: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = event.queryStringParameters ? event.queryStringParameters['userId'] : undefined;
  if (!userId) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'You need input userId parameter' })
    };
  }

  const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  const balances = await docClient.send(new QueryCommand({
    TableName: 'balance',
    ExpressionAttributeValues: {
      ":userId": userId,
    },
    KeyConditionExpression: 'userId = :userId'
  }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(balances.Items),
  };
};

exports.update = update;
exports.find = find;