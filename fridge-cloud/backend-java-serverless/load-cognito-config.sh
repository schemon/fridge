#!/bin/bash

# Read cognito config and export as environment variables for local development

# Function to display help text
show_help() {
    cat << EOF
Usage: source $(basename "$0") --stageName=<stage_name>

Loads Cognito configuration for the specified stage.

EXAMPLES:
  source ./$(basename "$0") --stageName=dev
  source ./$(basename "$0") --stageName=prod
EOF
    return 1
}

# Parse named parameters
STAGE_NAME=""
for arg in "$@"; do
    case $arg in
        --stageName=*) STAGE_NAME="${arg#*=}" ;;
        -h|--help)
            show_help
            return 1
            ;;
        *)
            echo "Error: Unknown parameter: $arg"
            show_help
            return 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$STAGE_NAME" ]; then
    echo "Error: Missing required parameter --stageName"
    show_help
    return 1
fi

CONFIG_FILE="../infra-aws/config/cognito-config-${STAGE_NAME}.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Warning: Cognito config file not found at $CONFIG_FILE"
    echo "Run 'cd infra-aws && ./deploy-auth-and-refresh-config.sh --profile=<profile> --stageName=$STAGE_NAME' first"
    return 1
fi

# Parse JSON and export environment variables
export COGNITO_ISSUER_URI=$(cat "$CONFIG_FILE" | grep -o '"issuerUri": *"[^"]*"' | sed 's/"issuerUri": *"\([^"]*\)"/\1/')
export COGNITO_CLIENT_ID=$(cat "$CONFIG_FILE" | grep -o '"clientId": *"[^"]*"' | sed 's/"clientId": *"\([^"]*\)"/\1/')
export COGNITO_DOMAIN=$(cat "$CONFIG_FILE" | grep -o '"cognitoDomain": *"[^"]*"' | sed 's/"cognitoDomain": *"\([^"]*\)"/\1/')

echo "Loaded Cognito configuration for stage: $STAGE_NAME"
echo "  Issuer URI: $COGNITO_ISSUER_URI"
echo "  Client ID: $COGNITO_CLIENT_ID"
echo "  Cognito Domain: $COGNITO_DOMAIN"
