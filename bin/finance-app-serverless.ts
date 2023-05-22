#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FinanceAppServerlessStack } from '../lib/finance-app-serverless-stack';

const app = new cdk.App();
new FinanceAppServerlessStack(app, 'FinanceAppServerlessStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
});