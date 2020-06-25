import crypto from 'crypto';
import winston from 'winston';
import Channel from '../../../models/Channel.model';
import Channelmember from '../../../models/Channelmember.model';
import Channelmessage from '../../../models/Channelmessage.model';
import auth from '../../helpers/auth';
import Raven from '../../helpers/raven';
import messageHelper from './helper';

const algorithm = 'aes-128-ecb';
const cryptokey = process.env.CURSOR_CRYPTO_KEY;
const clearEncoding = 'buffer';
const cipherEncoding = 'base64';

const logger = winston.createLogger({
                                      level: process.env.LOG_LEVEL || 'error',
                                      format: winston.format.json(),
                                      transports: [new winston.transports.Console()],
                                    });
export default {
  channel: async (_, args, context) => {
    try {
      const tokenUser = await auth.verify(
        context.event.headers.authorization || args.userinfo_access_token,
      );
      if (!tokenUser.error) {
        logger.log('debug', 'Get channel' + args.id);
        const channelAccess = await messageHelper.verifyChannelAccess(
          tokenUser.sub,
          args.id,
        );
        if (channelAccess === true) {
          return Channel.queryOne('id')
            .eq(args.id)
            .exec();
        } else {
          return {
            error: 'Error getting channel',
            message: '',
          };
        }
      } else {
        return {
          error: 'Error getting channel',
          message: '',
        };
      }
    } catch (error) {
      logger.log('error', error, {
        referenceid: args.id ? args.id : '',
      });
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'message',
          resolvefunction: 'channel',
          referenceid: args.id ? args.id : '',
        },
      });
      return null;
    }
  },
  channelFeed: async (_, args, context) => {
    try {
      const tokenUser = await auth.verify(
        context.event.headers.authorization || args.userinfo_access_token,
      );
      if (!tokenUser.error) {
        const limit = 12; // 10 equals the max height of messages to have a scrollbar
        let startAt = null;

        const channelAccess = await messageHelper.verifyChannelAccess(
          tokenUser.sub,
          args.id,
        );

        if (channelAccess === true) {
          if (args.cursor && args.cursor !== '') {
            try {
              const decipher = crypto.createDecipheriv(
                algorithm,
                cryptokey,
                new Buffer(''),
              );
              let plainCursor: any;
              // @ts-ignore
              plainCursor = decipher.update(
                args.cursor,
                cipherEncoding,
                clearEncoding,
              );
              plainCursor += decipher.final(clearEncoding);
              startAt = JSON.parse(plainCursor);
            } catch (error) {
              console.log(error);
            }
          } else {
            // set unread to 0 here
            try {
              Channelmember.update({
                                     channel: args.id,
                                     user: tokenUser.sub,
                                     unreadMessages: 0,
                                   });
            } catch (error) {
              console.log(error);
            }
          }
          logger.log('debug', 'Get channel msgs ' + args.id);
          if (args.type && args.type !== '') {
            const messages = await Channelmessage.query('channel')
              .eq(args.id)
              .and()
              .filter('file')
              .not()
              .null()
              .descending()
              .limit(limit)
              .startAt(startAt)
              .exec();
            return {
              cursor: '',
              messages: messages.reverse(),
            };
          } else {
            const messages = await Channelmessage.query('channel')
              .eq(args.id)
              .descending()
              .limit(limit)
              .startAt(startAt)
              .exec();

            // encrypt startAtKey
            let cipherCursor: any;
            if (messages.lastKey) {
              try {
                const cipher = crypto.createCipheriv(
                  algorithm,
                  cryptokey,
                  new Buffer(''),
                );
                // @ts-ignore
                cipherCursor = cipher.update(
                  new Buffer(JSON.stringify(messages.lastKey), 'utf8'),
                  clearEncoding,
                  cipherEncoding,
                );
                cipherCursor += cipher.final(cipherEncoding);
              } catch (error) {
                console.log(error);
              }
            }
            return {
              cursor: cipherCursor,
              messages: messages.reverse(),
            };
          }
        } else {
          console.log('Unauthorized');
          return {
            error: 'Unauthorized',
            message: '',
          };
        }
      } else {
        return {
          error: 'Error getting channel',
          message: '',
        };
      }
    } catch (error) {
      console.log(error);
      logger.log('error', error, {
        referenceid: args.id ? args.id : '',
      });
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'message',
          resolvefunction: 'channel',
          referenceid: args.id ? args.id : '',
        },
      });
      return null;
    }
  },
  userChannels: async (_, args, context) => {
    let tokenUser: any;
    try {
      tokenUser = await auth.verify(
        context.event.headers.authorization || args.userinfo_access_token,
      );
      if (!tokenUser.error) {
        const limit = 10;
        let startAt = null;

        if (args.cursor && args.cursor !== '') {
          try {
            const decipher = crypto.createDecipheriv(
              algorithm,
              cryptokey,
              new Buffer(''),
            );
            let plainCursor: any;
            // @ts-ignore
            plainCursor = decipher.update(
              args.cursor,
              cipherEncoding,
              clearEncoding,
            );
            plainCursor += decipher.final(clearEncoding);
            startAt = JSON.parse(plainCursor);
          } catch (error) {
            console.log(error);
          }
        }

        logger.log('debug', 'Get user channels ' + tokenUser.sub);
        const channels = await Channelmember.query('user')
          .eq(tokenUser.sub)
          .limit(limit)
          .startAt(startAt)
          .descending()
          .exec();
        // encrypt startAtKey
        let cipherCursor: any;
        try {
          const cipher = crypto.createCipheriv(
            algorithm,
            cryptokey,
            new Buffer(''),
          );
          // @ts-ignore
          cipherCursor = cipher.update(
            new Buffer(JSON.stringify(channels.lastKey), 'utf8'),
            clearEncoding,
            cipherEncoding,
          );
          cipherCursor += cipher.final(cipherEncoding);
        } catch (error) {
          console.log(error);
        }

        return {
          cursor: cipherCursor,
          channels,
        };
      } else {
        return {
          error: 'Error getting userChannels',
          message: '',
        };
      }
    } catch (error) {
      logger.log('error', error, {
        referenceid: tokenUser.sub ? tokenUser.sub : '',
      });
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'message',
          resolvefunction: 'userChannels',
          referenceid: tokenUser.sub ? tokenUser.sub : '',
        },
      });
      return null;
    }
  },
};
