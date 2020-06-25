import 'idempotent-babel-polyfill';
import 'source-map-support';
import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { apolloServer } from './apolloServer';
import Raven from './graphql/helpers/raven'; // Official `raven` module

export const graphqlHandler: Handler = (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback,
) => {
  console.log('Lambda Proxy Event: ', event);

  // check for introspection below and allow only for certain headers and offline mode.
  const body = event.body ? JSON.parse(event.body) : {};
  if (
    body &&
    body.query && (
      body.query.indexOf('IntrospectionQuery') !== -1 ||
      body.query.indexOf('__schema') !== -1 ||
      body.query.indexOf('__type{') !== -1
    ) && event.headers.INSPECTME !== '367S8sadSD478SD678sdFD132f6SD7832d'
    && event.headers.inspectme !== '367S8sadSD478SD678sdFD132f6SD7832d'
  ) {
    return callback(null, createResponse(200, { message: 'No introspection' }));
  }
  try {
    const handler = apolloServer.createHandler(
      {
        cors: {
          origin: '*',
          credentials: true,
        },
      });
    return handler(event, context, callback);
  } catch (error) {
    console.log('handler.error.1', error);
    // @ts-ignore
    Raven.captureException(error, {
      tags: {
        error_area: 'handler',
      },
    });
    return callback(null, createResponse(500, { message: 'Error' }));
  }
};
const createResponse = (statusCode: number, body: any) => (
  {
    statusCode,
    headers:
      {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Credentials': 'false',
        'Access-Control-Allow-Headers': 'Cache-Control,' +
          'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,x-apollo-tracing',
      },
    body: JSON.stringify(body),
  }
);
