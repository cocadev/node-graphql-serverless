import { extendType } from 'nexus';
import { TagBaseType } from './types';
import resolvers from './queries.resolvers';

const tagQuery = extendType(
  {
    type: 'Query',
    definition(t) {
      t.field('tagList', {
        type: TagBaseType,
        list: [false],
        nullable: true,
        resolve: resolvers.tagList,
      });
      t.field('tagsByAdmin', {
        type: TagBaseType,
        list: [false],
        nullable: true,
        resolve: resolvers.tagsByAdmin,
      });
    },
  });

export default tagQuery;
