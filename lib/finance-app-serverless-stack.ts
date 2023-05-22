import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {Code, Runtime} from 'aws-cdk-lib/aws-lambda';
import {LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';

export class FinanceAppServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const api = new RestApi(this, 'finance-app-api', {
      restApiName: 'Finance app api',
      description: 'This service of the finances'
    });

    const test = api.root.addResource('test');
    const helloWorldFn = new lambda.Function(this, 'HelloWorld', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambdas'),
      handler: 'hello-world.handler',
    });
    test.addMethod('GET', new LambdaIntegration(helloWorldFn));

    const transaction = api.root.addResource('transaction');
    const transactionFn = new lambda.Function(this, 'transaction', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambdas'),
      handler: 'transaction.handler',
    });
    transaction.addMethod('POST', new LambdaIntegration(transactionFn));

    const balance = api.root.addResource('balance');
    const balanceUpdateFn = new lambda.Function(this, 'balance-update', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambdas'),
      handler: 'balance.update',
    });
    const balanceFindFn = new lambda.Function(this, 'balance-find', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambdas'),
      handler: 'balance.find',
    });
    balance.addMethod('POST', new LambdaIntegration(balanceUpdateFn));
    balance.addMethod('GET', new LambdaIntegration(balanceFindFn));
  }
}
