import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';
import TransactionEntity from "./transaction-entity";

const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { body } = event;
  if (!body) {
    return {
      statusCode: 500,
      body: 'Body is invalid to add transaction'
    };
  }

  const transactionData: TransactionEntity = JSON.parse(body);
  const transaction: TransactionEntity = {
    id: crypto.randomUUID(),
    ...transactionData
  }

  try {
    console.log('Adding a new transaction: ', transaction);
    const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
    await docClient.send(new PutCommand({
      TableName: 'transaction',
      Item: transaction,
    }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    };
  } catch (exception) {
    console.log('DynamoDB error: ', exception);
    return { statusCode: 500, body: 'Failed to add transaction' };
  }
};

exports.handler = handler;