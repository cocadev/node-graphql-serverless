import { objectType, inputObjectType } from 'nexus';

export const Channel = objectType(
  {
    name: 'Channel',
    definition(t) {
      t.string('id', { nullable: true });
      t.string('channel', { nullable: true });
      t.string('type', { nullable: true });
      t.string('image', { nullable: true });
      t.string('name', { nullable: true });
      t.string('last_message_on', { nullable: true });
      t.string('last_message', { nullable: true });
      t.int('unreadMessages', { nullable: true });
      t.string('createdby', { nullable: true });
      t.string('createdon', { nullable: true });
    },
  });
export const Feed = objectType(
  {
    name: 'Feed',
    definition(t) {
      t.string('cursor', { nullable: true });
      t.field('messages', {
        type: Message,
        list: [false],
        nullable: true,
      });
    },
  });
export const Inbox = objectType(
  {
    name: 'Inbox',
    definition(t) {
      t.string('cursor', { nullable: true });
      t.field('channels', {
        type: Channel,
        list: [false],
        nullable: true,
      });
    },
  });
export const Message = objectType(
  {
    name: 'Message',
    definition(t) {
      t.string('id', { nullable: true });
      t.string('file', { nullable: true });
      t.string('filetype', { nullable: true });
      t.string('filename', { nullable: true });
      t.string('sender', { nullable: true });
      t.string('message', { nullable: true });
      t.string('channel', { nullable: true });
      t.string('createdon', { nullable: true });
    },
  });

export const createChannelInputType = inputObjectType(
  {
    name: 'createChannelInputType',
    definition(t) {
      t.string('channelMemberId');
      t.string('type');
    },
  });
export const createMessageInputType = inputObjectType(
  {
    name: 'createMessageInputType',
    definition(t) {
      t.string('message');
      t.string('channel');
    },
  });
export default {
  Channel,
  createChannelInputType,
  createMessageInputType,
  Feed,
  Inbox,
  Message,
};
