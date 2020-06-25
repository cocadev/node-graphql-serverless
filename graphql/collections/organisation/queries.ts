import { stringArg, extendType } from 'nexus';
import { Organisation, OrganisationFeed } from './types';
import resolvers from './queries.resolvers';

const Query = extendType(
  {
    type: 'Query',
    definition(t) {
      t.field('organisation', {
        resolve: resolvers.organisation,
        type: Organisation,
        nullable: true,
        args: {
          id: stringArg({ required: true }),
        },
      });
      t.field('organisationDetailFromAdmin', {
        resolve: resolvers.organisationDetailFromAdmin,
        type: Organisation,
        nullable: true,
        args: {
          id: stringArg({ required: true }),
        },
      });
      t.field('organisationListForAdmin', {
        resolve: resolvers.organisationListForAdmin,
        type: Organisation,
        list: [false],
        nullable: true,
      });
      t.field('organisationFeed', {
        resolve: resolvers.organisationFeed,
        type: OrganisationFeed,
        nullable: true,
        args: {
          lastKey: stringArg(),
        },
      });
      t.field('getOrganisationForScrapper', {
        resolve: resolvers.getOrganisationForScrapper,
        type: Organisation,
        nullable: true,
        args: {
          name: stringArg({ required: true }),
        },
      });
    },
  });
export default Query;
