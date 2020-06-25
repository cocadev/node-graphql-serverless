import { objectType, inputObjectType } from 'nexus';
import { User, updateUserType } from '../user';
import resolvers from './types.resolvers';

export const AlgoliaJob = objectType(
  {
    name: 'AlgoliaJob',
    definition(t) {
      t.string('id', { nullable: true });
      t.string('title', { nullable: true });
      t.string('type', { nullable: true });
      t.string('experience', { nullable: true });
      t.string('jobInfoUrl', { nullable: true });
      t.string('remoteFriendly', { nullable: true });
      t.string('isAvailable', { nullable: true });
      t.string('publishedOn', { nullable: true });
      t.string('expiredOn', { nullable: true });
      t.field('company', {
        type: Company,
        nullable: true,
      });
      t.field('postedBy', {
        type: User,
        nullable: true,
      });
      t.string('description', { nullable: true });
      t.string('source', { nullable: true });
    },
  });

export const Company = objectType(
  {
    name: 'Company',
    definition(t) {
      t.string('name', { nullable: true });
      t.string('domain', { nullable: true });
      t.string('logo', { nullable: true });
      t.string('location', { nullable: true });
    },
  });

export const Job = objectType(
  {
    name: 'Job',
    definition(t) {
      t.string('id', { nullable: true });
      t.string('title', { nullable: true });
      t.string('type', { nullable: true });
      t.string('experience', { nullable: true });
      t.string('jobInfoUrl', { nullable: true });
      t.boolean('remoteFriendly', { nullable: true });
      t.boolean('isAvailable', { nullable: true });
      t.string('publishedOn', { nullable: true });
      t.string('expiredOn', { nullable: true });
      t.field('company', {
        type: Company,
        nullable: true,
      });
      t.field('postedBy', {
        type: User,
        nullable: true,
        resolve: resolvers.Job.postedBy,
      });
      t.string('description', { nullable: true });
      t.string('source', { nullable: true });
    },
  });

export const JobFeed = objectType(
  {
    name: 'JobFeed',
    definition(t) {
      t.string('lastKey', { nullable: true });
      t.field('jobFeed', {
        type: Job,
        list: [false],
        nullable: true,
      });
    },
  });

export const JobListInfo = objectType(
  {
    name: 'JobListInfo',
    definition(t) {
      t.string('totalJobs', { nullable: true });
      t.int('currentPage', { nullable: true });
      t.int('totalPage', { nullable: true });
      t.field('jobFeed', {
        type: AlgoliaJob,
        list: [false],
        nullable: true,
      });
    },
  });

export const JobFilter = inputObjectType(
  {
    name: 'JobFilter',
    definition(t) {
      t.string('type');
      t.string('experience');
      t.boolean('remoteFriendly');
      t.string('location');
    },
  });

export const updateJobType = inputObjectType(
  {
    name: 'updateJobType',
    definition(t) {
      t.string('id', { required: true });
      t.string('title');
      t.string('type');
      t.string('experience');
      t.string('jobInfoUrl');
      t.boolean('remoteFriendly');
      t.boolean('isAvailable');
      t.string('publishedOn');
      t.string('expiredOn');
      t.string('updatedAt');
      t.string('logoImageFile');
      t.field('company', { type: updateCompanyType });
      t.field('postedBy', { type: updateUserType });
    },
  });

export const updateCompanyType = inputObjectType(
  {
    name: 'updateCompanyType',
    definition(t) {
      t.string('name');
      t.string('domain');
      t.string('logo');
      t.string('location');
    },
  });
export default {
  AlgoliaJob,
  Company,
  Job,
  JobFeed,
  JobFilter,
  JobListInfo,
  updateJobType,
  updateCompanyType,
};
