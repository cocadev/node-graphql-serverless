import { arg, stringArg, extendType } from 'nexus';
import { DefaultPayloadType } from '../shared';
import { createOrganisationType, updateOrganisationType, Organisation } from './types';
import resolvers from './mutations.resolvers';

const organisationMutation = extendType(
  {
    type: 'Mutation',
    definition(t) {
      t.field('createOrganisation', {
        resolve: resolvers.createOrganisation,
        type: DefaultPayloadType,
        nullable: true,
        args: {
          input: arg({ type: createOrganisationType }),
        },
      });
      t.field('updateOrganisation', {
        resolve: resolvers.updateOrganisation,
        type: DefaultPayloadType,
        nullable: true,
        args: {
          input: arg({ type: updateOrganisationType }),
        },
      });
      t.field('updateOrganisationByAdmin', {
        resolve: resolvers.updateOrganisationByAdmin,
        type: DefaultPayloadType,
        nullable: true,
        args: {
          input: arg({ type: updateOrganisationType }),
        },
      });
      t.field('deleteOrganisationByAdmin', {
        resolve: resolvers.deleteOrganisationByAdmin,
        type: DefaultPayloadType,
        nullable: true,
        args: {
          id: stringArg({ required: true }),
        },
      });
      t.field('checkOrganisationByNameAndDomain', {
        resolve: resolvers.checkOrganisationByNameAndDomain,
        type: Organisation,
        nullable: true,
        args: {
          name: stringArg({ required: true }),
          domain: stringArg({ required: true }),
        },
      });
    },
  });
export default organisationMutation;
