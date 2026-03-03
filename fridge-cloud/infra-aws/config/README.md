# Cognito Configuration Files

This directory contains stage-specific Cognito configuration files.

## Files

- **`cognito-config-dev.json`** - Cognito configuration for dev environment
- **`cognito-config-prod.json`** - Cognito configuration for prod environment

## Generating Configurations

To generate or update a configuration file for a specific stage:

```bash
cd infra-aws
./deploy-auth-and-refresh-config.sh --profile=<aws-profile> --stageName=dev
# or
./deploy-auth-and-refresh-config.sh --profile=<aws-profile> --stageName=prod
```

This will:
1. Deploy the auth stack for the specified stage
2. Extract the Cognito outputs from CloudFormation
3. Write them to `cognito-config-{stageName}.json`

## Committing to Git

These files should be committed to git as they contain public configuration values (not secrets):
- Issuer URI - Used by clients to verify JWTs
- Client ID - Used by frontend to authenticate
- Cognito Domain - Used for hosted UI

```bash
git add config/cognito-config-dev.json
git commit -m "Update dev Cognito configuration"
```

## Using Configurations

The configurations are automatically used by:
- **Frontend builds**: `frontend-react/build.sh --stageName=dev`
- **Backend local**: `backend-java-serverless/run.sh --stageName=dev`
- **Complete deployment**: `./deploy-complete.sh --stageName=dev`
