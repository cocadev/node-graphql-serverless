## Designed Backend

This is the backend of designed app.

## Build Status

**Production (Master)**

[![CircleCI](https://circleci.com/gh/Designed-Platform/designed-backend/tree/master.svg?style=svg&circle-token=f06badee0c76a6ba65591024ff14d8d65a5cab4c)](https://circleci.com/gh/Designed-Platform/designed-backend/tree/master)

**Staging (Develop)**

[![CircleCI](https://circleci.com/gh/Designed-Platform/designed-backend/tree/develop.svg?style=svg&circle-token=f06badee0c76a6ba65591024ff14d8d65a5cab4c)](https://circleci.com/gh/Designed-Platform/designed-backend/tree/develop)

## CodeClimate

[![Maintainability](https://api.codeclimate.com/v1/badges/67fe81720e269cf63feb/maintainability)](https://codeclimate.com/repos/5a9bfccf0a801c028700176d/maintainability)

[![Test Coverage](https://api.codeclimate.com/v1/badges/67fe81720e269cf63feb/test_coverage)](https://codeclimate.com/repos/5a9bfccf0a801c028700176d/test_coverage)

# Prerequisites

Install yarn: https://yarnpkg.com/en/docs/install

> yarn global add serverless

> yarn global add webpack

> serverless config credentials --provider aws --key XXXX --secret XXXXX

# Installation

Clone or download [designed backend](https://github.com/Designed-Platform/designed-backend/tree/develop) from github.

### Designed Backend

prerequisites:

> enter "app-backend/dynamodb" folder

> create a file named "credential.yml" and get data from other developers.

> create a folder named "db"


In your terminal/console run:

> yarn

> cd app-backend/dynamodb && yarn

> yarn start


to use graphql playground, go to,
http://localhost:4000/playground

and to use the old graphiql IDE,
http://localhost:4000/graphql 
