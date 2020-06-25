import jwt from 'jsonwebtoken';

const jwksClient = require('jwks-rsa');
const client = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10, // Default value
  jwksUri: 'https://auth.designed.org/.well-known/jwks.json',
});

const userCognitoJwksClient = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10, // Default value
  jwksUri: `https://cognito-idp.${process.env.SERVERLESS_REGION}.amazonaws.com/${process.env.USER_COGNITO_USERPOOLID}/.well-known/jwks.json`,
});
const adminCognitoJwksClient = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10, // Default value
  jwksUri: `https://cognito-idp.${process.env.SERVERLESS_REGION}.amazonaws.com/${process.env.ADMIN_COGNITO_USERPOOLID}/.well-known/jwks.json`,
});

const validateRS256 = (access_token, tempDecodedToken, client, audience) => {
  // for admin client using RS256
  const { kid, alg } = tempDecodedToken.header;
  return new Promise((resolve, reject) => {
    try {
      client.getSigningKey(kid, (keyError, key) => {
        if (keyError) {
          console.log(keyError);
          reject({
            error: 'Invalid signing key',
          });
        } else {
          const signingKey = key.publicKey || key.rsaPublicKey;
          jwt.verify(
            access_token,
            signingKey,
            { alg, audience },
            (verificationError, decoded) => {
              if (verificationError) {
                console.log(verificationError);
                reject({
                  error: 'Invalid JWT',
                });
              } else {
                console.log('Valid token');
                resolve(decoded);
              }
            },
          );
        }
      });
    } catch (error) {
      reject({
        error: 'Invalid JWT',
      });
    }
  });
};

export default {
  verify: async authorization => {
    if (!authorization || typeof authorization !== 'string') {
      console.log('invalid authorization token');
      return {
        error: 'Invalid token',
      };
    }
    const access_token =
      authorization && authorization.indexOf('Bearer ') > -1
        ? authorization.substring(7)
        : authorization;

    //fake token for e2e tests - to replace with getting real token from auth0 as in admin
    if (
      process.env.IS_OFFLINE &&
      process.env.SERVERLESS_STAGE === 'staging' &&
      (access_token === 'designedmentee' || access_token === 'designedtesting')
    ) {
      return {
        'https://app.designed.org/username': access_token,
        'https://app.designed.org/logins_count': 2,
        email:
          access_token === 'designedmentee'
            ? 'designedtestingmentee@gmail.com'
            : 'designedtesting@gmail.com',
        email_verified: true,
        roles: [],
        picture: '',
        user_metadata: {},
        user_id:
          access_token === 'designedmentee'
            ? 'auth0|5aeeb8eb04eb0b243f1e0004'
            : 'auth0|5ad38b823467830fef66f27f',
        iss: 'https://auth.designed.org/',
        sub: 'auth0|5aeeb8eb04eb0b243f1e0004',
        aud: 'xFF4BEIlWpB_dc9piJi7t-7fMTki6auj',
        iat: 1525594350,
        exp: 1525630350,
      };
    }
    let tempDecodedToken;
    try {
      // real tokens below
      tempDecodedToken = jwt.decode(access_token, { complete: true });
      console.log('tempDecodedToken', tempDecodedToken);
      if (!tempDecodedToken) {
        return {
          error: 'Decoding Error',
        };
      }
    } catch (e) {
      console.log(e);
      return {
        error: 'Decoding Error',
      };
    }
    let result = null;
    // handle different token sources
    switch (tempDecodedToken.payload.aud) {
      case process.env.AUTH0_ADMINUSER_CLIENTID:
        try {
          result = await validateRS256(
            access_token,
            tempDecodedToken,
            client,
            process.env.AUTH0_ADMINUSER_CLIENTID,
          );
          if (result.sub === 'auth0|5b6e77a7857ca20fe94d2577') {
            result.roles = ['Admin'];
          }
          return result;
        } catch (e) {
          return {
            error: 'Algorithm validation error',
          };
        }
      case process.env.USER_COGNITO_CLIENTID:
        try {
          result = await validateRS256(
            access_token,
            tempDecodedToken,
            userCognitoJwksClient,
            process.env.USER_COGNITO_CLIENTID,
          );
          result.roles = ['User'];
          return result;
        } catch (e) {
          return {
            error: 'Algorithm validation error',
          };
        }
      case process.env.ADMIN_COGNITO_CLIENTID:
        try {
          result = await validateRS256(
            access_token,
            tempDecodedToken,
            adminCognitoJwksClient,
            process.env.ADMIN_COGNITO_CLIENTID,
          );
          result.roles = ['Admin'];
          return result;
        } catch (e) {
          return {
            error: 'Algorithm validation error',
          };
        }
      // production with auth0 secret HS256
      default:
        console.log('auth0 HS256 token');
        try {
          return jwt.verify(
            access_token,
            process.env.AUTH0SECRET,
            {
              algorithm: 'HS256',
              audience: process.env.AUTH0CLIENTID,
            },
            (verificationError, decoded) => {
              if (verificationError) {
                console.log(verificationError);
                return {
                  error: 'Invalid token',
                };
              } else {
                // console.log("Valid token")
                // console.log('token', decoded)
                return decoded;
              }
            },
          );
        } catch (error) {
          console.log(error);
          return {
            error: 'Invalid token',
          };
        }
    }
  },
};
