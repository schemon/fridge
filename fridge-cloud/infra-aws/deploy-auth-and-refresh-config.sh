#!/bin/bash

# Function to display help text
show_help() {
    cat << EOF
Usage: $(basename "$0") --profile=<profile_name> --stageName=<stage_name>

This script deploys the auth stack and generates cognito-config.json

EXAMPLES:
  ./$(basename "$0") --profile=my_profile --stageName=prod
EOF
    exit 1
}

# Check if parameters are given
if [ $# -eq 0 ]; then
    echo "Error: Missing required parameter."
    show_help
fi

# Parse named parameters
for arg in "$@"; do
    case $arg in
        --profile=*) AWS_PROFILE="${arg#*=}" ;;
        --stageName=*) STAGE_NAME="${arg#*=}" ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Error: Unknown parameter: $arg"
            show_help
            ;;
    esac
done

# Validate required parameters
if [ -z "$AWS_PROFILE" ] || [ -z "$STAGE_NAME" ]; then
    echo "Error: Missing required parameters."
    show_help
fi

set -e

APP_NAME="fridge-cloud"
# Use CDK path format with /
STACK_NAME="${STAGE_NAME}-${APP_NAME}--AuthStack"

echo "Deploying auth stack: $STACK_NAME"
npm install
npx cdk context --clear
npx cdk deploy "$STACK_NAME" \
  --require-approval=never \
  --profile="$AWS_PROFILE" \
  -c appName="$APP_NAME" \
  -c stageName="$STAGE_NAME"

echo "Extracting Cognito configuration from SSM Parameter Store..."

SSM_PREFIX="/${STAGE_NAME}-${APP_NAME}/cognito"

# Get values from SSM Parameter Store
ISSUER_URI=$(aws ssm get-parameter \
  --name "${SSM_PREFIX}/issuer-uri" \
  --query "Parameter.Value" \
  --output text \
  --profile="$AWS_PROFILE")

CLIENT_ID=$(aws ssm get-parameter \
  --name "${SSM_PREFIX}/client-id" \
  --query "Parameter.Value" \
  --output text \
  --profile="$AWS_PROFILE")

COGNITO_DOMAIN=$(aws ssm get-parameter \
  --name "${SSM_PREFIX}/domain" \
  --query "Parameter.Value" \
  --output text \
  --profile="$AWS_PROFILE")

# Write to stage-specific config file
CONFIG_FILE="config/cognito-config-${STAGE_NAME}.json"

cat > "$CONFIG_FILE" <<EOF
{
  "issuerUri": "$ISSUER_URI",
  "clientId": "$CLIENT_ID",
  "cognitoDomain": "$COGNITO_DOMAIN"
}
EOF

echo "✅ Cognito configuration saved to infra-aws/$CONFIG_FILE"
echo ""
echo "Configuration:"
echo "  Stage: $STAGE_NAME"
echo "  Issuer URI: $ISSUER_URI"
echo "  Client ID: $CLIENT_ID"
echo "  Cognito Domain: $COGNITO_DOMAIN"
echo ""
echo "Next steps:"
echo "  1. Review and commit $CONFIG_FILE to git"
echo "  2. Run ../build.sh --stageName=$STAGE_NAME to build frontend and backend"
echo "  3. Run ../deploy.sh --profile=$AWS_PROFILE --stageName=$STAGE_NAME to deploy all stacks"
