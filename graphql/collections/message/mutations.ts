import { arg, stringArg, extendType } from 'nexus';
import { Channel, createChannelInputType, createMessageInputType, Message } from './types';
import { DefaultPayloadType } from '../shared';
import resolvers from './mutations.resolvers';

const messageMutation = extendType(
  {
    type: 'Mutation',
    definition(t) {
      t.field('createChannel', {
        resolve: resolvers.createChannel,
        type: Channel,
        nullable: true,
        args: {
          input: arg({ type: createChannelInputType }),
        },
      });
      t.field('createMessage', {
        resolve: resolvers.createMessage,
        type: Message,
        nullable: true,
        args: {
          input: arg({ type: createMessageInputType }),
        },
      });
      t.field('uploadChannelFile', {
        resolve: resolvers.uploadChannelFile,
        type: DefaultPayloadType,
        nullable: true,
        args: {
          channel: stringArg({ required: true }),
          content: stringArg({ required: true }),
          filetype: stringArg({ required: true }),
          filename: stringArg({ required: true }),
        },
      });
      t.string('getFile', {
        resolve: resolvers.getFile,
        nullable: true,
        args: {
          channel: stringArg({ required: true }),
          file: stringArg({ required: true }),
        },
      });
      // @ts-ignore
      t.string('subscriberToken', {
        resolve: resolvers.subscriberToken,
        nullable: true,
      });
    },
  });
export default messageMutation;
