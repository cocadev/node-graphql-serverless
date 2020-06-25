import { objectType, extendType } from 'nexus';
import { Donation } from './types';
import resolvers from './queries.resolvers';

const donationQuery = extendType(
  {
    type: 'Query',
    definition(t) {
      t.field('donations', { // @cacheControl(maxAge: 600)
        type: Donation,
        list: [false],
        nullable: true,
        resolve: resolvers.donations,
      });
    },
  });
export default donationQuery;
