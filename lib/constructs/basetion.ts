import { aws_ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";

interface BasetionProps {
}

export class Basetion extends Construct {
  constructor(scope: Construct, id: string, props: BasetionProps) {
    super(scope, id);

    const vpc = new aws_ec2.Vpc(this, "VPC", {
      maxAzs: 2
    });

    const instance = new aws_ec2.Instance(this, "Instance", {
      vpc,
      instanceType: new aws_ec2.InstanceType("t2.micro"),
      machineImage: new aws_ec2.AmazonLinuxImage(),
      vpcSubnets: {
        subnetType: aws_ec2.SubnetType.PUBLIC
      }
    });
  }
}
