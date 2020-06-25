import lodash from 'lodash';
import moment from 'moment';
import Job from '../../../models/Job.model';
import auth from '../../helpers/auth';
import Raven from '../../helpers/raven';
import {
  allJobsFiltersToStringForFacets,
  getTotalJobsUsingFilters,
  searchAllJobsWithInfiniteScrolling,
  searchUserJobFilter,
  userJobsFiltersToString,
} from './helper/queries.helper';

// tslint:disable-next-line:no-var-requires
const AWSXRay = require('aws-xray-sdk');
// tslint:disable-next-line:no-var-requires
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

export default {
  getAllJobs: async (_, args, context) => {
    try {
      const expiredDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .getTime()
        .toString();

      let jobs = await Job.query('isAvailable')
        .eq(args.isAvailable)
        .descending()
        .where('publishedOn')
        .ge(expiredDate)
        .exec();

      if (args.location) {
        jobs = lodash.filter(
          jobs, o =>
            o.company &&
            o.company.location &&
            o.company.location
              .toLowerCase()
              .includes(args.location.toLowerCase()),
        );
      }

      jobs = lodash.orderBy(
        jobs,
        item => {
          item.isAvailable = item.isAvailable === 'true';
          item.remoteFriendly = item.remoteFriendly === 'true';
          return moment.unix(item.publishedOn / 1000);
        },
        ['desc'],
      );

      return jobs;
    } catch (error) {
      console.log('getAllJobsError', error);
      // @ts-ignore
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'career',
          resolvefunction: 'getAllJobs',
          referenceid: JSON.stringify(args),
        },
      });
      return [];
    }
  },
  getAllAvailableJobsWithInfiniteScrollingFromAlgolia: async (_, { filter, page }, { dataSources }) => {
    try {
      if (page < 0) {
        return {};
      }

      // TODO fill below with args and attributes and key
      const expiredDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .getTime()
        .toString();
      const data = await dataSources.algoliaJobs.searchJobs(
        filter && filter.location && filter.location !== ''
          ? filter.location
          : '',
        'isAvailable: true AND publishedOn >= ' + expiredDate,
        allJobsFiltersToStringForFacets(filter),
        ['*'],
        '',
        30,
        page,
      );
      // console.log('type', data)
      return {
        totalJobs: data.nbHits,
        currentPage: data.page,
        totalPage: data.nbPages,
        jobFeed: data.hits,
      };
    } catch (error) {
      console.log('getAllAvailableJobs', error);
      // @ts-ignore
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'career',
          resolvefunction: 'getAllAvailableJobs',
          referenceid: JSON.stringify('filter'),
        },
      });
      return [];
    }
  },
  getAllJobsWithInfiniteScrolling: async (
    _,
    args,
    context,
  ) => {
    const { isAvailable, filter, lastKey } = args;
    const limit = 25;
    try {
      return await searchAllJobsWithInfiniteScrolling(
        Job,
        limit,
        isAvailable,
        filter,
        lastKey,
      );
    } catch (error) {
      console.log('getAllAvailableJobs', error);
      // @ts-ignore
      Raven.captureException(error, {
        tags: {
          graphqlcollection: 'career',
          resolvefunction: 'getAllAvailableJobs',
          referenceid: JSON.stringify(args),
        },
      });
      return [];
    }
  },

  getTotalJobs: async (_, { isAvailable, filter }) => {
    return getTotalJobsUsingFilters(Job, isAvailable, filter);
  },
  getUserJobsFromAlgolia: async (_, args, { dataSources }) => {
    if (args.page < 0) {
      return {};
    }
    const tokenUser = await auth.verify(
      dataSources.algoliaJobs.context.event.headers.authorization ||
      args.userinfo_access_token,
    );
    // console.log('tokenUser',dataSources.algoliaJobs.context)
    if (!tokenUser.error) {
      try {
        // TODO fill below with args and attributes and key
        const data = await dataSources.algoliaJobs.searchJobs(
          '',
          userJobsFiltersToString(tokenUser.user_id, args.type),
          '',
          ['*'],
          '',
          30,
          args.page,
        );
        // console.log('type', data)
        return {
          totalJobs: data.nbHits,
          currentPage: data.page,
          totalPage: data.nbPages,
          jobFeed: data.hits,
        };
      } catch (error) {
        console.log('getAllAvailableJobs', error);
        // @ts-ignore
        Raven.captureException(error, {
          tags: {
            graphqlcollection: 'career',
            resolvefunction: 'getAllAvailableJobs',
            referenceid: JSON.stringify('filter'),
          },
        });
        return {};
      }
    }
    return {};
  },

  getUserJobs: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    // console.log(tokenUser)
    if (!tokenUser.error) {
      const filter = {
        FilterExpression: 'postedBy.id = :userId',
        ExpressionAttributeValues: {
          ':userId': tokenUser.user_id,
        },
      };

      const jobs = await Job.scan(filter).exec();

      lodash.forEach(jobs, o => {
        o.isAvailable = o.isAvailable === 'true';
        o.remoteFriendly = o.remoteFriendly === 'true';
      });

      // dynamodb scan converts all return type to string

      if (args.type && args.type !== '') {
        return searchUserJobFilter(jobs, args.type);
      }

      return jobs;
    }

    return [];
  },
  getUserTotalJobs: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    // console.log(tokenUser)
    if (!tokenUser.error) {
      const filter = {
        FilterExpression: 'postedBy.id = :userId',
        ExpressionAttributeValues: {
          ':userId': tokenUser.user_id,
        },
      };

      const totalJobs = await Job.scan(filter).exec();

      return {
        total: lodash.size(totalJobs),
        error: null,
      };
    }

    return {
      total: 0,
      error: 'error',
    };
  },
  getJob: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    // console.log(tokenUser)
    if (!tokenUser.error) {
      return Job.queryOne('id')
        .eq(args.id)
        .exec();
    }

    return null;
  },
  getAllJobsForAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    // console.log(tokenUser)
    if (!tokenUser.error) {
      if (tokenUser.roles && tokenUser.roles.includes('Admin')) {
        return Job.scan().exec();
      }
    }
    return null;
  },

  getActiveJobsForAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    const today = new Date().getTime();
    const expiredDate = new Date(today - 30 * 24 * 60 * 60 * 1000)
      .getTime()
      .toString();
    const isAvailable = true;

    // console.log(tokenUser)
    if (!tokenUser.error) {
      if (tokenUser.roles && tokenUser.roles.includes('Admin')) {
        return Job.query('isAvailable')
          .eq(isAvailable)
          .descending()
          .where('publishedOn')
          .ge(expiredDate)
          .exec(); // Job.scan().exec()
      }
    }
    return null;
  },

  getExpiredJobsForAdmin: async (_, args, context) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    const today = new Date().getTime();
    const expiredDate = new Date(today - 30 * 24 * 60 * 60 * 1000)
      .getTime()
      .toString();
    const isAvailable = true;

    // console.log(tokenUser)
    if (!tokenUser.error) {
      if (tokenUser.roles && tokenUser.roles.includes('Admin')) {
        return Job.query('isAvailable')
          .eq(isAvailable)
          .descending()
          .where('publishedOn')
          .le(expiredDate)
          .exec(); // Job.scan().exec()
      }
    }
    return null;
  },
};
