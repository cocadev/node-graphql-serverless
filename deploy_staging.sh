#!/bin/bash

set -x
set -e

# TODO update to new boilerplate

cd app-backend/dynamodb

touch credential.yml
cat <<EOF > credential.yml
LOCAL_DDB_ENDPOINT: $LOCAL_DDB_ENDPOINT
AUTH0SECRET: $AUTH0SECRET
AUTH0CLIENTID: $AUTH0CLIENTID
AVATARS3ACCESSKEY: $AVATARS3ACCESSKEY
AVATARS3SECRETKEY: $AVATARS3SECRETKEY
ASSETSS3ACCESSKEY: $ASSETSS3ACCESSKEY
ASSETSS3SECRETKEY: $ASSETSS3SECRETKEY
AUTH0DOMAIN: $AUTH0DOMAIN
AUTH0MGTCLIENTID: $AUTH0MGTCLIENTID
AUTH0MGTCLIENTSECRET: $AUTH0MGTCLIENTSECRET
SES_SENDAPPROVALEMAIL_ACCESSKEY: $SES_SENDAPPROVALEMAIL_ACCESSKEY
SES_SENDAPPROVALEMAIL_SECRETKEY: $SES_SENDAPPROVALEMAIL_SECRETKEY
AUTH0_EXT_CLIENT_ID: $AUTH0_EXT_CLIENT_ID
AUTH0_EXT_CLIENT_SECRET: $AUTH0_EXT_CLIENT_SECRET
LOG_LEVEL: error
INVOKE_DONATIONAPI_ACCESSKEY: $INVOKE_DONATIONAPI_ACCESSKEY
INVOKE_DONATIONAPI_SECRETKEY: $INVOKE_DONATIONAPI_SECRETKEY
INVOKE_SCRAPER_ACCESSKEY: $INVOKE_SCRAPER_ACCESSKEY
INVOKE_SCRAPER_SECRETKEY: $INVOKE_SCRAPER_SECRETKEY
AUTH0_ADMINUSER_CLIENTID: $AUTH0_ADMINUSER_CLIENTID
AUTH0_ADMINUSER_SECRET: $AUTH0_ADMINUSER_SECRET
ABLY_KEY: $ABLY_KEY

SSM_ACCESS_KEY: $STAGING_SSM_ACCESS_KEY
SSM_SECRETACCESS_KEY: $STAGING_SSM_SECRETACCESS_KEY
MESSAGE_FILE_KMS_ENCRYPTION_ACCESS_KEY: $STAGING_MESSAGE_FILE_KMS_ENCRYPTION_ACCESS_KEY
MESSAGE_FILE_KMS_ENCRYPTION_KEYID: $STAGING_MESSAGE_FILE_KMS_ENCRYPTION_KEYID

CURSOR_CRYPTO_KEY: $CURSOR_CRYPTO_KEY
ALGOLIA_APP_ID: $ALGOLIA_APP_ID
ALGOLIA_SEARCH_KEY: $ALGOLIA_SEARCH_KEY

ADMIN_COGNITO_CLIENTID: $ADMIN_COGNITO_CLIENTID
ADMIN_COGNITO_USERPOOLID: $ADMIN_COGNITO_USERPOOLID
USER_COGNITO_CLIENTID: $USER_COGNITO_CLIENTID
USER_COGNITO_USERPOOLID: $USER_COGNITO_USERPOOLID
USE_AWS: no
DYNAMO_ACCESS_KEY: omit
DYNAMO_ACCESS_SECRETKEY: omit
EOF

# serverless deploy --stage staging
# mkdir -p deploy
# sls package --package deploy
# sls deploy --package deploy --stage staging --region us-east-1
# sls deploy --package deploy --stage staging --region eu-central-1

# sls deploy --stage staging --region ap-southeast-1
# sls deploy --stage staging --region eu-central-1
# sls deploy --stage staging --region us-west-2
sls deploy --stage staging --region us-east-1

