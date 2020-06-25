import { objectType, inputObjectType } from 'nexus';

export const Organisation = objectType(
  {
    name: 'Organisation',
    definition(t) {
      t.string('id', { nullable: true });
      t.string('domain', { nullable: true });
      t.string('name', { nullable: true });
      t.string('createdAt', { nullable: true });
      t.string('updatedAt', { nullable: true });
      t.string('avatarUrl', { nullable: true });
      t.string('status', { nullable: true });
    },
  });
export const OrganisationFeed = objectType(
  {
    name: 'OrganisationFeed',
    definition(t) {
      t.string('lastKey', { nullable: true });
      t.field('organisations', {
        type: Organisation,
        list: [false],
        nullable: true,
      });
    },
  });

export const createOrganisationType = inputObjectType(
  {
    name: 'createOrganisationType',
    definition(t) {
      t.string('domain', { required: true });
      t.string('name');
    },
  });
export const updateOrganisationType = inputObjectType(
  {
    name: 'updateOrganisationType',
    definition(t) {
      t.string('id', { required: true });
      t.string('domain');
      t.string('name');
    },
  });
export default {
  createOrganisationType,
  Organisation,
  OrganisationFeed,
  updateOrganisationType,
};
