import _ from 'lodash';
import userResolver from './user/resolvers';
import tagResolver from './tag/resolvers';
import careerResolver from './career/resolvers';
import donationResolver from './donation/resolvers';
import messageResolver from './message/resolvers';
import organisationResolver from './organisation/resolvers';

const resolvers = {};

_.merge(
  resolvers,
  userResolver,
  tagResolver,
  careerResolver,
  donationResolver,
  messageResolver,
  organisationResolver,
);

export default resolvers;
