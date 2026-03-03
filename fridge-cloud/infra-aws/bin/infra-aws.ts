#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {FullStack, FullStackProps} from "../lib/full-stack";
import {AuthStack} from "../lib/auth-stack";
import {getStageAppName} from "../lib/util";

const app = new cdk.App();

const stageAppName = getStageAppName(app)

const config: Array<FullStackProps> = [
  {
    stageAppName: 'prod-fridge-cloud',
    customDomainConfig: {
      zoneName: 'pocpit.com',
      subDomain: 'fridge-cloud',
      hostedZoneId: 'Z027280414XLCGELIXOHY',
      certificateArn: 'arn:aws:acm:us-east-1:760557952941:certificate/327607ea-1620-4203-bb1c-2c838ff6f747',
    },
    env: { account: '760557952941', region: 'eu-north-1' },
  },
  {
    stageAppName: 'dev-fridge-cloud',
    customDomainConfig: {
      zoneName: 'pocpit.com',
      subDomain: 'dev-fridge-cloud',
      hostedZoneId: 'Z027280414XLCGELIXOHY',
      certificateArn: 'arn:aws:acm:us-east-1:760557952941:certificate/327607ea-1620-4203-bb1c-2c838ff6f747',
    },
    env: { account: '760557952941', region: 'eu-north-1' },
  },
]

// @ts-ignore
const stageConfig = config.find(value => value.stageAppName == stageAppName)

console.log(stageConfig)

if(!stageConfig) {
  console.error('Could not find config for stageAppName: ' + stageAppName)
  process.exit(1)
}

// Create standalone AuthStack for step 1 of deployment
new AuthStack(app, stageAppName + '/AuthStack', stageConfig)

// Create FullStack - reads from SSM, no direct dependency on AuthStack
new FullStack(app, stageAppName + '/FullStack', stageConfig)
