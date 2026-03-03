#!/bin/sh

# Complete deployment script following 3-step process:
# 1. Deploy auth stack and generate cognito config
# 2. Build frontend and backend (using the config)
# 3. Deploy all stacks

# Function to display help text
show_help() {
    cat << EOF
Usage: $(basename "$0") --profile=<profile_name> --stageName=<stage_name>

This script performs a complete deployment:
1. Deploys auth stack and generates cognito-config.json
2. Builds frontend and backend
3. Deploys all stacks

Available profiles in ~/.aws/config

$(list_profiles)

EXAMPLES:
  ./$(basename "$0") --profile=my_profile --stageName=prod
EOF
    exit 1
}

# Function to list AWS profiles
list_profiles() {
    cat ~/.aws/config ~/.aws/credentials 2>/dev/null | \
    grep -E '^(\[profile |\[)' | \
    sed -E 's/^\[profile (.+)\]$/\1/; s/^\[(.+)\]$/\1/' | \
    sort -u
    exit 0
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

echo "=========================================="
echo "STEP 1: Deploy Auth Stack"
echo "=========================================="
( cd infra-aws && ./deploy-auth-and-refresh-config.sh --profile=$AWS_PROFILE --stageName=$STAGE_NAME )

echo ""
echo "=========================================="
echo "STEP 2: Build All Components"
echo "=========================================="
./build.sh --stageName=$STAGE_NAME

echo ""
echo "=========================================="
echo "STEP 3: Deploy All Stacks"
echo "=========================================="
( cd infra-aws && npm install && npx cdk context --clear && npx cdk deploy --all --require-approval=never --profile=$AWS_PROFILE -c appName=fridge-cloud -c stageName=$STAGE_NAME )

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Review and commit infra-aws/config/cognito-config-${STAGE_NAME}.json to git"
echo "  2. Your application is deployed and ready to use"
