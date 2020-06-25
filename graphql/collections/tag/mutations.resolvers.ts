import dynamoose, { Schema } from 'dynamoose'
import Tag from '../../../models/Tag.model'
import User from '../../../models/User.model'
import auth from '../../helpers/auth'
import Raven from '../../helpers/raven'
import lodash from 'lodash'

export default {
  createTag: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers)
    if (!tokenUser.error) {
      const result = await Tag.create({
        text: args.text,
        lowercasetext: args.text.toLowerCase()
      })
      return {
        id: result.id,
        message: 'Sucess',
        error: null
      }
    } else {
      return null
    }
  },

  deleteTagByAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers)
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      await Tag.delete(args.id)
      return {
        error: null,
        message: 'Tag deleted'
      }
    } else {
      return {
        error: 'error',
        message: `Tag can't be deleted`
      }
    }
  },
  mergeTagsByAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers)
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      try {
        const result = await Tag.create({
          text: args.newTagText,
          lowercasetext: args.newTagText.toLowerCase()
        })
        const allUsers = await User.scan().exec()
        var updatePromises = []
        args.tagsToMerge.forEach(async tag => {          
          Tag.delete(tag.id) 

          console.log(
            'Tag deleted now update users'
          )
          const usersWithTags = await context.dataSources.algoliaUsers.searchUsers(
            query= '',
            filters=`tags:${tag.text}`,
            // facetFilters=['tags:'+tag.text],
            attributesToRetrieve=['*'],
            facets= ['tags'],
            hitsPerPage=100, 
          );          
          console.log('usersWithTags', usersWithTags)
          if(usersWithTags&&usersWithTags.hits){
            console.log('usersWithTags.hits', usersWithTags.hits)
            usersWithTags.hits.forEach(async user => {              
                updatePromises.push(                  
                  new Promise(async (resolve, reject) => {
                    try {
                      const userId = user.id
                      console.log('userId', userId)
                      const userDynamoDB = await User.queryOne('id').eq(userId).exec()                  
                      console.log('userDynamoDB', userDynamoDB)
                      if(userDynamoDB){
                        console.log('oldUserTags', userDynamoDB.tags)                  
                        if(userDynamoDB.tags){
                          const newUserTags = userDynamoDB.tags.filter(userTag => {
                            if(
                              userTag.id !== tag.id &&
                              userTag.text !== tag.text
                            ){
                              return true
                            }else{
                              return false
                            }
                          });
                          newUserTags.push({
                            id: result.id,
                            text: result.text
                          })
                          console.log(
                            'userDynamoDB.id',
                            userDynamoDB.id
                          )
                          console.log(
                            'newUserTags',
                            newUserTags
                          )          
                          await User.update({
                            id: user.id,
                            tags: newUserTags
                          })
                          resolve(true)
                        }else{
                          resolve (true)
                        }
                    }else{
                      resolve(true)
                    }   
                  } catch (error) {
                    console.log('mergeTagsByAdmin.error', error)
                    Raven.captureException(error, {
                      tags: {
                        userId: user.id ? user.id : '',
                        graphqlcollection: 'tag',
                        resolvefunction: 'mergeTagsByAdmin'            
                      }
                    })
                    reject(true)
                  }
                })
              )                          
            })
          }          
        });  

        await Promise.all(updatePromises)
        return {
          id: result.id,
          error: null,
          message: 'Tags merged'
        }
      } catch (error) {
        console.log('mergeTagsByAdmin.error', error)
        Raven.captureException(error, {
          tags: {
            graphqlcollection: 'tag',
            resolvefunction: 'mergeTagsByAdmin'            
          }
        })
        return {
          error: 'error',
          message: `Tag can't be merged`
        }
      }
      
    } else {
      return {
        error: 'error',
        message: `Tag can't be merged`
      }
    }
  }
}
