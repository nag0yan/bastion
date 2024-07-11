import { aws_iam, aws_servicecatalog, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bastion } from "../constructs/bastion";

interface SCBastionStackProps extends StackProps {
}

export class SCBastionStack extends Stack {
  constructor(scope: Construct, id: string, props: SCBastionStackProps) {
    super(scope, id, props);
    const product = new aws_servicecatalog.CloudFormationProduct(this, "Product", {
      productName: "Bastion",
      owner: "matsui-ka@kadokawa.jp",
      productVersions: [
        {
          productVersionName: "v1",
          cloudFormationTemplate: aws_servicecatalog.CloudFormationTemplate.fromProductStack(
            new BastionProductStack(this, "BastionProductStack", {})
          )
        }
      ]
    })

    const portfolio = new aws_servicecatalog.Portfolio(this, "Portfolio", {
      displayName: "SamplePortfolio",
      providerName: "matsui-ka",
      description: "Sample Portfolio",
      messageLanguage: aws_servicecatalog.MessageLanguage.JP,
    });
    portfolio.addProduct(product);
    const cfTemplateUploadPolicy = new aws_iam.ManagedPolicy(this, "CfTemplateUploadPolicy", {
      statements: [
        new aws_iam.PolicyStatement({
          actions: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:ListBucket",
            "s3:CreateBucket",
          ],
          resources: ["*"]
        })
      ]
    });
    const endUserRole = new aws_iam.Role(this, "EndUesrRole", {
      assumedBy: new aws_iam.AccountRootPrincipal(),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AWSServiceCatalogEndUserFullAccess")
      ],
    });
    endUserRole.addManagedPolicy(cfTemplateUploadPolicy);
    portfolio.giveAccessToRole(endUserRole);

    const launchRole = new aws_iam.Role(this, "LaunchRole", {
      assumedBy: new aws_iam.ServicePrincipal("servicecatalog.amazonaws.com")
    });
    launchRole.addManagedPolicy(aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"))
    portfolio.setLaunchRole(product, launchRole)
  }
}

interface BastionProductStackProps extends StackProps {
}

class BastionProductStack extends aws_servicecatalog.ProductStack {
  constructor(scope: Construct, id: string, props: BastionProductStackProps) {
    super(scope, id);
    new Bastion(this, "Bastion", {});
  }
}
