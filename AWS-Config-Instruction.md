# S3 Bucket Configuration

## Library need to install

1. [@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3) - AWS SDK for JavaScript v3 S3 Client
2. [@aws-sdk/lib-storage](https://www.npmjs.com/package/@aws-sdk/lib-storage) - AWS SDK for JavaScript v3 S3 Client for multipart upload

## Config In AWS

### 1. Create S3 Bucket

1.1 Go to the S3 service in the AWS Management Console.
1.2 Create a new bucket with a unique name and select the appropriate region.

### 2. Create IAM User

2.1 Go to the IAM service in the AWS Management Console.
2.2 Create a new user with programmatic access.
2.3 Attach "AmazonS3FullAccess" policy to the user to allow S3 operations

### 3. Get Access Key and Secret Key

3.1 After creating the user, you will be provided with an Access Key ID and Secret Access Key. Make sure to save these credentials securely.
3.2 Save the Access Key ID and Secret Access Key in your environment variables or a secure configuration file for your application to use when interacting with S3.

## Config Permission to view file stored in S3 with your website
