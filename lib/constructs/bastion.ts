import { aws_ec2, aws_iam, aws_secretsmanager, SecretValue, Stack } from "aws-cdk-lib";
import { MachineImage } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface BastionProps {
  vpc?: aws_ec2.IVpc;
  instanceType?: aws_ec2.InstanceType;
  machineImage?: aws_ec2.IMachineImage;
}

export class Bastion extends Construct {
  constructor(scope: Construct, id: string, props: BastionProps) {
    super(scope, id);

    const vpc = props.vpc ?? new aws_ec2.Vpc(this, "VPC", {
      maxAzs: 2,
      natGateways: 0,
      restrictDefaultSecurityGroup: false,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: aws_ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: false,
        },
        {
          name: "Private",
          subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ]
    });
    const instanceType = props.instanceType ?? new aws_ec2.InstanceType("t3.micro")
    const machineImage = props.machineImage ?? MachineImage.latestAmazonLinux2023();

    const instance = new aws_ec2.Instance(this, "Instance", {
      vpc,
      instanceType: instanceType,
      machineImage: machineImage,
      vpcSubnets: {
        subnetType: aws_ec2.SubnetType.PUBLIC
      },
      associatePublicIpAddress: true,
      ssmSessionPermissions: true
    });

    const ec2arn = `arn:aws:ec2:${Stack.of(this).region}:${Stack.of(this).account}:instance/${instance.instanceId}`;

    const operatorRolePolicy = new aws_iam.ManagedPolicy(this, "OperatorRolePolicy", {});
    operatorRolePolicy.addStatements(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        resources: ["arn:aws:ssm:*:*:session/${aws:username}-*"],
        actions: ["ssm:ResumeSession", "ssm:TerminateSession"],
      }),
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        resources: ["arn:aws:ssm:*:*:document/*"],
        actions: ["ssm:StartSession"],
      }),
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ["ssm:StartSession", "ssm:GetConnectionStatus", "ec2:StartInstances", "ec2:StopInstances"],
        resources: [ec2arn]
      }),
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ["ec2:DescribeInstances", "ssm:DescribeInstanceInformation"],
        resources: ["*"]
      }),
    );
    const password = new aws_secretsmanager.Secret(this, "AdminPassword", {
      generateSecretString: {}
    });
    const admin = new aws_iam.User(this, "AdminUser", {
      password: password.secretValue,
    });
    const operatorRole = new aws_iam.Role(this, "OperatorRole", {
      assumedBy: new aws_iam.CompositePrincipal(
        admin,
      ),
    });
    operatorRole.addManagedPolicy(operatorRolePolicy)
  }
}
