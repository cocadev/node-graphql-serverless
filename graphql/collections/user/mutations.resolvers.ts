import User from '../../../models/User.model';
import auth from '../../helpers/auth';
import ses from '../../helpers/aws-ses';
import Raven from '../../helpers/raven';
import EmailTemplateBase from 'email-templates-v2';
import path from 'path';
import 'handlebars';
import AWSXRay from 'aws-xray-sdk';
import aws_sdk from 'aws-sdk';

const AWS = AWSXRay.captureAWS(aws_sdk);

export default {
  createUser: async (_, { email, id }) => {
    const newUser = new User({ email, id });
    const timestamp = new Date().getTime();
    newUser.accountCreatedOn = timestamp;
    newUser.accountUpdatedOn = timestamp;
    await newUser.save();
    return newUser;
  },

  // may not be required in future
  createSocialUser: async (_, args, context) => {
    return null;
  },

  verifyEmail: async (_, args) => {
    const tokenUser = await auth.verify(args.userinfo_access_token);
    if (tokenUser.error) {
      console.log('verifyEmail.error', tokenUser.error);
      return {
        error: 'Error getting user',
        message: '',
      };
    }
    if (
      tokenUser.sub.indexOf('twitter|') !== -1 ||
      tokenUser.sub.indexOf('facebook|') !== -1 ||
      tokenUser.sub.indexOf('google-oauth2|') !== -1 ||
      tokenUser.email_verified
    ) {
      await User.update({
                          id: tokenUser.sub,
                          email_verified: true,
                        });
      return {
        email_verified: true,
      };
    }
    return {
      error: '',
      message: '',
    };
  },

  updateUser: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.input.userinfo_access_token,
    );
    if (tokenUser.error) {
      return {
        error: 'Error updating user',
        message: '',
      };
    }
    if (args.input.accountCreatedOn) {
      args.input.accountCreatedOn = parseInt(args.input.accountCreatedOn, 10);
    }
    // do not update avatar url directly but only through upload
    delete args.input.avatarUrl;
    args.input.accountUpdatedOn = Date.now();
    // if admin requests
    if (tokenUser.roles && tokenUser.roles.includes('Admin') && args.input.id) {
      // TODO validate input here ... later
      // console.log("Admin request")

      if (!args.input.username) {
        delete args.input.userinfo_access_token;
        await User.update(args.input);
        return {
          error: null,
          message: 'User updated',
        };
      }
      const user = await User.queryOne('id')
        .eq(args.input.id)
        .exec();

      // if username has changed
      if (user.username === args.input.username) {
        await User.update(args.input);
        return {
          error: null,
          message: 'User updated',
        };
      }
      const userWithUsername = await User.scan('username')
        .eq(args.input.username)
        .count()
        .exec();
      if (userWithUsername > 0) {
        return {
          error: 'Username exists already',
          message: null,
        };
      } else {
        // console.log('update user in db and auth0')
        delete args.input.userinfo_access_token;
        await User.update(args.input);
        return {
          error: null,
          message: 'User updated',
        };
      }
    }
    console.log('Update user');
    // user cannot set himself to approved
    delete args.input.approved;

    if (!args.input.id) {
      args.input.id = tokenUser.sub;
    }
    if (args.input.id !== tokenUser.sub) {
      return {
        error: 'Unauthorised',
        message: null,
      };
    }
    // console.log("valid request")
    // case if user updates his availability - require auth0 email validation check
    if (args.input.isAvailable && args.input.userinfo_access_token) {
      const emailVerified = true; // TODO Get this value from Cognito?
      if (!emailVerified) {
        return {
          error:
            'Before you can set your profile to active you will need to activate your account. You should have received an email when you signed up, check your spam folder for a message from verify@designed.org',
          message: '',
        };
      }
      // if email verified update user
      const currentUser = await User.queryOne('id')
        .eq(args.input.id)
        .exec();
      if (currentUser.approved == null) {
        currentUser.approved = false;
      }
      if (!currentUser.approved && args.input.isAvailable) {
        return {
          message: '',
          error: 'Need admin approval.',
        };
      }
      delete args.input.userinfo_access_token;
      await User.update(args.input);
      return {
        error: null,
        message: 'User updated',
      };
    }
    delete args.input.userinfo_access_token;
    if (!args.input.username) {
      await User.update(args.input);
      return {
        error: null,
        message: 'User updated',
      };
    }
    const user = await User.queryOne('id')
      .eq(args.input.id)
      .exec();

    // if username has changed
    if (user && user.username !== args.input.username) {
      const userWithUsername = await User.scan('username')
        .eq(args.input.username)
        .count();
      if (userWithUsername > 0) {
        return {
          error: 'Username exists already',
          message: null,
        };
      }
      await User.update(args.input);
      return {
        error: null,
        message: 'User updated',
      };
    }
    await User.update(args.input);
    return {
      error: null,
      message: 'User updated',
    };
  },

  updateUserByAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.input.userinfo_access_token,
    );
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      const timestamp = new Date().getTime();

      if (args.input.isRegistrationWizardCompleted) {
        args.input.accountCreatedOn = timestamp;
      }
      args.input.accountUpdatedOn = timestamp;
      await User.update(args.input);
      return {
        error: null,
        message: 'User updated',
      };
    } else {
      return null;
    }
  },

  deleteUserByAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      await User.delete(args.id);
      return {
        error: null,
        message: 'User deleted',
      };
    } else {
      return null;
    }
  },

  deleteUserByOwn: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    if (!tokenUser.error) {
      await User.delete(args.id);
      return {
        id: args.id,
        error: null,
        message: 'Account is deleted',
      };
    } else {
      return {
        id: args.id,
        error: tokenUser.error,
        message: 'Account remove failed',
      };
    }
  },

  approveUserByAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      if (args.approved) {
        args.isAvailable = true;
      }
      await User.update(args);
      return {
        error: null,
        message: 'User approved',
      };
    } else {
      return null;
    }
  },

  setUserCreation: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      await User.update(args);
      return {
        error: null,
        message: 'User updated',
      };
    } else {
      return null;
    }
  },

  setInternalUser: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      // TODO Do this one day
      return {
        error: null,
        message: 'User updated',
      };
    } else {
      return null;
    }
  },

  sendApprovalEmail: async (_, args, context) => {
    try {
      const tokenUser = await auth.verify(
        context.event.headers.authorization || args.userinfo_access_token,
      );
      if (
        tokenUser.error ||
        !tokenUser.roles ||
        (!tokenUser.roles.includes('Admin') &&
          !tokenUser.roles.includes('User'))
      ) {
        return {
          error: tokenUser.error,
        };
      }
      const user = await User.queryOne('id')
        .eq(args.id)
        .exec();
      const firstName = user.firstname || 'Designed.org user';
      process.env.PATH = process.env.PATH + ':' + process.env.LAMBDA_TASK_ROOT;
      const params = {
        Destination: {
          ToAddresses: [user.email],
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: 'Welcome to Designed.org',
            },
            Text: {
              Charset: 'UTF-8',
              Data: 'Welcome to Designed.org!',
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: 'Your Designed.org profile has been approved!',
          },
        },
        ReturnPath: 'welcome@designed.org',
        Source: 'Designed.org <welcome@designed.org>',
      };
      let templateDirPath;
      switch (user.role) {
        case 'Mentor':
          templateDirPath = process.env.IS_OFFLINE
            ? './email/templates/approval_email_mentor'
            : path.join(
              __dirname,
              '/var/task/email/templates',
              'approval_email_mentor',
            );
          break;
        case 'Mentee':
          templateDirPath = process.env.IS_OFFLINE
            ? './email/templates/approval_email_mentee'
            : path.join(
              __dirname,
              '/var/task/email/templates',
              'approval_email_mentee',
            );
          break;
        case 'Recruiter':
          templateDirPath = process.env.IS_OFFLINE
            ? './email/templates/approval_email_recruiter'
            : path.join(
              __dirname,
              '/var/task/email/templates',
              'approval_email_recruiter',
            );
          break;
        case 'Internal':
          templateDirPath = process.env.IS_OFFLINE
            ? './email/templates/approval_email_internal'
            : path.join(
              __dirname,
              '/var/task/email/templates',
              'approval_email_internal',
            );
          break;
        default:
          return {
            error: 'Unknown user type',
          };
      }
      const approvalEmailTemplate = new EmailTemplateBase.EmailTemplate(
        templateDirPath,
      );
      const templateResult = await approvalEmailTemplate.render({ First_name: firstName });
      params.Message.Body.Html.Data = templateResult.html;
      const emailRequest = await ses.sendEmail(params);
      return {
        message: !emailRequest.error && emailRequest.message,
        error: emailRequest.error,
      };
    } catch (error) {
      console.log(error);
      return {
        error: error.message,
      };
    }
  },

  uploadAvatar: async (_, args, context) => {
    try {
      const tokenUser = await auth.verify(
        context.event.headers.authorization || args.userinfo_access_token,
      );

      if (!tokenUser.error) {
        const id = args.id ? args.id : tokenUser.sub;
        // TODO implement for admin

        const s3 = new AWS.S3(
          {
            s3ForcePathStyle: true,
            region: 'us-east-1',
            endpoint: 's3.amazonaws.com',
            accessKeyId: process.env.ASSETSS3ACCESSKEY,
            secretAccessKey: process.env.ASSETSS3SECRETKEY,
          });

        const buffer = new Buffer(
          args.base64.replace(/^data:image\/\w+;base64,/, ''),
          'base64',
        );
        const s3params = {
          Bucket: 'assets.designed.org',
          Key: 'avatars/networking/' + id + '/avatar.jpg',
          Body: buffer,
          ContentType: 'image/jpg',
          ACL: 'public-read',
          // Tagging: "userid=" + tokenUser.sub
        };
        console.log(s3params);
        try {
          await s3.putObject(s3params);
        } catch (err) {
          console.log(err);
          // @ts-ignore
          Raven.captureException(err, {
            tags: {
              graphqlcollection: 'user',
              resolvefunction: 'uploadAvatar',
              errorreference: 's3-putobject',
              referenceid: args.id ? args.id : '',
            },
          });
        }
        await User.update(
          {
            id,
            avatarUrl:
              'https://assets.designed.org/avatars/networking/' +
              id +
              '/avatar.jpg',
          });
        const cloudfront = new AWS.CloudFront(
          {
            s3ForcePathStyle: true,
            region: 'us-east-1',
            endpoint: 'cloudfront.amazonaws.com',
            accessKeyId: process.env.ASSETSS3ACCESSKEY,
            secretAccessKey: process.env.ASSETSS3SECRETKEY,
          });
        const params = {
          DistributionId: 'EVW93XBDR6PJ3' /* required */,
          InvalidationBatch: {
            /* required */
            CallerReference: new Date().getTime().toString() /* required */,
            Paths: {
              /* required */
              Quantity: 1 /* required */,
              Items: [
                '/avatars/networking/' + id.replace('|', '%7C') + '/avatar.jpg',
              ],
            },
          },
        };
        await cloudfront.createInvalidation(params);
        return {
          message: 'Avatar saved',
          error: '',
        };
      } else {
        return {
          message: '',
          error: 'Can\'t upload avatar',
        };
      }
    } catch (error) {
      // @ts-ignore
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'user',
          resolvefunction: 'uploadAvatar',
          referenceid: args.id ? args.id : '',
        },
      });
      return {
        message: '',
        error: 'Can\'t upload avatar',
      };
    }
  },
};
