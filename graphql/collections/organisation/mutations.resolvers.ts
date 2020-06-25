import dynamoose, { Schema } from 'dynamoose';
import Organisation from '../../../models/Organisation.model';
import auth from '../../helpers/auth';

const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
import Raven from '../../helpers/raven';
import axios from 'axios';
import lodash from 'lodash';
import EmailTemplateBase from 'email-templates-v2';
import path from 'path';
import 'handlebars';
import { checkWhetherOrganisationIsAvailable } from '../career/helper/queries.helper';

export default {
  createOrganisation: async (_, args) => {
    const org = await Organisation.queryOne('domain')
      .eq(args.input.domain)
      .exec();
    if (!org) {
      const newOrganisation = new Organisation({
                                                 name: args.input.name
                                                   ? args.input.name
                                                   : args.input.domain,
                                                 domain: args.input.domain,
                                               });
      // const timestamp = new Date().getTime()
      await newOrganisation.save();
      return {
        generatedId: newOrganisation.id,
        message: 'Organisation created',
        error: '',
      };
    } else {
      return {
        generatedId: '',
        message: '',
        error: 'Organisation with this domain exists already',
      };
    }
  },

  updateOrganisation: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (!tokenUser.error) {
      if (args.input.domain) {
        const org = await Organisation.queryOne('domain')
          .eq(args.input.domain)
          .exec();
        if (!org || (org && org.id === args.input.id)) {
          await Organisation.update(args.input);
          return {
            error: null,
            message: 'Organisation updated',
          };
        } else {
          return {
            generatedId: '',
            message: '',
            error: 'Organisation with this domain exists already',
          };
        }
      }
    } else {
      return null;
    }
  },

  updateOrganisationByAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      if (args.input.domain) {
        const org = await Organisation.queryOne('domain')
          .eq(args.input.domain)
          .exec();
        if (!org || (org && org.id === args.input.id)) {
          await Organisation.update(args.input);
          return {
            error: null,
            message: 'Organisation updated',
          };
        } else {
          return {
            generatedId: '',
            message: '',
            error: 'Organisation with this domain exists already',
          };
        }
      }
    } else {
      return null;
    }
  },

  deleteOrganisationByAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(context.event.headers.authorization);
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      await Organisation.delete(args.id);
      return {
        error: null,
        message: 'Organisation deleted',
      };
    } else {
      return null;
    }
  },
  checkOrganisationByNameAndDomain: async (_, { name, domain }, context) => {
    if (!domain || domain === '' || (!name || name === '')) {
      return null;
    }
    try {
      const tokenUser = await auth.verify(context.event.headers.authorization);
      if (!tokenUser.error) {
        domain = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '');
        return await checkWhetherOrganisationIsAvailable(
          Organisation,
          name,
          domain,
        );
      }
    } catch (error) {
      // logger.log("error", error, {
      //   referenceid: domain ? domain : ""
      // })
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'organisation',
          resolvefunction: 'organisation',
          referenceid: domain ? domain : '',
        },
      });
      return null;
    }
  }
}
