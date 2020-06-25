import dynamoose, { Schema } from 'dynamoose'
import Channelmember from '../../../models/Channelmember.model'
import Raven from '../../helpers/raven'

import winston from 'winston'
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'error',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
})

export default {
<<<<<<< HEAD:graphql/collections/message/helper.js
  verifyChannelAccess: async (userId, channelId) => {
    const channelAccess = await Channelmember.query("channel")
      .eq(channelId)
      .and()
      .where("user")
      .eq(userId)
      .exec()
=======
    verifyChannelAccess: async (userId, channelId) => {
        const channelAccess = await Channelmember.query('channel')
        .eq(channelId)
        .and()
        .where('user')
        .exec()
>>>>>>> 42573f9c1abdad6b68971421017186bbada44b28:graphql/collections/message/helper.ts

    if (channelAccess.count > 0) {
      return true
    } else {
      return false
    }
  }
}
