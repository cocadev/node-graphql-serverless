import { makeExecutableSchema, mergeSchemas } from 'graphql-tools';
import typeDefs from './typeDefs';
import resolvers from './rootResolvers';
import { schema as updateSchema } from './update/schema';

const oldSchemas = makeExecutableSchema({
  typeDefs,
  resolvers,
  logger: console,
});

export default mergeSchemas({
  schemas: [oldSchemas, updateSchema],
});
