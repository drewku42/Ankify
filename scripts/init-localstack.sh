#!/bin/bash
echo "Initializing LocalStack S3 buckets..."
awslocal s3 mb s3://ankify-uploads
awslocal s3 mb s3://ankify-exports
echo "S3 buckets created."
