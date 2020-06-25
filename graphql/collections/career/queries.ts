import { objectType, booleanArg, stringArg, arg, intArg, extendType } from 'nexus';
import { Job, JobFeed, JobListInfo, JobFilter } from './types';
import { DefaultCountType } from '../shared';
import resolvers from './queries.resolvers';

const careerQuery = extendType(
  {
    type: 'Query',
    definition(t) {
      t.field('getAllJobs', {
        resolve: resolvers.getAllJobs,
        type: Job,
        list: [false],
        nullable: true,
        args: {
          isAvailable: booleanArg({ required: true }),
          type: stringArg(),
          experience: stringArg(),
          location: stringArg(),
          remoteFriendly: booleanArg(),
        },
      });
      // @ts-ignore
      t.field('getAllJobsWithInfiniteScrolling', {
        resolve: resolvers.getAllJobsWithInfiniteScrolling,
        type: JobFeed,
        nullable: true,
        args: {
          isAvailable: booleanArg({ required: true }),
          filter: arg({ type: JobFilter }),
          lastKey: stringArg(),
        },
      });
      t.field('getAllAvailableJobsWithInfiniteScrollingFromAlgolia', {
        resolve: resolvers.getAllAvailableJobsWithInfiniteScrollingFromAlgolia,
        type: JobListInfo,
        nullable: true,
        args: {
          filter: arg({ type: JobFilter }),
          page: intArg(),
        },
      });
      t.string('getTotalJobs', {
        resolve: resolvers.getTotalJobs,
        nullable: true,
        args: {
          isAvailable: booleanArg({ required: true }),
          filter: arg({ type: JobFilter }),
        },
      });
      t.field('getUserJobs', {
        resolve: resolvers.getUserJobs,
        type: Job,
        list: [false],
        nullable: true,
        args: {
          type: stringArg(),
        },
      });
      t.field('getUserJobsFromAlgolia', {
        resolve: resolvers.getUserJobsFromAlgolia,
        type: JobListInfo,
        nullable: true,
        args: {
          type: stringArg(),
          page: intArg(),
        },
      });
      t.field('getUserTotalJobs', {
        resolve: resolvers.getUserTotalJobs,
        type: DefaultCountType,
        nullable: true,
      });
      t.field('getJob', {
        resolve: resolvers.getJob,
        type: Job,
        nullable: true,
        args: {
          id: stringArg({ required: true }),
        },
      });
      t.field('getAllJobsForAdmin', {
        resolve: resolvers.getAllJobsForAdmin,
        type: Job,
        list: [false],
        nullable: true,
      });
      t.field('getActiveJobsForAdmin', {
        resolve: resolvers.getActiveJobsForAdmin,
        type: Job,
        list: [false],
        nullable: true,
      });
      t.field('getExpiredJobsForAdmin', {
        resolve: resolvers.getExpiredJobsForAdmin,
        type: Job,
        list: [false],
        nullable: true,
      });
    },
  });
export default careerQuery;
