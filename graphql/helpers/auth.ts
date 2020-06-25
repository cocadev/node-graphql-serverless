import jwt from 'jsonwebtoken';
import jwksClient, { CertSigningKey, RsaSigningKey } from 'jwks-rsa';

const userCognitoJwksClient = jwksClient(
  {
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10, // Default value
    jwksUri: `https://cognito-idp.${process.env.SERVERLESS_REGION}.amazonaws.com/${process.env.USER_COGNITO_USERPOOLID}/.well-known/jwks.json`,
  });
const adminCognitoJwksClient = jwksClient(
  {
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10, // Default value
    jwksUri: `https://cognito-idp.${process.env.SERVERLESS_REGION}.amazonaws.com/${process.env.ADMIN_COGNITO_USERPOOLID}/.well-known/jwks.json`,
  });

const validateRS256 = (
  accessToken: string,
  tempDecodedToken: any,
  client: jwksClient.JwksClient,
  audience: string | undefined,
) => {
  // for admin client using RS256
  const { kid, alg } = tempDecodedToken.header;
  return new Promise((resolve, reject) => {
    try {
      client.getSigningKey(kid, (keyError: Error | null, key: jwksClient.SigningKey) => {
        if (keyError) {
          console.log(keyError);
          reject({
                   error: 'Invalid signing key',
                 });
        } else {
          // @ts-ignore
          const signingKey = key.publicKey || key.rsaPublicKey;
          // @ts-ignore
          jwt.verify(
            accessToken,
            signingKey,
            { algorithms: [alg], audience },
            (verificationError: any, decoded: unknown) => {
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
      reject(
        {
          error: 'Invalid JWT',
        });
    }
  });
};

export default {
  verify: async (authorization: any) => {
    if (!authorization || typeof authorization !== 'string') {
      console.log('invalid authorization token');
      return {
        error: 'Invalid token',
      };
    }
    const accessToken: string =
      authorization && authorization.indexOf('Bearer ') > -1
        ? authorization.substring(7)
        : authorization;
    let tempDecodedToken;
    try {
      // real tokens below
      tempDecodedToken = jwt.decode(accessToken, { complete: true });
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
    let result: any = null;
    // handle different token sources
    switch (tempDecodedToken.payload.aud) {
      case process.env.USER_COGNITO_CLIENTID:
        try {
          result = await validateRS256(
            accessToken,
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
            accessToken,
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
      default:
        return {
          error: 'Invalid token',
        };
    }
  },
};
