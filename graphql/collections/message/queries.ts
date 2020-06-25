import { stringArg, extendType } from 'nexus';
import { Channel, Feed, Inbox } from './types';
import resolvers from './queries.resolvers';

const messageQuery = extendType(
  {
    type: 'Query',
    definition(t) {
      t.field('channel', {
        resolve: resolvers.channel,
        type: Channel,
        nullable: true,
        args: {
          id: stringArg(),
        },
      });
      t.field('channelFeed', {
        resolve: resolvers.channelFeed,
        type: Feed,
        nullable: true,
        args: {
          id: stringArg({ required: true }),
          type: stringArg(),
          cursor: stringArg(),
        },
      });
      t.field('userChannels', {
        resolve: resolvers.userChannels,
        type: Inbox,
        nullable: true,
        args: {
          cursor: stringArg(),
        },
      });
    },
  });
export default messageQuery;
