import * as cdk from 'aws-cdk-lib';
import * as path from "path";
import {Construct} from "constructs";
import {BucketDeployment, Source} from "aws-cdk-lib/aws-s3-deployment";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Distribution} from "aws-cdk-lib/aws-cloudfront";
import {prefixedId} from "./util";

export class FrontendReactStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName1 = cdk.Fn.importValue(prefixedId(scope, 'DistributionDefaultBucketName1'))
    const frontendBucket1 = Bucket.fromBucketName(this, 'DistributionDefaultBucket1', bucketName1);

    const domainName1 = cdk.Fn.importValue(prefixedId(scope, 'DistributionDefaultBucketName1'))
    const distributionId1 = cdk.Fn.importValue(prefixedId(scope, 'DistributionId1'))

    const distribution1 = Distribution.fromDistributionAttributes(
        this, 'Distribution1', {
          domainName: domainName1,
          distributionId: distributionId1,
        });

    new BucketDeployment(this, 'BucketDeployment1', {
      destinationBucket: frontendBucket1,
      sources: [Source.asset(path.resolve(__dirname, '../../frontend-react/dist'))],
      distribution: distribution1, // Invalidate CloudFront cache on new deploy
      distributionPaths: ['/', '/static/*', '/static/css/*', '/static/js/*', '/static/media/*'],
    })

  }
}
