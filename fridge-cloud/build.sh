#!/bin/sh

# Function to display help text
show_help() {
    cat << EOF
Usage: $(basename "$0") --stageName=<stage_name>

Builds all components for the specified stage.

EXAMPLES:
  ./$(basename "$0") --stageName=dev
  ./$(basename "$0") --stageName=prod
EOF
    exit 1
}

# Parse named parameters
STAGE_NAME=""
for arg in "$@"; do
    case $arg in
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
if [ -z "$STAGE_NAME" ]; then
    echo "Error: Missing required parameter --stageName"
    show_help
fi

set -e
( cd api-spec && ./build.sh )
( cd backend-java-serverless && ./build.sh )
( cd frontend-react && ./build.sh --stageName=$STAGE_NAME )
