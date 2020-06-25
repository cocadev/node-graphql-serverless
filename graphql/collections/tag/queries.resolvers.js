import dynamoose, { Schema } from 'dynamoose'
import Tag from '../../../models/Tag.model'
import auth from '../../helpers/auth'
import uuid from 'uuid'

export default {
  tagList: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token
    )
    if (!tokenUser.error) {
      const tags = await Tag.scan().exec()
      return tags
      //   TODO sort by text
    } else {
      return []
    }
  },
  tagsByAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token
    )
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      return await Tag.scan().exec()
    } else {
      return []
    }
  }
}
