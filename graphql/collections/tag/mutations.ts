import { stringArg, arg, extendType } from 'nexus';
import { TagInputType } from './types';
import resolvers from './mutations.resolvers';
import { DefaultPayloadType } from '../shared';

const tagMutation = extendType(
  {
    type: 'Mutation',
    definition(t) {
      t.field('createTag', {
        type: DefaultPayloadType,
        nullable: true,
        args: {
          text: stringArg({ required: true }),
        },
        resolve: resolvers.createTag,
      });
      t.field('deleteTagByAdmin', {
        type: DefaultPayloadType,
        nullable: true,
        args: {
          id: stringArg({ required: true }),
        },
        resolve: resolvers.deleteTagByAdmin,
      });
      t.field('mergeTagsByAdmin', {
        type: DefaultPayloadType,
        nullable: true,
        args: {
          tagsToMerge: arg({
                             type: TagInputType,
                             list: [false],
                             required: true,
                           }),
          newTagText: stringArg({ required: true }),
        },
        resolve: resolvers.mergeTagsByAdmin,
      });
    },
  });
export default tagMutation;
