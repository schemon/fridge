import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {BackendJavaServerlessStack} from "./backend-java-serverless-stack";
import {CloudfrontStack} from "./cloudfront-stack";
import {FrontendReactStack} from "./frontend-react-stack";
import {prefixedId} from "./util";
import {StackProps} from "aws-cdk-lib";
import {CustomDomainConfig} from "./config/custom-domain-config";

export interface FullStackProps extends StackProps {
  readonly stageAppName: string,
  readonly customDomainConfig: CustomDomainConfig
}

export class FullStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FullStackProps) {
    super(scope, id, props);

    const backendStack = new BackendJavaServerlessStack(scope, prefixedId(scope, 'BackendStack'), props);

    const cloudFrontStack = new CloudfrontStack(scope, prefixedId(scope, 'DistributionStack'), {
          ...props,
        }
    );

    cloudFrontStack.addDependency(backendStack);

    new FrontendReactStack(scope, prefixedId(scope, 'FrontendStack'), {
      ...props,
    }).addDependency(cloudFrontStack);
  }
}
