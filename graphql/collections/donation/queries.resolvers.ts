import auth from '../../helpers/auth';
import Raven from '../../helpers/raven';

const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
import moment from 'moment';

import winston from 'winston';

const logger = winston.createLogger(
  {
    level: process.env.LOG_LEVEL || 'error',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
  });

export default {
  donations: async (_, args, context) => {
    try {
      // console.log('donations')
      const tokenUser = await auth.verify(context.event.headers.authorization);

      if (!tokenUser.error) {
        const lambda = new AWS.Lambda(
          {
            region: 'us-east-1',
            endpoint: 'lambda.us-east-1.amazonaws.com',
            accessKeyId: process.env.INVOKE_DONATIONAPI_ACCESSKEY,
            secretAccessKey: process.env.INVOKE_DONATIONAPI_SECRETKEY,
          });
        const params = {
          FunctionName: 'designed-donation-api-' + process.env.SERVERLESS_STAGE + '-list', /* required */
          Payload: JSON.stringify(
            {
              queryStringParameters: {
                email: tokenUser.email,
              },
            }),
        };
        const response = await new Promise((resolve, reject) => {
          lambda.invoke(params, (err, data) => {
            if (err) {
              console.log(err, err.stack); // an error occurred
              // Raven.captureException('Error getting donations for: '+tokenUser.email);
              resolve(null);
            } else {
              const donationsresult = JSON.parse(JSON.parse(data.Payload).body);
              console.log('donationsresult', donationsresult);
              resolve(donationsresult);
            }
          });
        });
        // console.log('response',response)
        // const response = await axios.get('http://designed-donation-api:7373/donations?email='+tokenUser.email);
        if (!response) {
          return [];
        }
        // @ts-ignore
        return response.map(donation => ({
          id: donation.id,
          date: moment(donation.donation_date).format('DD/MM/YYYY'),
          amount: donation.formatted_amount,
          method: donation.donation_type,
          type: donation.recurring === true ? 'Recurring' : 'One-time',
        }));
      }
    } catch (error) {
      logger.log('error', error, {
        referenceid: args.id ? args.id : '',
      });
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
};
