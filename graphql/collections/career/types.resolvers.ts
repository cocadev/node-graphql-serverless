import User from '../../../models/User.model';

export default {
  Job: {
    postedBy: async ({ postedBy }) => {
      try {
        if (postedBy && postedBy.avatarUrl && postedBy.avatarUrl.includes('assets.designed.org')) {
          return postedBy;
        }

        if (postedBy) {
          const user = await User.get({ id: postedBy.id });
          if (user && user.avatarUrl) {
            postedBy.avatarUrl = user.avatarUrl;
          }
          return postedBy;
        } else {
          return null;
        }
      } catch (error) {
        console.log(error);
        return null;
      }

    },
  },
};
