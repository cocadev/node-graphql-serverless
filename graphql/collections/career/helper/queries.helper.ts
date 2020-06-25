import aws_sdk from 'aws-sdk';
import AWSXRay from 'aws-xray-sdk';
import axios from 'axios';
import crypto from 'crypto';
import lodash from 'lodash';
import fetch from 'node-fetch';

const AWS = AWSXRay.captureAWS(aws_sdk);

export const searchJobFilter = (
  isAvailable = true,
  type = '',
  experience = '',
  remoteFriendly = false,
) => {
  const expiredDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .getTime()
    .toString();

  let o: {
    FilterExpression: any;
    ExpressionAttributeValues: any;
    ExpressionAttributeNames?: any;
  } = {
    FilterExpression:
      'isAvailable = :isAvailable and publishedOn >= :publishedOn',
    ExpressionAttributeValues: {
      ':isAvailable': isAvailable.toString(),
      ':publishedOn': expiredDate,
    },
  };
  if (type && type !== '') {
    o.FilterExpression = o.FilterExpression + ' and #jobtype = :jobtype';
    o.ExpressionAttributeValues[':jobtype'] = type;
    o = {
      ...o,
      ExpressionAttributeNames: o.ExpressionAttributeNames || {},
    };
    o.ExpressionAttributeNames['#jobtype'] = 'type';
  }
  if (experience && experience !== '') {
    o.FilterExpression =
      o.FilterExpression + ' and experience = :experience';
    o.ExpressionAttributeValues[':experience'] = experience;
  }
  if (remoteFriendly) {
    o.FilterExpression =
      o.FilterExpression + ' and remoteFriendly = :remoteFriendly';
    o.ExpressionAttributeValues[':remoteFriendly'] = remoteFriendly.toString();
  }
  return o;
};

const queryJobForNonQurableFilters = (jobFeed: { count: any; }, filter: { location: string; }) => {
  if (filter) {
    if (filter.location && filter.location !== '') {
      jobFeed = lodash.filter(
        jobFeed,
        (o: { company: { location: { toLowerCase: () => { includes: (arg0: string) => void; }; }; }; }) =>
          o.company &&
          o.company.location &&
          o.company.location
            .toLowerCase()
            .includes(filter.location.toLowerCase()),
      );
      jobFeed.count = lodash.size(jobFeed);
    }
  }
  return jobFeed;
};

const queryModelForJobWithFilters = (
  jobFeed,
  filter: { type: string; experience: string; remoteFriendly: any; },
) => {
  if (filter) {
    if (filter.type && filter.type !== '') {
      jobFeed = jobFeed.filter('type').contains(filter.type);
    }

    if (filter.experience && filter.experience !== '') {
      jobFeed = jobFeed.filter('experience').contains(filter.experience);
    }

    if (filter.remoteFriendly) {
      jobFeed = jobFeed.filter('remoteFriendly').contains(filter.remoteFriendly);
    }
  }

  return jobFeed;
};

export async function searchAllJobsWithInfiniteScrolling(
  Job,
  limit,
  isAvailable,
  filter,
  lastKey,
) {
  let totalJob = 0;
  let jobs = [];
  const today = new Date().getTime();
  const expiredDate = new Date(today - 30 * 24 * 60 * 60 * 1000)
    .getTime()
    .toString();
  const algorithm = 'aes-128-ecb';
  const cryptokey = new Buffer('9vApxLk5G3PAsJrM', 'utf8');
  const clearEncoding = 'buffer';
  const cipherEncoding = 'base64';

  while (totalJob <= 8) {
    let jobFeed = Job.query('isAvailable')
      .eq(isAvailable)
      .descending()
      .where('publishedOn')
      .ge(expiredDate);

    jobFeed = queryModelForJobWithFilters(jobFeed, filter);

    if (lastKey) {
      if (lastKey !== 'first') {
        const decipher = crypto.createDecipheriv(
          algorithm,
          cryptokey,
          new Buffer(''),
        );
        let plainCursor = '';
        // @ts-ignore
        plainCursor = decipher.update(lastKey, cipherEncoding, clearEncoding);
        plainCursor += decipher.final(clearEncoding);
        lastKey = JSON.parse(plainCursor);
        jobFeed = jobFeed.startAt(lastKey);
      }

      jobFeed = await jobFeed.limit(limit).exec();

      if (jobFeed.lastKey) {
        const cipher = crypto.createCipheriv(algorithm, cryptokey, new Buffer(''));
        // @ts-ignore
        const cipherCursor = cipher.update(
          new Buffer(JSON.stringify(jobFeed.lastKey), 'utf8'),
          clearEncoding,
          cipherEncoding,
        );
        lastKey = cipherCursor + cipher.final(cipherEncoding);
      } else {
        lastKey = jobFeed.lastKey;
      }

      // for location
      jobFeed = queryJobForNonQurableFilters(jobFeed, filter);

      if (jobFeed.count > 0) {
        totalJob += jobFeed.count;
        jobs = jobs.concat(jobFeed);
      }
    } else {
      break;
    }
  }

  return {
    lastKey,
    jobFeed: jobs,
  };
}

export const searchUserJobFilter = (jobs = [], type = '') => {
  if (type && type !== '') {
    if (type === 'Open') {
      jobs = jobs.filter(
        o => o.isAvailable && (!o.expiredOn || (o.expiredOn && o.expiredOn > Date.now())));
    } else if (type === 'Closed') {
      jobs = jobs.filter(o => !o.isAvailable);
    } else if (type === 'Expired') {
      jobs = jobs.filter(o => o.expiredOn && o.expiredOn < Date.now());
    }
  }

  return jobs;
};

export async function getTotalJobsUsingFilters(Job, isAvailable, filter) {
  const today = new Date().getTime();
  const expiredDate = new Date(today - 30 * 24 * 60 * 60 * 1000)
    .getTime()
    .toString();

  let totalJobQuery = Job.query('isAvailable')
    .eq(isAvailable)
    .descending()
    .where('publishedOn')
    .ge(expiredDate);

  totalJobQuery = queryModelForJobWithFilters(totalJobQuery, filter);

  if (filter && filter.location && filter.location !== '') {
    totalJobQuery = await totalJobQuery.exec();

    // for tag
    totalJobQuery = queryJobForNonQurableFilters(totalJobQuery, filter);

    return totalJobQuery.count;
  } else {
    return totalJobQuery.count().exec();
  }
}

export function allJobsFiltersToStringForFacets(filter) {
  const facetFilters = [];
  if (filter) {
    if (filter.type && filter.type !== '') {
      facetFilters.push('type: ' + filter.type);
    }
    if (filter.experience && filter.experience !== '') {
      facetFilters.push('experience: ' + filter.experience);
    }
    if (filter.remoteFriendly) {
      facetFilters.push('remoteFriendly: ' + filter.remoteFriendly);
    }
  }
  return facetFilters;
}

export function userJobsFiltersToString(userId, type = '') {
  let filterString = 'postedBy.id: ' + userId;

  if (type === 'Open') {
    const expiredDate = new Date(
      new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
    )
      .getTime()
      .toString();
    filterString += ' AND isAvailable: true';
    filterString += ' AND publishedOn >= ' + expiredDate;
    // jobs = jobs.filter(o => o.isAvailable && (!o.expiredOn || (o.expiredOn && o.expiredOn > now)))
  } else if (type === 'Closed') {
    filterString += ' AND isAvailable: false';
  } else if (type === 'Expired') {
    const expiredDate = new Date(
      new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
    )
      .getTime()
      .toString();
    filterString += ' AND publishedOn < ' + expiredDate;
  }
  // console.log('filterString',filterString)

  return filterString;
}

export async function checkWhetherOrganisationIsAvailable(
  Organisation,
  name,
  domain,
) {
  let org = await Organisation.queryOne('domain')
    .eq(domain)
    .exec();
  if (org) {
    return org;
  } else {
    const orgFromApi = await axios
      .get(
        'https://autocomplete.clearbit.com/v1/companies/suggest?query=' + name,
      )
      .then(response => {
        // console.log('response',response.data);
        if (response.data && response.data.length > 0) {
          return lodash.filter(response.data, item => {
            if (lodash.includes(domain, item.domain)) {
              return item;
            }
          });
        }
        return null;
      });

    org = orgFromApi ? orgFromApi[0] : null;
    return org
      ? {
        id: null,
        name: org.name,
        domain: org.domain,
        avatarUrl: org.logo,
      }
      : null;
  }
}

export async function getOrganisationAndSaveCompanyLogo(
  Organisation,
  name,
  domain,
  logoImageFile,
) {
  const serverlessStage =
    process.env.SERVERLESS_STAGE === 'production'
      ? 'production'
      : process.env.IS_OFFLINE
      ? 'local' // 'local-jobs'
      : 'staging';

  let org = await Organisation.queryOne('domain')
    .eq(domain)
    .exec();

  if (org) {
    return org;
  } else {
    const orgFromApi = await axios
      .get(
        'https://autocomplete.clearbit.com/v1/companies/suggest?query=' + name,
      )
      .then(response => {
        // console.log('response',response.data);
        if (response.data && response.data.length > 0) {
          return lodash.filter(response.data, item => {
            if (lodash.includes(domain, item.domain)) {
              return item;
            }
          });
        }
        return null;
      });

    org =
      orgFromApi && orgFromApi[0]
        ? await createNewOrganisation(
        Organisation,
        serverlessStage,
        orgFromApi[0],
        logoImageFile,
        null,
        )
        : logoImageFile
        ? await createNewOrganisation(
          Organisation,
          serverlessStage,
          null,
          logoImageFile,
          { name, domain },
        )
        : null;
    // console.log('org', org)
    return org
      ? {
        id: org.id,
        name: org.name,
        domain: org.domain,
        avatarUrl: org.avatarUrl,
      }
      : null;
  }
}

export async function getOrganisationForScrapper(Organisation, name) {
  const serverlessStage =
    process.env.SERVERLESS_STAGE === 'production'
      ? 'production'
      : process.env.IS_OFFLINE
      ? 'local' // 'local-jobs'
      : 'staging';

  // TODO use algolia for search here instead
  let org = await Organisation.queryOne('name')
    .eq(name)
    .exec();

  if (org && org.count > 0) {
    return {
      id: org[0].id,
      name: org[0].name,
      domain: org[0].domain,
      avatarUrl: org[0].avatarUrl,
    };
  } else {
    const orgFromApi = await axios
      .get(
        'https://autocomplete.clearbit.com/v1/companies/suggest?query=' + name,
      )
      .then(response => {
        return response.data;
      });

    if (orgFromApi) {
      const checkByDomain =
        orgFromApi[0] && orgFromApi[0].domain
          ? await Organisation.queryOne('domain')
            .eq(orgFromApi[0].domain)
            .exec()
          : null;

      if (checkByDomain) {
        return checkByDomain;
      }
    }
    org =
      orgFromApi && orgFromApi[0]
        ? await createNewOrganisation(
        Organisation,
        serverlessStage,
        orgFromApi[0],
        null,
        null,
        )
        : null;
    // console.log('org', org)
    return org
      ? {
        id: org.id,
        name: org.name,
        domain: org.domain,
        avatarUrl: org.avatarUrl,
      }
      : null;
  }
}

const createNewOrganisation = async (
  Organisation,
  serverlessStage,
  item,
  logoImageFile,
  input,
) => {
  if (item) {
    let newOrganisation = new Organisation(
      {
        name: item.name,
        domain: item.domain,
        avatarUrl: item.logo,
        status: 'Added From Clearbit',
      });
    await newOrganisation.save();

    const isUploaded = await uploadCompanyLogo(
      serverlessStage,
      newOrganisation.id,
      item.logo,
      logoImageFile,
    );

    if (isUploaded) {
      newOrganisation = await Organisation.update(
        {
          id: newOrganisation.id,
          avatarUrl:
            'https://assets.designed.org/careers/' +
            serverlessStage +
            '/company/' +
            newOrganisation.id +
            '/logo.jpg',
        });
    }

    return newOrganisation;
  } else if (input) {
    let newOrganisation = new Organisation(
      {
        name: input.name,
        domain: input.domain,
        avatarUrl: null,
        status: 'Added By User',
      });
    await newOrganisation.save();

    const isUploaded = await uploadCompanyLogo(
      serverlessStage,
      newOrganisation.id,
      null,
      logoImageFile,
    );

    if (isUploaded) {
      newOrganisation = await Organisation.update(
        {
          id: newOrganisation.id,
          avatarUrl:
            'https://assets.designed.org/careers/' +
            serverlessStage +
            '/company/' +
            newOrganisation.id +
            '/logo.jpg',
        });
    }

    return newOrganisation;
  }

  return null;
};

const uploadCompanyLogo = async (
  serverlessStage,
  companyId,
  logoUrl,
  logoImageFile,
) => {
  const s3 = new AWS.S3(
    {
      s3ForcePathStyle: true,
      region: 'us-east-1',
      endpoint: 's3.amazonaws.com',
      accessKeyId: process.env.ASSETSS3ACCESSKEY,
      secretAccessKey: process.env.ASSETSS3SECRETKEY,
    });

  let buffer = null;
  if (logoUrl) {
    buffer = await getBase64FromUrl(logoUrl);
  }

  if (!buffer && logoImageFile) {
    buffer = new Buffer(
      logoImageFile.replace(/^data:image\/\w+;base64,/, ''),
      'base64',
    );
  }
  if (!buffer) {
    return false;
  }
  const s3params = {
    Bucket: 'assets.designed.org',
    Key:
      'careers/' + serverlessStage + '/company/' + companyId + '/logo.jpg', // "careers/" + jobId +
    // "/company/logo.jpg",
    Body: buffer,
    ContentType: 'image/jpg',
    ACL: 'public-read',
    // Tagging: "userid=" + tokenUser.sub
  };
  await s3.putObject(s3params);
  return true;
};

const getBase64FromUrl = async url => {
  return fetch(url)
    .then(response => {
      if (response.ok) {
        console.log('Image Fetch :SUCCESS ', {
          'Job ID': '',
          'Source URL': url,
        });
        return response;
      }
      return Promise.reject(
        new Error(
          `Image Fetch : FAILED ${response.url}: ${response.status} ${response.statusText}`,
        ),
      );
    })
    .then(response => response.buffer());
};
