import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult, AttributeValue,
  DynamoDBStreamEvent,
  DynamoDBStreamHandler,
  Handler
} from 'aws-lambda';
import {DynamoDBDocumentClient, PutCommand, QueryCommand} from '@aws-sdk/lib-dynamodb';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {TransactionType} from "./transaction-type";
import BalanceEntity from './balance-entity';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

export const find: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = event.queryStringParameters ? event.queryStringParameters['userId'] : undefined;
  if (!userId) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'You need input userId parameter' })
    };
  }

  const balance = await findBalance(userId);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(balance),
  };
};

const update: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const transactions = event.Records
    .filter(({eventName}) => eventName === 'INSERT')
    .map(record => record.dynamodb?.NewImage)
    .filter(Boolean)
    .map(it => it as { [p: string]: AttributeValue });
  if (!transactions?.length) {
    console.log('Transaction(s) is empty for event', event);
    return;
  }

  for (const transaction of transactions) {
    console.log('Update balance by transaction', JSON.stringify(transaction));
    const userId = transaction.userId?.S;
    if (!userId) throw new Error('User is required');

    const value = transaction.value?.S;
    if (!value) throw new Error('Value is required');

    const type = transaction.type?.S;
    if (!type) throw new Error('Type is required');

    const currentBalance = await findBalance(userId);
    const balance: BalanceEntity = { userId, value: currentBalance?.value ?? 0 };
    switch (type) {
      case TransactionType.REVENUE:
        balance.value = balance.value + parseFloat(value);
        break;
      case TransactionType.EXPENSE:
        balance.value = balance.value - parseFloat(value);
        break;
      default:
        throw new Error(`Transaction type ${type} is invalid.`);
    }

    try {
      await docClient.send(new PutCommand({
        TableName: 'balance',
        Item: balance,
      }));
      console.log(`Updated balance of the transaction ${transaction.id?.S}. User ${userId}, old value ${currentBalance?.value ?? 0}, new value ${balance.value}.`);
    } catch (exception) {
      console.log('DynamoDB error: ', exception);
    }
  }
};

const findBalance = async (userId: string) => {
  const balances = await docClient.send(new QueryCommand({
    TableName: 'balance',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    KeyConditionExpression: 'userId = :userId',
    Limit: 1
  }));

  return balances.Items?.find(Boolean);
}

exports.update = update;
exports.find = find;