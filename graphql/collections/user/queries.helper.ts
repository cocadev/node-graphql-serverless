import lodash from 'lodash';
import crypto from 'crypto';

export function queryUserWithFilters(userFeed, filter) {
  if (filter) {
    if (filter.language && filter.language !== '') {
      userFeed = userFeed.filter('language').contains(filter.language);
    }
    if (filter.timezone && filter.timezone !== '') {
      userFeed = userFeed.filter('timezone').eq(filter.timezone);
    }
    if (filter.gender && filter.gender !== '') {
      userFeed = userFeed.filter('gender').eq(filter.gender);
    }

    if (filter.city && filter.city !== '') {
      userFeed = userFeed.filter('city').contains(filter.city);
    }

    if (filter.countrystate && filter.countrystate !== '') {
      userFeed = userFeed.filter('countrystate').contains(filter.countrystate);
    }

    if (filter.country && filter.country !== '') {
      userFeed = userFeed.filter('country').eq(filter.country);
    }
  }
  return userFeed;
}

export function queryUserWithSomeDifferentFilters(userFeed, filter) {
  if (filter) {
    if (filter.tag) {
      const tag = JSON.parse(filter.tag);
      userFeed = lodash.filter(userFeed, user => {
        const tags = user.tags ? JSON.stringify(user.tags) : [];
        return tags.includes(tag.value);
      });

      userFeed.count = lodash.size(userFeed);
    }
  }
  return userFeed;
}

export async function queryToGetMoreActiveUserByRole(
  User,
  limit,
  filter,
  role,
  lastKey,
) {
  let totalUser = 0;
  let users = [];
  const algorithm = 'aes-128-ecb';
  const cryptokey = new Buffer('9vApxLk5G3PAsJrM', 'utf8');
  const clearEncoding = 'buffer';
  const cipherEncoding = 'base64';

  while (totalUser <= 3) {
    let userFeed = User.query('role')
      .eq(role)
      .filter('isAvailable')
      .eq(true)
      .filter('approved')
      .eq(true)
      .filter('isRegistrationWizardCompleted')
      .eq(true);

    // filter
    userFeed = queryUserWithFilters(userFeed, filter);

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
        userFeed = userFeed.startAt(lastKey);
      }

      userFeed = await userFeed.limit(limit).exec();

      if (userFeed.lastKey) {
        const cipher = crypto.createCipheriv(algorithm, cryptokey, new Buffer(''));
        // @ts-ignore
        const cipherCursor = cipher.update(
          new Buffer(JSON.stringify(userFeed.lastKey), 'utf8'),
          clearEncoding,
          cipherEncoding,
        );
        lastKey = cipherCursor + cipher.final(cipherEncoding);
      } else {
        lastKey = userFeed.lastKey;
      }

      // for tag
      userFeed = queryUserWithSomeDifferentFilters(userFeed, filter);

      if (userFeed.count > 0) {
        totalUser += userFeed.count;
        users = users.concat(userFeed);
      }
    } else {
      break;
    }
  }

  return {
    lastKey,
    userFeed: users,
  };
}

export async function queryToGetTotalActiveUserByRole(User, filter, role) {
  let totalUsersQuery = User.query('role').eq(role);

  // filter
  totalUsersQuery = queryUserWithFilters(totalUsersQuery, filter);

  if (filter && filter.tag) {
    totalUsersQuery = await totalUsersQuery
      .filter('isAvailable')
      .eq(true)
      .filter('approved')
      .eq(true)
      .filter('isRegistrationWizardCompleted')
      .eq(true)
      .exec();

    // for tag
    totalUsersQuery = queryUserWithSomeDifferentFilters(totalUsersQuery, filter);

    return totalUsersQuery.count;
  } else {
    return totalUsersQuery
      .filter('isAvailable')
      .eq(true)
      .filter('approved')
      .eq(true)
      .filter('isRegistrationWizardCompleted')
      .eq(true)
      .count()
      .exec();
  }
}

function getFullFilteredUserList(tempList, filter) {
  tempList = lodash.filter(tempList, user => (
    user.approved && user.isAvailable && user.isRegistrationWizardCompleted
  ));

  // if (filter) {

  //     if (filter.tag && filter.tag !== '') {
  //         //let tag = JSON.parse(filter.tag);

  //         tempList = lodash.filter(tempList, function(user) {
  //             var tags = user.tags ? JSON.stringify(user.tags) : [];
  //             return tags.includes(filter.tag);
  //         });

  //     }
  //     if (filter.language && filter.language !== '') {
  //         tempList = lodash.filter(tempList, function(user) {
  //             var language = user.language ? JSON.stringify(user.language) : [];
  //             return language.includes(filter.language);
  //         });
  //     }
  //     if (filter.timezone && filter.timezone !== '') {
  //         tempList = lodash.filter(tempList, function(user) {
  //             var timezone = user.timezone ? JSON.stringify(user.timezone) : [];
  //             return timezone.includes(filter.timezone);
  //         });
  //     }
  //     if (filter.gender && filter.gender !== '') {
  //         tempList = lodash.filter(tempList, function(user) {
  //             return filter.gender === user.gender;
  //         });
  //     }

  //     if (filter.city && filter.city !== '') {
  //         tempList = lodash.filter(tempList, function(user) {
  //             return filter.city === user.city;
  //         });
  //     }

  //     if (filter.countrystate && filter.countrystate !== '') {
  //         tempList = lodash.filter(tempList, function(user) {
  //             return filter.countrystate === user.countrystate;
  //         });
  //     }

  //     if (filter.country && filter.country !== '') {
  //         tempList = lodash.filter(tempList, function(user) {
  //             return filter.country === user.country;
  //         });
  //     }

  // }
  return tempList;
}

export async function queryToGetMoreActiveUserByRoleRandomly(
  User,
  userListData,
  limit,
  filter,
  role = '',
  offset = 0,
) {
  let totalUser = 0;
  const sizeOfUserListData = lodash.size(userListData);
  let userList = [];
  let currentOffset = offset;
  while (totalUser <= 15 && sizeOfUserListData > currentOffset) {
    let tempList = await User.batchGet(
      getBatchGetUserList(userListData, currentOffset, limit),
    );
    currentOffset += limit;
    tempList = getFullFilteredUserList(tempList, filter);

    const sizeOfTempList = lodash.size(tempList);
    if (sizeOfTempList > 0) {
      totalUser += sizeOfTempList;
      userList = userList.concat(tempList);
    }
  }

  return {
    currentOffset,
    totalOffset: sizeOfUserListData,
    userFeed: offset === 0 ? lodash.shuffle(userList) : userList,
  };
}

function getBatchGetUserList(results, offset, limit) {
  const userList = [];

  for (let i = 0; i < limit; i++) {
    userList.push({ id: results[i + offset] });
  }
  return lodash.uniqBy(userList, 'id');
}

export function filtersToStringForFacets(filter) {
  const facetFilters = [];
  if (filter) {
    if (filter.language && filter.language !== '') {
      facetFilters.push('language: ' + filter.language);
    }
    if (filter.timezone && filter.timezone !== '') {
      facetFilters.push('timezone: ' + filter.timezone);
    }
    if (filter.gender && filter.gender !== '') {
      facetFilters.push('gender: ' + filter.gender);
    }

    if (filter.city && filter.city !== '') {
      facetFilters.push('city: ' + filter.city);
    }

    if (filter.countrystate && filter.countrystate !== '') {
      facetFilters.push('countrystate: ' + filter.countrystate);
    }

    if (filter.country && filter.country !== '') {
      facetFilters.push('country: ' + filter.country);
    }

    if (filter.tag && filter.tag !== '') {
      facetFilters.push('tags: ' + filter.tag);
    }
  }
  return facetFilters;
}
