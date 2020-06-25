import { objectType, stringArg, booleanArg, arg, extendType } from 'nexus';
import { Job, updateJobType, updateCompanyType } from './types';
import { DefaultPayloadType } from '../shared';
import resolvers from './mutations.resolvers';

const careerMutation = extendType(
  {
    type: 'Mutation',
    definition(t) {
      t.field('createJob', {
        resolve: resolvers.createJob,
        type: Job,
        nullable: true,
        args: {
          title: stringArg({ required: true }),
          type: stringArg({ required: true }),
          experience: stringArg(),
          remoteFriendly: booleanArg({ required: true }),
          jobInfoUrl: stringArg(),
          logoImageFile: stringArg(),
          description: stringArg(),
          source: stringArg(),
          company: arg({ type: updateCompanyType }),
        },
      });
      t.field('updateJob', {
        resolve: resolvers.updateJob,
        type: DefaultPayloadType,
        nullable: true,
        args: {
          input: arg({ type: updateJobType }),
          logoImageFile: stringArg(),
        },
      });
      t.field('deleteJob', {
        resolve: resolvers.deleteJob,
        type: DefaultPayloadType,
        nullable: true,
        args: {
          id: stringArg({ required: true }),
        },
      });
      t.field('deleteAllJobs', {
        resolve: resolvers.deleteAllJobs,
        type: DefaultPayloadType,
        nullable: true,
      });
    },
  });

export default careerMutation;
