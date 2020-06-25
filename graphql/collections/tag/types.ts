import { objectType, inputObjectType } from 'nexus';

export const TagBaseType = objectType(
  {
    name: 'TagBaseType',
    definition(t) {
      t.string('id', { nullable: true });
      t.string('text', { nullable: true });
    },
  });

export const TagInputType = inputObjectType(
  {
    name: 'TagInputType',
    definition(t) {
      t.string('id');
      t.string('text');
    },
  });
export default { TagBaseType, TagInputType };
