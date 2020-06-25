import dynamoose, { Schema } from 'dynamoose'
import Channel from '../../../models/Channel.model'
import Channelmessage from '../../../models/Channelmessage.model'
import Channelmember from '../../../models/Channelmember.model'
import auth from '../../helpers/auth'
import Raven from '../../helpers/raven'
import messageHelper from './helper'
import Ably from 'ably'
import Promise from 'bluebird'

<<<<<<< HEAD:graphql/collections/message/queries.resolvers.js
import crypto from "crypto"

const algorithm = "aes-128-ecb"
const cryptokey = process.env.CURSOR_CRYPTO_KEY
const clearEncoding = "buffer"
const cipherEncoding = "base64"

import winston from "winston"

=======
import crypto from 'crypto'
const algorithm = 'aes-128-ecb'
const cryptokey = process.env.CURSOR_CRYPTO_KEY
const clearEncoding = 'buffer'
const cipherEncoding = 'base64'

import winston from 'winston'
>>>>>>> 42573f9c1abdad6b68971421017186bbada44b28:graphql/collections/message/queries.resolvers.ts
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'error',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
})
export default {
  channel: async (_, args, context) => {
    try {
      const tokenUser = await auth.verify(
        context.event.headers.authorization || args.userinfo_access_token
      )
      if (!tokenUser.error) {
<<<<<<< HEAD:graphql/collections/message/queries.resolvers.js
        logger.log("debug", "Get channel" + args.id)
        const channelAccess = await messageHelper.verifyChannelAccess(
          tokenUser.sub,
          args.id
        )
        if (channelAccess === true) {
          const channel = await Channel.queryOne("id")
=======
        logger.log('debug', 'Get channel'+args.id)
        const channelAccess = await messageHelper.verifyChannelAccess( tokenUser.sub, args.id )
        if(channelAccess===true){
          const channel = await Channel.queryOne('id')
>>>>>>> 42573f9c1abdad6b68971421017186bbada44b28:graphql/collections/message/queries.resolvers.ts
            .eq(args.id)
            .exec()
          return channel
        } else {
          return {
            error: 'Error getting channel',
            message: ''
          }
        }
      } else {
        return {
          error: 'Error getting channel',
          message: ''
        }
      }
    } catch (error) {
      logger.log('error', error, {
        referenceid: args.id ? args.id : ''
      })
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'message',
          resolvefunction: 'channel',
          referenceid: args.id ? args.id : ''
        }
      })
      return null
    }
  },
  channelFeed: async (_, args, context) => {
    try {
      const tokenUser = await auth.verify(
        context.event.headers.authorization || args.userinfo_access_token
      )
      if (!tokenUser.error) {
        const limit = 12 // 10 equals the max height of messages to have a scrollbar
        let startAt = null

        const channelAccess = await messageHelper.verifyChannelAccess(
          tokenUser.sub,
          args.id
        )

<<<<<<< HEAD:graphql/collections/message/queries.resolvers.js
        if (channelAccess === true) {
          if (args.cursor && args.cursor !== "") {
            try {
              var decipher = crypto.createDecipheriv(
                algorithm,
                cryptokey,
                new Buffer("")
              )
              var plainCursor = ""
              plainCursor = decipher.update(
                args.cursor,
                cipherEncoding,
                clearEncoding
              )
=======
          if(args.cursor&&args.cursor!==''){
            try{
              const decipher = crypto.createDecipheriv(algorithm, cryptokey, new Buffer(''))
              let plainCursor = ''
              plainCursor = decipher.update(args.cursor, cipherEncoding, clearEncoding)
>>>>>>> 42573f9c1abdad6b68971421017186bbada44b28:graphql/collections/message/queries.resolvers.ts
              plainCursor += decipher.final(clearEncoding)
              startAt = JSON.parse(plainCursor)
            } catch (error) {
              console.log(error)
            }
          } else {
            // set unread to 0 here
            try {
              Channelmember.update({
                channel: args.id,
                user: tokenUser.sub,
                unreadMessages: 0
              })
            } catch (error) {
              console.log(error)
            }
          }
<<<<<<< HEAD:graphql/collections/message/queries.resolvers.js

          logger.log("debug", "Get channel msgs " + args.id)

          if (args.type && args.type !== "") {
            const messages = await Channelmessage.query("channel")
              .eq(args.id)
=======
  
          logger.log('debug', 'Get channel msgs '+args.id)
  
          if(args.type&&args.type!==''){
            const messages = await Channelmessage.query('channel')
              .eq(args.id)  
>>>>>>> 42573f9c1abdad6b68971421017186bbada44b28:graphql/collections/message/queries.resolvers.ts
              .and()
              .filter('file')
              .not()
              .null()
              .descending()
              .limit(limit)
              .startAt(startAt)
              .exec()

            return {
              cursor: "",
              messages: messages.reverse()
            }
<<<<<<< HEAD:graphql/collections/message/queries.resolvers.js
          } else {
            const messages = await Channelmessage.query("channel")
=======
          }else{
            const messages = await Channelmessage.query('channel')
>>>>>>> 42573f9c1abdad6b68971421017186bbada44b28:graphql/collections/message/queries.resolvers.ts
              .eq(args.id)
              .descending()
              .limit(limit)
              .startAt(startAt)
              .exec()
<<<<<<< HEAD:graphql/collections/message/queries.resolvers.js

            //encrypt startAtKey
            var cipherCursor = ""
            if (messages.lastKey) {
              try {
                var cipher = crypto.createCipheriv(
                  algorithm,
                  cryptokey,
                  new Buffer("")
                )
                cipherCursor = cipher.update(
                  new Buffer(JSON.stringify(messages.lastKey), "utf8"),
                  clearEncoding,
                  cipherEncoding
                )
                cipherCursor += cipher.final(cipherEncoding)
              } catch (error) {
                console.log(error)
              }
            }

=======
  
              // encrypt startAtKey
              let cipherCursor = ''
              if(messages.lastKey){
                try{
                  const cipher = crypto.createCipheriv(algorithm, cryptokey, new Buffer(''))              
                  cipherCursor = cipher.update(new Buffer(JSON.stringify(messages.lastKey), 'utf8'), clearEncoding, cipherEncoding)
                  cipherCursor += cipher.final(cipherEncoding)
                }catch(error){
                  console.log(error)
                }
              }            
              
              
>>>>>>> 42573f9c1abdad6b68971421017186bbada44b28:graphql/collections/message/queries.resolvers.ts
            return {
              cursor: cipherCursor,
              messages: messages.reverse()
            }
          }
        } else {
          console.log("Unauthorized")
          return {
            error: 'Unauthorized',
            message: ''
          }
        }
      } else {
        return {
          error: 'Error getting channel',
          message: ''
        }
      }
    } catch (error) {
      console.log(error)
      logger.log('error', error, {
        referenceid: args.id ? args.id : ''
      })
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'message',
          resolvefunction: 'channel',
          referenceid: args.id ? args.id : ''
        }
      })
      return null
    }
  },
  userChannels: async (_, args, context) => {
    try {
      const tokenUser = await auth.verify(
        context.event.headers.authorization || args.userinfo_access_token
      )
      if (!tokenUser.error) {
        const limit = 10
        let startAt = null

<<<<<<< HEAD:graphql/collections/message/queries.resolvers.js
        if (args.cursor && args.cursor !== "") {
          try {
            var decipher = crypto.createDecipheriv(
              algorithm,
              cryptokey,
              new Buffer("")
            )
            var plainCursor = ""
            plainCursor = decipher.update(
              args.cursor,
              cipherEncoding,
              clearEncoding
            )
=======
        if(args.cursor&&args.cursor!==''){
          try{
            const decipher = crypto.createDecipheriv(algorithm, cryptokey, new Buffer(''))
            let plainCursor = ''
            plainCursor = decipher.update(args.cursor, cipherEncoding, clearEncoding)
>>>>>>> 42573f9c1abdad6b68971421017186bbada44b28:graphql/collections/message/queries.resolvers.ts
            plainCursor += decipher.final(clearEncoding)
            startAt = JSON.parse(plainCursor)
          } catch (error) {
            console.log(error)
          }
        }

<<<<<<< HEAD:graphql/collections/message/queries.resolvers.js
        logger.log("debug", "Get user channels " + tokenUser.sub)
        const channels = await Channelmember.query("user")
          .eq(tokenUser.sub)
          .limit(limit)
          .startAt(startAt)
          .descending()
          .exec()
        //encrypt startAtKey
        var cipherCursor = ""
        try {
          var cipher = crypto.createCipheriv(
            algorithm,
            cryptokey,
            new Buffer("")
          )
          cipherCursor = cipher.update(
            new Buffer(JSON.stringify(channels.lastKey), "utf8"),
            clearEncoding,
            cipherEncoding
          )
=======
        logger.log('debug', 'Get user channels '+tokenUser.sub)
        const channels = await Channelmember.query('user')
            .eq(tokenUser.sub)
            .limit(limit)     
            .startAt(startAt)   
            .descending()
            .exec()
        // encrypt startAtKey
        let cipherCursor = ''
        try{
          const cipher = crypto.createCipheriv(algorithm, cryptokey, new Buffer(''))              
          cipherCursor = cipher.update(new Buffer(JSON.stringify(channels.lastKey), 'utf8'), clearEncoding, cipherEncoding)
>>>>>>> 42573f9c1abdad6b68971421017186bbada44b28:graphql/collections/message/queries.resolvers.ts
          cipherCursor += cipher.final(cipherEncoding)
        } catch (error) {
          console.log(error)
        }

        return {
          cursor: cipherCursor,
          channels
        }
      } else {
        return {
          error: 'Error getting userChannels',
          message: ''
        }
      }
    } catch (error) {
      logger.log('error', error, {
        referenceid: tokenUser.sub ? tokenUser.sub : ''
      })
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'message',
          resolvefunction: 'userChannels',
          referenceid: tokenUser.sub ? tokenUser.sub : ''
        }
      })
      return null
    }
  }
}
