#!/usr/bin/env node
import { CfnGuardValidator } from '@cdklabs/cdk-validator-cfnguard';
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { BastionStack } from '../lib/stack/bastion-stack';
import { SCBastionStack } from '../lib/stack/sc-bastion-stack';

const app = new cdk.App({
  policyValidationBeta1: [
    new CfnGuardValidator({
      disabledRules: [
        // https://docs.aws.amazon.com/controltower/latest/controlreference/ec2-rules.html
        "ct-ec2-pr-8",
        "ct-ec2-pr-13",
        "ct-ec2-pr-16",
        "ct-ec2-pr-19",
      ]
    })
  ]
});

new BastionStack(app, 'BastionStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

new SCBastionStack(app, 'SCBastionStack', {});
