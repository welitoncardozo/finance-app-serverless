import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {Code, Runtime} from 'aws-cdk-lib/aws-lambda';
import {LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import {AttributeType, Table} from "aws-cdk-lib/aws-dynamodb";
import {RemovalPolicy} from "aws-cdk-lib";

export class FinanceAppServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const api = new RestApi(this, 'finance-app-api', {
      restApiName: 'Finance app api',
      description: 'This service of the finances'
    });

    const user = api.root.addResource('user');
    const userHandlerFn = new lambda.Function(this, 'user-handler', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('services/user'),
      handler: 'user-lambda.handler',
    });
    const userTable = new Table(this, 'user-table', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'user',
      removalPolicy: RemovalPolicy.DESTROY,
    });
    userTable.grantWriteData(userHandlerFn);
    user.addMethod('POST', new LambdaIntegration(userHandlerFn));

    const transaction = api.root.addResource('transaction');
    const transactionHandlerFn = new lambda.Function(this, 'transaction-handler', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('services/transaction'),
      handler: 'transaction-lambda.handler',
    });
    const transactionTable = new Table(this, 'transaction-table', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'transaction',
      removalPolicy: RemovalPolicy.DESTROY,
    });
    transactionTable.grantWriteData(transactionHandlerFn);
    transaction.addMethod('POST', new LambdaIntegration(transactionHandlerFn));

    const balance = api.root.addResource('balance');
    const balanceTable = new Table(this, 'balance-table', {
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING,
      },
      tableName: 'balance',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // TODO update by event
    const balanceUpdateFn = new lambda.Function(this, 'balance-update', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('services/balance'),
      handler: 'balance-lambda.update',
      environment: {
        TABLE_NAME: balanceTable.tableName,
      },
    });
    balanceTable.grantWriteData(balanceUpdateFn);

    const balanceFindFn = new lambda.Function(this, 'balance-find', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('services/balance'),
      handler: 'balance-lambda.find',
    });
    balanceTable.grantReadData(balanceFindFn);

    balance.addMethod('POST', new LambdaIntegration(balanceUpdateFn));
    balance.addMethod('GET', new LambdaIntegration(balanceFindFn));
  }
}
