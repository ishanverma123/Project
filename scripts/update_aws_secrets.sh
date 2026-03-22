#!/usr/bin/env bash
set -euo pipefail

# Updates AWS-related GitHub Actions secrets for this repository.
# Usage examples:
#   1) From current shell env (already exported):
#      ./scripts/update_aws_secrets.sh
#
#   2) From an env file:
#      ./scripts/update_aws_secrets.sh --env-file /path/to/aws.env
#
#   3) Target a specific repo explicitly:
#      ./scripts/update_aws_secrets.sh --repo owner/repo
#
# Required variables:
#   AWS_ACCESS_KEY_ID
#   AWS_SECRET_ACCESS_KEY
#   AWS_SESSION_TOKEN
# Optional:
#   USE_S3 (defaults to true)

ENV_FILE=""
REPO_FLAG=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --repo)
      REPO="${2:-}"
      if [[ -z "$REPO" ]]; then
        echo "--repo requires a value like owner/repo"
        exit 1
      fi
      REPO_FLAG=(--repo "$REPO")
      shift 2
      ;;
    -h|--help)
      sed -n '1,40p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Env file not found: $ENV_FILE"
    exit 1
  fi

  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

for cmd in gh; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    echo "Install with: brew install gh"
    exit 1
  fi
done

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

: "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is required}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required}"
: "${AWS_SESSION_TOKEN:?AWS_SESSION_TOKEN is required}"

USE_S3_VALUE="${USE_S3:-true}"

echo "Updating GitHub repository secrets..."
gh secret set USE_S3 "${REPO_FLAG[@]}" < <(printf '%s' "$USE_S3_VALUE")
gh secret set AWS_ACCESS_KEY_ID "${REPO_FLAG[@]}" < <(printf '%s' "$AWS_ACCESS_KEY_ID")
gh secret set AWS_SECRET_ACCESS_KEY "${REPO_FLAG[@]}" < <(printf '%s' "$AWS_SECRET_ACCESS_KEY")
gh secret set AWS_SESSION_TOKEN "${REPO_FLAG[@]}" < <(printf '%s' "$AWS_SESSION_TOKEN")

echo "Done. Updated: USE_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN"
