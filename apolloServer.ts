import myGraphQLSchema from './graphql/collections/schema';
import { ApolloServer } from 'apollo-server-lambda';
import AlgoliaUsers from './datasource/algoliaUsersDatasource';
import AlgoliaJobs from './datasource/algoliaJobsDatasource';

export const apolloServer = new ApolloServer(
  {
    schema: myGraphQLSchema,
    dataSources: () => ({
      algoliaUsers: AlgoliaUsers,
      algoliaJobs: AlgoliaJobs,
    }),
    engine: {
      apiKey:
        process.env.SERVERLESS_STAGE === 'production'
          ? 'service:production-designed:1l0VMnZgP9WV416AQSFxHw'
          : process.env.IS_OFFLINE
          ? 'service:local-designed:fFgkHRixiEp5I4W-N_9XcA'
          : 'service:staging-designed:I2NtcB5wKqMLrEMjtkp5lQ',
    },
    tracing: false,
    cacheControl: { defaultMaxAge: 5 },
    context: ({ event, context }) => ({
      headers: event.headers,
      functionName: context.functionName,
      event,
      context,
    }),
  });
