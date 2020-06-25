import { makeSchema, objectType, mutationType, queryType } from 'nexus';
import { mergeSchemas } from 'apollo-server-lambda';

import * as path from 'path';
import * as userTypes from './user';
import * as updateTypes from './update';
import * as donationTypes from './donation';
import * as tagTypes from './tag';
import * as careerTypes from './career';
import * as sharedTypes from './shared';
import * as messageTypes from './message';
import * as organisationTypes from './organisation';

const Mutation = mutationType(
  {
    definition() {
      return;
    },
  });

const Query = queryType(
  {
    definition() {
      return;
    },
  });

const allTypes = [
  Query,
  Mutation,
  userTypes,
  updateTypes,
  donationTypes,
  tagTypes,
  careerTypes,
  sharedTypes,
  messageTypes,
  organisationTypes,
];

export const schema = makeSchema(
  {
    outputs: {
      schema: path.join(
        path.dirname(path.resolve(__filename)),
        './generated/nexus-schema.graphql',
      ),
      typegen: path.join(
        path.dirname(path.resolve(__filename)),
        './generated/nexus-schema-typegen.ts',
      ),
    },
    types: allTypes,
  });
