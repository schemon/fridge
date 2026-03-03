import * as cdk from 'aws-cdk-lib';
import {aws_ssm, Duration, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {Alias, Code, SnapStartConf} from 'aws-cdk-lib/aws-lambda';
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {getStageAppName, prefixedId} from "./util";

export interface BackendJavaServerlessStackProps extends StackProps {
}

export class BackendJavaServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendJavaServerlessStackProps) {
    super(scope, id, props);

    const stageAppName = getStageAppName(scope);
    const ssmDatasourceConnectionStringName = `/${stageAppName}/backend/datasource-connection-string`;
    
    // Read Cognito issuer URI from SSM Parameter Store (written by AuthStack)
    const cognitoIssuerUri = aws_ssm.StringParameter.valueFromLookup(
      this,
      `/${stageAppName}/cognito/issuer-uri`
    );

    // Define the Lambda function resource
    const myFunction = new lambda.Function(this,'Function1', {
      runtime: lambda.Runtime.JAVA_21, // Provide any supported Node.js runtime
      code: Code.fromAsset('../backend-java-serverless/target/backend-java-0.0.1-SNAPSHOT-lambda-package.zip'),
      handler: "se.sprout.poc_template_backend.aws.StreamLambdaHandler",
      memorySize: 1024,
      timeout: Duration.seconds(30),
      logRetention: RetentionDays.ONE_WEEK,
      snapStart: SnapStartConf.ON_PUBLISHED_VERSIONS,
      environment: {
        SPRING_PROFILES_ACTIVE: 'aws',
        AWS_SSM_DATASOURCE_CONNECTION_STRING_NAME: ssmDatasourceConnectionStringName,
        COGNITO_ISSUER_URI: cognitoIssuerUri
      },
    });

    const param = aws_ssm.StringParameter.fromSecureStringParameterAttributes(
        this,
        "DatasourceConnectionString",
        {
          parameterName: ssmDatasourceConnectionStringName
        },
    );
    param.grantRead(myFunction);

    const alias = new Alias(this, 'Alias1', {
      aliasName: 'current',
      version: myFunction.currentVersion
    });

    // Define the Lambda function URL resource
    const myFunctionUrlAlias = alias.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // Yes, it must be NONE.
    });

    const backendDomain2 = cdk.Fn.select(2, cdk.Fn.split('/', myFunctionUrlAlias.url))
    new cdk.CfnOutput(this, 'BackendDomain1', {
      value: backendDomain2,
      exportName: prefixedId(scope, 'BackendDomain1')
    })

    new cdk.CfnOutput(this, 'BackendFunctionArn1', {
      value: myFunction.functionArn,
      exportName: prefixedId(scope, 'BackendFunctionArn1')
    })

  }
}
