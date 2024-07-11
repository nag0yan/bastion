import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bastion } from '../constructs/bastion';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface BastionStackProps extends cdk.StackProps {
}

export class BastionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BastionStackProps) {
    super(scope, id, props);

    new Bastion(this, 'Bastion', {});
  }
}
