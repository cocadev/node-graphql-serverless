import Sentry from '@sentry/node';
// import Raven from "raven"
// var myRaven
if (!process.env.IS_OFFLINE) {
  Sentry.init({
    dsn:
      'https://a746f719e63943a19577afa5b37df7e9:e9b0213c5d7743a4bd9adab15a2bb1bb@sentry.io/259993',
    environment: process.env.SERVERLESS_STAGE,
    // release: process.env.GIT_COMMIT_SHORT
  });
}
export default Sentry;
