import 'handlebars';
import rp from 'request-promise-native';
import winston from 'winston';
import User from '../../../models/User.model';
import auth from '../../helpers/auth';
import Raven from '../../helpers/raven';
import {
  filtersToStringForFacets,
  queryToGetMoreActiveUserByRole,
  queryToGetMoreActiveUserByRoleRandomly,
  queryToGetTotalActiveUserByRole,
} from './queries.helper';
import AWSXRay from 'aws-xray-sdk';
import aws_sdk from 'aws-sdk';

const AWS = AWSXRay.captureAWS(aws_sdk);

const logger = winston.createLogger(
  {
    level: process.env.LOG_LEVEL || 'error',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
  });
if (process.env.IS_OFFLINE) {
  logger.add(
    new winston.transports.Console({
                                     format: winston.format.simple(),
                                   }),
  );
}
export default {
  user: async (_, args, context) => {
    try {
      logger.log('debug', args);
      const tokenUser = await auth.verify(context.event.headers.authorization);
      console.log(tokenUser);
      if (tokenUser.error) {
        logger.log('error', tokenUser.error, {
          graphqlcollection: 'user',
          resolvefunction: 'user',
          referenceid: args.id ? args.id : '',
        });
        return {
          error: 'Error getting user',
          message: '',
        };
      }
      if (tokenUser.roles && tokenUser.roles.includes('Admin') && args.id) {
        // TODO later
        const user = await User.queryOne('id')
          .eq(args.id)
          .exec();
        user.responding_region = process.env.SERVERLESS_REGION;
        return user;
      }
      const user = await User.queryOne('id')
        .eq(tokenUser.sub)
        .exec();
      if (!user && tokenUser.sub) {
        const newUser = new User({
                                   id: tokenUser.sub,
                                   email: tokenUser.email,
                                   // avatarUrl: avatarUrl,
                                   username: tokenUser['cognito:username'] || null,
                                 });
        const timestamp = new Date().getTime();
        newUser.accountCreatedOn = timestamp;
        newUser.accountUpdatedOn = timestamp;
        logger.log('debug', 'Check for user token picture');
        try {
          //if user has default avatar and has picture from token i.e. gravatar etc.
          if (!tokenUser.picture) {
            await newUser.save();
            return newUser;
          }
          logger.log('debug', 'Upload new avatar');
          const s3 = new AWS.S3({
                                  s3ForcePathStyle: true,
                                  region: 'us-east-1',
                                  endpoint: 's3.amazonaws.com',
                                  accessKeyId: process.env.ASSETSS3ACCESSKEY,
                                  secretAccessKey: process.env.ASSETSS3SECRETKEY,
                                });

          const buffer = await rp({
                                    url: tokenUser.picture,
                                    encoding: null,
                                  });
          logger.log('info', buffer);
          if (!buffer) {
            await newUser.save();
            return newUser;
          }
          logger.log('info', 'has buffer of image');
          await s3
            .putObject({
                         Bucket: 'assets.designed.org',
                         Key: 'avatars/networking/' + tokenUser.sub + '/avatar.jpg',
                         Body: buffer,
                         ACL: 'public-read',
                       })
            .promise();
          newUser.avatarUrl =
            'https://assets.designed.org/avatars/networking/' +
            tokenUser.sub +
            '/avatar.jpg';
          await newUser.save();
          return newUser;
          // keep for later consideration face recognition
          // const rekognition = new AWS.Rekognition({
          //   region: process.env.SERVERLESS_REGION,
          //   endpoint: "rekognition.us-east-1.amazonaws.com",
          //   accessKeyId: process.env.ASSETSS3ACCESSKEY,
          //   secretAccessKey: process.env.ASSETSS3SECRETKEY
          // });
          // var params = {
          //   Image: {
          //     Bytes: buffer
          //   },
          //   MaxLabels: 10,
          //   MinConfidence: 50
          // };
          // const imageLabels = await rekognition.detectLabels(params).promise()
          // const labelString = JSON.stringify(imageLabels.Labels)

          // if (
          //   JSON.stringify(labelString).indexOf('Person') !== -1 ||
          //   JSON.stringify(labelString).indexOf('People') !== -1 ||
          //   JSON.stringify(labelString).indexOf('Face') !== -1 ||
          //   JSON.stringify(labelString).indexOf('Human') !== -1
          // ) {

          //   logger.log("debug", res)

          //   try {
          //     logger.log("debug", tokenUser.sub)
          //     s3.putObject({
          //       Bucket: "assets.designed.org",
          //       Key: "avatars/networking/" + tokenUser.sub + "/avatar.jpg",
          //       Body: buffer,
          //       ACL: "public-read"
          //     }, async (resp) => {
          //       logger.log("info", resp)
          //       logger.log("info", 'Avatar upload success: ' + tokenUser.picture)
          //       newUser.avatarUrl = "https://assets.designed.org/avatars/networking/" + tokenUser.sub + "/avatar.jpg"
          //       await newUser.save()
          //       return newUser

          //     })
          //   } catch (error) {
          //     logger.log("debug", 's3-putobject failed')
          //     logger.log("error", error)
          //     console.log('Error 2')
          //     Raven.captureException(err, {
          //       tags: {
          //         graphqlcollection: "user",
          //         resolvefunction: "user",
          //         errorreference: 's3-putobject',
          //         referenceid: tokenUser.sub ? tokenUser.sub : ""
          //       }
          //     })
          //     await newUser.save()
          //     return newUser
          //   }

          // } else {

          //   logger.log("info", 'Not a face: ' + tokenUser.picture)
          //   await newUser.save()
          //   return newUser
          // }
        } catch (catcherror) {
          console.log('Error 1');
          logger.log('info', 'user-fetch failed');
          logger.log('error', catcherror);
          // @ts-ignore
          Raven.captureException(catcherror, {
            tags: {
              graphqlcollection: 'user',
              resolvefunction: 'userFetchPicture-2',
              referenceid: tokenUser.sub ? tokenUser.sub : '',
            },
          });
          await newUser.save();
          return newUser;
        }
      } else {
        if (user.avatarUrl && user.avatarUrl !== '') {
          user.avatarUrl = user.avatarUrl.replace('designmentors', 'designed');
        }
        user.responding_region = process.env.SERVERLESS_REGION;

        // if email missing get it from token
        if (!user.email) {
          user.email = tokenUser.email;
          await user.save();
        }
        return user;
      }
    } catch (error) {
      logger.log('error', error, {
        referenceid: args.id ? args.id : '',
      });
      console.log('Error 0');
      // @ts-ignore
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'user',
          resolvefunction: 'user',
          referenceid: args.id ? args.id : '',
        },
      });
      return null;
    }
  },
  // get user from admin client by token
  adminuser: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      return User.queryOne('id')
        .eq(tokenUser.sub)
        .exec();
    } else {
      return {
        error: 'Error getting user',
        message: '',
      };
    }
  },

  userFromAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      return User.queryOne('id')
        .eq(args.id)
        .exec();
    } else {
      return {
        error: 'Error getting user',
        message: '',
      };
    }
  },
  userFullname: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (!tokenUser.error) {
      const user = await User.queryOne('id')
        .eq(args.id)
        .exec();
      let fullname = user.firstname == null ? '' : user.firstname;
      fullname =
        user.lastname == null ? fullname : fullname + ' ' + user.lastname;
      return fullname === '' ? 'Anonymus' : fullname;
    } else {
      return {
        error: 'Error getting user',
        message: '',
      };
    }
  },
  userProfile: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (!tokenUser.error) {
      return User.queryOne('id')
        .eq(args.id)
        .exec();
    } else {
      return {
        error: 'Error getting user',
        message: '',
      };
    }
  },

  getAllUsers: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      try {
        console.log('start getAllUsers');
        const userSet1 = await User.scan().exec();
        if (userSet1.lastKey) {
          console.log('getAllUsers-userSet1.lastKey', userSet1.lastKey);
          const userSet2 = await User.scan()
            .startAt(userSet1.lastKey)
            .exec();
          return userSet1.concat(userSet2);
        } else {
          console.log('return set 1');
          return userSet1;
        }
      } catch (error) {
        console.log('users.error', error);
        // @ts-ignore
        Raven.captureException(error, {
          tags: {
            graphqlcollection: 'user',
            resolvefunction: 'getAllUsers',
          },
        });
        return [];
      }
    } else {
      return [];
    }
  },

  users: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      try {
        console.log('start getAllUsers');
        const userSet1 = await User.scan().exec();
        if (userSet1.lastKey) {
          console.log('getAllUsers-userSet1.lastKey', userSet1.lastKey);
          const userSet2 = await User.scan()
            .startAt(userSet1.lastKey)
            .exec();
          return userSet1.concat(userSet2);
        } else {
          console.log('return set 1');
          return userSet1;
        }
      } catch (error) {
        console.log('users.error', error);
        // @ts-ignore
        Raven.captureException(error, {
          tags: {
            graphqlcollection: 'user',
            resolvefunction: 'users',
          },
        });
        return [];
      }
    } else {
      return [];
    }
  },

  getInternalUsers: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      return User.query('role')
        .eq('Internal')
        .exec();
    } else {
      return [];
    }
  },
  getUsersByRole: async (_, { role }, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      return User.query('role')
        .eq(role)
        .exec();
    } else {
      return [];
    }
  },
  getTotalActiveUsersByRole: async (_, { filter, role }) => {
    return queryToGetTotalActiveUserByRole(User, filter, role);
  },

  getActiveUsersByRole: async (_, { role }) => {
    return User.query('role')
      .eq(role)
      .filter('isAvailable')
      .eq(true)
      .filter('approved')
      .eq(true)
      .filter('isRegistrationWizardCompleted')
      .eq(true)
      .limit(5)
      .exec();
  },
  getMoreActiveUsersByRole: async (_, { filter, role, lastKey }) => {
    const limit = 25;

    return queryToGetMoreActiveUserByRole(
      User,
      limit,
      filter,
      role,
      lastKey,
    );
  },
  getRandomUsers: async (_, { filter, role, offset }, { dataSources }) => {
    const limit = 21;

    try {
      let data: any;

      if (filter) {
        const sortTypes = ['', '_accountCreatedOn_desc', '_fullname_asc'];
        const randomTypes = Math.floor(Math.random() * 3);
        console.log('getRandomUsers.step1');
        data = await dataSources.algoliaUsers.searchUsers(
          '',
          'isAvailable: true AND approved: true AND isRegistrationWizardCompleted: true AND role: ' +
            role,
          filtersToStringForFacets(filter),
          [
            'firstname',
            'lastname',
            'name',
            'email',
            'avatarUrl',
            'jobTitle',
            'employer',
            'about',
            'city',
            'countrystate',
            'country',
            'facebook',
            'twitter',
            'linkedin',
            'dribbble',
            'behance',
            'github',
          ],
          offset === 0
            ? [
              'tags',
              'country',
              'countrystate',
              'city',
              'timezone',
              'language',
            ]
            : '',
          limit,
          offset,
          sortTypes[randomTypes],
        );
        console.log('getRandomUsers.data(filter)', data);
        // console.log('type', data)
        console.log('Algolia BRO');
        return {
          totalUsers: data.nbHits,
          currentOffset: data.page + 1,
          totalOffset: data.nbPages,
          filters: offset === 0 ? JSON.stringify(data.facets) : null,
          userFeed: data.hits,
        };
      } else if (offset === 0) {
        data = await dataSources.algoliaUsers.searchUsers(
          '',
          'isAvailable: true AND approved: true AND isRegistrationWizardCompleted: true AND role: ' +
            role,
          '', // filtersToStringForFacets(filter),//['tags:Android'],
          ['*'], // ['firstname', 'lastname', 'email'],
          ['tags', 'country', 'countrystate', 'city', 'timezone', 'language'],
          0,
        );
        console.log('getRandomUsers.data(nofilter)', data);
      }

      console.log('DynamoDB BRO');
      let randomData: any;
      // console.log('type', data)
      if (data.nbHits === 0) {
        console.log('getRandomUsers.data.nbHits === 0');
        randomData = {
          totalUsers: null,
          currentOffset: 0,
          totalOffset: 0,
          filters: null,
          userFeed: [],
        };
      } else {
        AWS.config.region = process.env.SERVERLESS_REGION;
        let dynamoDb = new AWS.DynamoDB.DocumentClient(
          {
            region: process.env.SERVERLESS_REGION,
            // accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            // secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            endpoint:
              'https://dynamodb.' +
              process.env.SERVERLESS_REGION +
              '.amazonaws.com',
          });
        if (process.env.IS_OFFLINE) {
          dynamoDb = new AWS.DynamoDB.DocumentClient(
            {
              region: 'local',
              accessKeyId: 'AAA',
              secretAccessKey: 'AAA',
              endpoint: 'http://dynamodb:8000',
            });
        }
        const queryParams = {
          TableName: process.env.SERVERLESS_STAGE + '-Statistics-designed-app',
          KeyConditionExpression: 'id = :id',
          ExpressionAttributeValues: { ':id': 'getActiveUsersByRole-' + role },
        };

        console.log('getRandomUsers.queryParams', queryParams);

        const allUserByRoleArray = await dynamoDb.query(queryParams).promise();
        console.log('getRandomUsers.allUserByRoleArray', allUserByRoleArray);

        // console.log('data', allUserByRoleArray.Items[0].userSet.values)
        const userListData =
          allUserByRoleArray && allUserByRoleArray.Items[0]
            ? allUserByRoleArray.Items[0].userSet
            : [];

        randomData = await queryToGetMoreActiveUserByRoleRandomly(
          User,
          userListData,
          limit,
          filter,
          role,
          offset,
        );
      }

      console.log('getRandomUsers.randomData', randomData);

      return {
        totalUsers: offset === 0 ? data.nbHits : '0',
        currentOffset: randomData.currentOffset,
        totalOffset: randomData.totalOffset,
        filters: offset === 0 ? JSON.stringify(data.facets) : null,
        userFeed: randomData.userFeed,
      };
    } catch (error) {
      console.log('getRandomUsers.error', error);
      // @ts-ignore
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'user',
          resolvefunction: 'getRandomUsers',
          referenceid: filter ? JSON.stringify(filter) : '',
        },
      });
      return {
        totalUsers: null,
        currentOffset: 0,
        totalOffset: 0,
        filters: null,
        userFeed: [],
      };
    }
  },
  getMoreActiveUsersByRoleFromAlgolia: async (_, args, { dataSources }) => {
    if (args.page < 0) {
      return {};
    }

    // TODO fill below with args and attributes and key
    const data = await dataSources.algoliaUsers.searchUsers(
      '',
      'isAvailable: true AND approved: true AND isRegistrationWizardCompleted: true AND role: ' +
        args.role,
      filtersToStringForFacets(args.filter),
      [
        'firstname',
        'lastname',
        'name',
        'email',
        'avatarUrl',
        'jobTitle',
        'employer',
        'about',
        'city',
        'countrystate',
        'country',
        'facebook',
        'twitter',
        'linkedin',
        'dribbble',
        'behance',
        'github',
      ],
      args.page === 0
        ? ['tags', 'country', 'countrystate', 'city', 'timezone', 'language']
        : '',
      30,
      args.page,
      args.sortByType,
    );
    // console.log('type', data)
    return {
      totalUsers: data.nbHits,
      currentPage: data.page,
      totalPage: data.nbPages,
      filters: args.page === 0 ? JSON.stringify(data.facets) : null,
      userFeed: data.hits,
    };
    // return await queryToGetMoreActiveUserByRole(User, limit, filter, role, lastKey);
  },
  getApprovedUsersByRole: async (_, { role }) => {
    if (role === 'Mentor') {
      return User.query('role')
        .eq('Mentor')
        .filter('approved')
        .eq(true)
        .exec();
    } else if (role === 'Mentee') {
      return User.query('role')
        .eq('Mentee')
        .filter('approved')
        .eq(true)
        .exec();
    } else if (role === 'Recruiter') {
      return User.query('role')
        .eq('Recruiter')
        .filter('approved')
        .eq(true)
        .exec();
    } else {
      return [];
    }
  },
  getUnapprovedUsersByRole: async (_, { role }) => {
    if (role === 'Mentor' || role === 'Mentee' || role === 'Recruiter') {
      return User.query('role')
        .eq(role)
        .filter('isRegistrationWizardCompleted')
        .eq(true)
        .filter('approved')
        .not()
        .eq(true)
        .exec();
    } else {
      return [];
    }
  },

  getBasicUsers: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      return User.scan()
        .filter('role')
        .null()
        .exec();
    } else {
      return [];
    }
  },
  // legacy ?
  mentors: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (!tokenUser.error) {
      return User.query('role')
        .eq('Mentor')
        .exec();
    } else {
      return [];
    }
  },

  getActiveMentors: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (!tokenUser.error) {
      return User.query('role')
        .eq('Mentor')
        .filter('isAvailable')
        .eq(true)
        .filter('approved')
        .eq(true)
        .exec();
    } else {
      return [];
    }
  },

  mentees: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (!tokenUser.error) {
      return User.query('role')
        .eq('Mentee')
        .exec();
    } else {
      return [];
    }
  },

  recruiters: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (!tokenUser.error) {
      return User.query('role')
        .eq('Recruiter')
        .exec();
    } else {
      return [];
    }
  },

  getTotalUsers: async (_, { approved, isAvailable }) => {
    let userNumber = 0;
    if (approved != null && isAvailable != null) {
      // need to update
      userNumber = Number(
        await User.scan('approved')
          .eq(approved)
          .scan('isAvailable')
          .eq(isAvailable)
          .count()
          .exec(),
      );
    } else if (approved != null) {
      if (approved) {
        userNumber = Number(
          await User.scan('approved')
            .eq(true)
            .count()
            .exec(),
        );
      } else {
        userNumber = Number(
          await User.scan('approved')
            .not()
            .eq(true)
            .count()
            .exec(),
        );
      }
    } else if (isAvailable != null) {
      if (isAvailable) {
        userNumber = Number(
          await User.scan('isAvailable')
            .eq(true)
            .count()
            .exec(),
        );
      } else {
        userNumber = Number(
          await User.scan('isAvailable')
            .not()
            .eq(true)
            .count()
            .exec(),
        );
      }
    } else {
      userNumber = Number(
        await User.scan()
          .count()
          .exec(),
      );
    }

    return {
      error: null,
      message: userNumber,
    };
  },

  getWaitQueueStatus: async (_, { id }) => {
    console.log('id', id);
    const user = await User.queryOne('id')
      .eq(id)
      .exec();
    if (!user) {
      return {
        error: 'No user found.',
        message: '',
      };
    }
    console.log('No user found');
    if (
      !user.accountCreatedOn ||
      user.accountCreatedOn.toString() === 'Invalid Date'
    ) {
      return {
        error: 'Invalid Date.',
        message: '',
      };
    }
    console.log('Invalid Date.');
    const userNumber = Number(
      await User.scan()
        .filter('role')
        .eq(user.role)
        .and()
        .filter('approved')
        .not()
        .eq(true)
        .and()
        .filter('isRegistrationWizardCompleted')
        .eq(true)
        .and()
        .filter('accountCreatedOn')
        .le(user.accountCreatedOn ? user.accountCreatedOn : 0)
        .count()
        .exec(),
    );
    // console.log(user);
    // console.log('userNumber', userNumber);
    return {
      error: null,
      message: userNumber,
      role: user.role ? user.role.toLowerCase() : null,
    };
  },
  // return signed URL from S3 for avatar folder in assets bucket
  upload: async (_, args, context) => {
    // console.log("Start upload")
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (!tokenUser.error) {
      const objectName = args.objectName;
      const requesturl = args.url;
      const userid =
        tokenUser.roles && tokenUser.roles.includes('Admin')
          ? args.userid
          : tokenUser.sub;
      const mimeType = args.contentType;
      const s3 = new AWS.S3({
                              accessKeyId: process.env.ASSETSS3ACCESSKEY,
                              secretAccessKey: process.env.ASSETSS3SECRETKEY,
                            });
      const params = {
        Bucket: 'assets.designed.org',
        Key: 'avatars/networking/' + userid + '/' + objectName,
        Expires: 5000,
        ContentType: mimeType,
        ACL: 'public-read',
      };
      const signedUrl = await s3.getSignedUrl('putObject', params);
      return { signedUrl };
    } else {
      return {
        message: '',
        error: 'Error in upload request',
      };
    }
  },
  region: async (_) => {
    try {
      return process.env.SERVERLESS_REGION;
    } catch (error) {
      console.log('region.error', error);
      return null;
    }
  },
};
