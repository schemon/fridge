import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {getStageAppName, prefixedId} from "./util";
import {StackProps} from "aws-cdk-lib";
import {CustomDomainConfig} from "./config/custom-domain-config";
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface AuthStackProps extends StackProps {
  readonly stageAppName: string,
  readonly customDomainConfig: CustomDomainConfig
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;
  public readonly issuerUri: string;
  public readonly cognitoDomainUrl: string;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const userPoolName = getStageAppName(scope)
    console.log('Creating Cognito User Pool with name: ' + userPoolName)

    // Create user pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: userPoolName,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },  
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolDomainPrefix = getStageAppName(scope).toLowerCase();
    console.log('Cognito User Pool Domain Prefix: ' + userPoolDomainPrefix)

    // Create user pool domain
    this.userPoolDomain = this.userPool.addDomain('UserPoolDomain', {
      cognitoDomain: {
        domainPrefix: userPoolDomainPrefix,
      },
    });

    // Create SPA app client
    this.userPoolClient = this.userPool.addClient('SpaClient', {
      userPoolClientName: prefixedId(scope, 'SpaClient'),
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:3000',
          `https://${props.customDomainConfig.subDomain}.${props.customDomainConfig.zoneName}`,
        ],
        logoutUrls: [
          'http://localhost:3000',
          `https://${props.customDomainConfig.subDomain}.${props.customDomainConfig.zoneName}`,
        ],
      },
      preventUserExistenceErrors: true,
    });

    // Construct the issuer URI and domain URL
    this.issuerUri = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}`;
    this.cognitoDomainUrl = `https://${this.userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`;

    // Store values in SSM Parameter Store for other stacks and local config
    const ssmPrefix = `/${props.stageAppName}/cognito`;
    
    new cdk.aws_ssm.StringParameter(this, 'SsmIssuerUri', {
      parameterName: `${ssmPrefix}/issuer-uri`,
      stringValue: this.issuerUri,
      description: 'Cognito JWT issuer URI',
    });

    new cdk.aws_ssm.StringParameter(this, 'SsmClientId', {
      parameterName: `${ssmPrefix}/client-id`,
      stringValue: this.userPoolClient.userPoolClientId,
      description: 'Cognito user pool client ID',
    });

    new cdk.aws_ssm.StringParameter(this, 'SsmCognitoDomain', {
      parameterName: `${ssmPrefix}/domain`,
      stringValue: this.cognitoDomainUrl,
      description: 'Cognito hosted UI domain URL',
    });

    // Output values for convenience
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'IssuerUri', {
      value: this.issuerUri,
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: this.cognitoDomainUrl,
    });

    new cdk.CfnOutput(this, 'SsmParameterPrefix', {
      value: ssmPrefix,
      description: 'SSM parameter prefix for Cognito configuration',
    });
  }
}
