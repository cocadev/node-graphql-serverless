import crypto from 'crypto';
import winston from 'winston';
import Organisation from '../../../models/Organisation.model';
import auth from '../../helpers/auth';
import Raven from '../../helpers/raven';
import { getOrganisationForScrapper } from '../career/helper/queries.helper';

const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const algorithm = 'aes-128-ecb';
const cryptokey = process.env.CURSOR_CRYPTO_KEY;
const clearEncoding = 'buffer';
const cipherEncoding = 'base64';

const logger = winston.createLogger(
  {
    level: process.env.LOG_LEVEL || 'error',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
  });

export default {
  organisation: async (_, args, context) => {
    try {
      const tokenUser = await auth.verify(context.event.headers.authorization);
      if (!tokenUser.error) {
        return Organisation.queryOne('id')
          .eq(args.id)
          .exec();
      } else {
        return null;
      }
    } catch (error) {
      logger.log('error', error, {
        referenceid: args.id ? args.id : '',
      });
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'organisation',
          resolvefunction: 'organisation',
          referenceid: args.id ? args.id : '',
        },
      });
      return null;
    }
  },
  organisationListForAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    // console.log(tokenUser)
    if (!tokenUser.error) {
      if (tokenUser.roles && tokenUser.roles.includes('Admin')) {
        return Organisation.scan().exec();
      }
    }
    return null;
  },
  organisationDetailFromAdmin: async (_, args, context) => {
    try {
      const tokenUser = await auth.verify(context.event.headers.authorization);
      if (
        !tokenUser.error &&
        tokenUser.roles &&
        tokenUser.roles.includes('Admin')
      ) {
        return Organisation.queryOne('id')
          .eq(args.id)
          .exec();
      } else {
        return null;
      }
    } catch (error) {
      logger.log('error', error, {
        referenceid: args.id ? args.id : '',
      });
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'organisation',
          resolvefunction: 'organisationDetailFromAdmin',
          referenceid: args.id ? args.id : '',
        },
      });
      return null;
    }
  },

  organisationFeed: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (!tokenUser.error) {
      const limit = 12; // 10 equals the max height of messages to have a scrollbar
      let startAt = null;
      if (args.cursor && args.cursor !== '') {
        try {
          const decipher = crypto.createDecipheriv(algorithm, cryptokey, new Buffer(''));
          let plainCursor: string;
          // @ts-ignore
          plainCursor = decipher.update(args.cursor, cipherEncoding, clearEncoding);
          plainCursor += decipher.final(clearEncoding);
          startAt = JSON.parse(plainCursor);
        } catch (error) {
          console.log(error);
        }
      }

      const orgs = await Organisation.scan()
      // .eq(args.id)
      // .descending()
        .limit(limit)
        .startAt(startAt)
        .exec();

      // encrypt startAtKey
      let cipherCursor = '';
      if (orgs.lastKey) {
        try {
          const cipher = crypto.createCipheriv(algorithm, cryptokey, new Buffer(''));
          // @ts-ignore
          cipherCursor = cipher.update(
            new Buffer(JSON.stringify(orgs.lastKey), 'utf8'),
            clearEncoding,
            cipherEncoding,
          );
          cipherCursor += cipher.final(cipherEncoding);
        } catch (error) {
          console.log(error);
        }
      }
      return {
        lastKey: cipherCursor,
        organisations: orgs.reverse(),
      };
    } else {
      return [];
    }
  },

  getOrganisationForScrapper: async (_, { name }) => {
    if (!name || name === '') {
      return null;
    }
    try {
      return await getOrganisationForScrapper(Organisation, name);
    } catch (error) {
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'organisation',
          resolvefunction: 'organisation',
          referenceid: name ? name : '',
        },
      });
      return null;
    }
  },
};
