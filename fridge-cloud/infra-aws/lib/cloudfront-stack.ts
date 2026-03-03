import * as cdk from 'aws-cdk-lib';
import {Construct} from "constructs";
import {
  AllowedMethods, CacheHeaderBehavior, CachePolicy, Distribution, OriginRequestHeaderBehavior,
  OriginRequestPolicy, SecurityPolicyProtocol, ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import {BlockPublicAccess, Bucket} from "aws-cdk-lib/aws-s3";
import {aws_route53, aws_route53_targets, CfnOutput, RemovalPolicy} from "aws-cdk-lib";
import {HttpOrigin, S3BucketOrigin} from "aws-cdk-lib/aws-cloudfront-origins";
import {Certificate} from "aws-cdk-lib/aws-certificatemanager";
import {prefixedId} from "./util";
import {CustomDomainConfig} from "./config/custom-domain-config";

interface CloudfrontStackProps extends cdk.StackProps {
  readonly customDomainConfig: CustomDomainConfig
}

export class CloudfrontStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CloudfrontStackProps) {
    super(scope, id, props);

    const distributionBucket = new Bucket(this, prefixedId( scope,'DistributionDefaultBucket1'), {
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const backendDomain = cdk.Fn.importValue(prefixedId( scope,'BackendDomain1'));
    const distribution = new Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(distributionBucket),
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        'api/*' : {
          origin: new HttpOrigin(backendDomain),
          allowedMethods: AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: CachePolicy.CACHING_DISABLED,
            originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      domainNames: props.customDomainConfig ?
          [ this.getFqdn(props.customDomainConfig) ]
          : [],
      certificate: props.customDomainConfig ? Certificate.fromCertificateArn(
              this,
              'Certificate1',
              props.customDomainConfig.certificateArn)
          : undefined
    });

    new CfnOutput(this, 'DistributionDefaultBucketName1', {
      value: distributionBucket.bucketName,
      description: 'Distribution default bucket name',
      exportName: prefixedId(scope, 'DistributionDefaultBucketName1'),
    });

    new CfnOutput(this, 'DistributionId1', {
      value: distribution.distributionId,
      description: 'The distribution id',
      exportName: prefixedId(scope, 'DistributionId1'),
    });

    new CfnOutput(this, 'DistributionDomainName1', {
      value: distribution.distributionDomainName,
      description: 'The distribution domain name',
      exportName: prefixedId(scope, 'DistributionDomainName1'),
    });

    if(props.customDomainConfig) {
      const hostedZone = aws_route53.HostedZone.fromHostedZoneAttributes(
          this,
          'HostedZone1',
          {
            hostedZoneId: props.customDomainConfig.hostedZoneId,
            zoneName: props.customDomainConfig.zoneName
          }
      );

      const endpoint = new aws_route53.ARecord(this, "DataApiAliasRecord1", {
        zone: hostedZone,
        target: aws_route53.RecordTarget.fromAlias(new aws_route53_targets.CloudFrontTarget(distribution)),
        recordName: this.getFqdn(props.customDomainConfig),
      });

      new CfnOutput(this, 'DistributionDomainNameCustom1', {
        value: endpoint.domainName,
        description: 'The distribution domain name',
        exportName: prefixedId(scope, 'DistributionDomainNameCustom1'),
      });
    }

  }

  getFqdn(customDomainConfig: CustomDomainConfig): string {
    return customDomainConfig.subDomain + '.' + customDomainConfig.zoneName
  }

}
