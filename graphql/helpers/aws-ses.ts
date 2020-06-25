import ses from 'node-ses';
import Raven from './raven';

const client = ses.createClient(
  {
    key: process.env.SES_SENDAPPROVALEMAIL_ACCESSKEY,
    secret: process.env.SES_SENDAPPROVALEMAIL_SECRETKEY,
  });
export default {
  sendEmail: async (params): Promise<{ error?: string; message?: string }> => {
    try {
      return new Promise((resolve, reject) => {
        return client.sendEmail(
          {
            to: params.Destination.ToAddresses,
            from: params.ReturnPath,
            subject: params.Message.Subject.Data,
            message: params.Message.Body.Html.Data,
            altText: params.Message.Body.Text.Data,
          },
          (err: ses.SendEmailError, data: ses.SendEmailData) => {
            if (err) {
              console.log(err);
              // @ts-ignore
              Raven.captureException(err, {
                tags: {
                  graphqlcollection: 'helper',
                  resolvefunction: 'sendEmail-2',
                  referenceid: params.Destination.ToAddresses,
                },
              });
              reject({ error: err.Message });
            } else {
              console.log('Message Sent: ', data);
              resolve({ message: 'Sent' });
            }
          },
        );
      });
    } catch (error) {
      console.log(error);
      // @ts-ignore
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'helper',
          resolvefunction: 'sendEmail-2',
          referenceid: params.Destination.ToAddresses,
        },
      });
      return Promise.reject({ error: 'Unknown header' });
    }
  },
};
