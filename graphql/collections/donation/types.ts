import { objectType } from 'nexus';

export const Donation = objectType(
  {
    name: 'Donation',
    definition(t) {
      t.string('id', { nullable: true });
      t.string('date', { nullable: true });
      t.string('amount', { nullable: true });
      t.string('method', { nullable: true });
      t.string('type', { nullable: true });
    },
  });
export default {
  Donation,
};
