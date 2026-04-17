#!/bin/bash
set -euo pipefail
echo "Initializing LocalStack S3 buckets..."
awslocal s3 mb s3://ankify-uploads 2>/dev/null || true
awslocal s3 mb s3://ankify-exports 2>/dev/null || true
echo "LocalStack S3 buckets ready (ankify-uploads, ankify-exports)."
