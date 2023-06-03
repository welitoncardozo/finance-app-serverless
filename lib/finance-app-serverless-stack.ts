import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {Code, Runtime} from 'aws-cdk-lib/aws-lambda';
import {LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import {RemovalPolicy} from 'aws-cdk-lib';
import {AttributeType, StreamViewType, Table} from 'aws-cdk-lib/aws-dynamodb';
import {DynamoEventSource} from 'aws-cdk-lib/aws-lambda-event-sources';

export class FinanceAppServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const api = new RestApi(this, 'finance-app-api', {
      restApiName: 'Finance app api',
      description: 'This service of the finances'
    });

    /**
     * USER
     */
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

    const userResource = api.root.addResource('user');
    userResource.addMethod('POST', new LambdaIntegration(userHandlerFn));

    /**
     * TRANSACTION
     */
    const transactionTable = new Table(this, 'transaction-table', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'transaction',
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const transactionHandlerFn = new lambda.Function(this, 'transaction-handler', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('services/transaction'),
      handler: 'transaction-lambda.handler',
    });
    transactionTable.grantWriteData(transactionHandlerFn);

    const transactionTableEventSource = new DynamoEventSource(transactionTable, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      retryAttempts: 1,
    });

    const transactionResource = api.root.addResource('transaction');
    transactionResource.addMethod('POST', new LambdaIntegration(transactionHandlerFn));

    /**
     * BALANCE
     */
    const balanceTable = new Table(this, 'balance-table', {
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING,
      },
      tableName: 'balance',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const balanceUpdateFn = new lambda.Function(this, 'balance-update', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('services/balance'),
      handler: 'balance-lambda.update',
    });
    balanceTable.grantReadWriteData(balanceUpdateFn);
    balanceUpdateFn.addEventSource(transactionTableEventSource);

    const balanceFindFn = new lambda.Function(this, 'balance-find', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('services/balance'),
      handler: 'balance-lambda.find',
    });
    balanceTable.grantReadData(balanceFindFn);

    const balanceResource = api.root.addResource('balance');
    balanceResource.addMethod('GET', new LambdaIntegration(balanceFindFn));
  }
}
