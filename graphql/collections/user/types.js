export default `

    type User {
        id: String
        role: String
        email: String
        username: String
        firstname: String
        lastname: String
        name: String
        gender: String
        isAvailable: Boolean
        isEnabled : Boolean
        avatarUrl: String
        jobTitle: String
        employer: String
        location: String
        zipcode: String
        city: String
        countrystate: String
        country: String
        timezone: String
        language: String
        latitude: String
        longitude: String
        about: String
        website: String
        twitter: String
        facebook: String
        linkedin: String
        dribbble: String
        behance: String
        github: String
        pinterest: String
        instagram: String
        medium: String
        slideshare: String
        youtube: String
        codepen: String
        approved: Boolean
        email_verified: Boolean
        tags: [TagBaseType]
        isInternal: Boolean
        isMentor: Boolean
        isMentee: Boolean
        isRecruiter: Boolean
        last_login: String
        isRegistrationWizardCompleted: Boolean
        accountCreatedOn: String
        years_of_experience: String
        isEmployed: Boolean
        have_perform_role: String
        why_perform_role: String
        hear_about_us: String
        responding_region: String
    }
  
    input updateUserType {
        id: String
        role: String
        email: String
        email_verified: Boolean
        phone_number_verified: Boolean
        accountType: String
        username: String
        firstname: String
        lastname: String
        name: String
        gender: String
        isAvailable: Boolean
        isEnabled : Boolean
        avatarUrl: String
        jobTitle: String
        employer: String
        location: String
        zipcode: String
        city: String
        countrystate: String
        country: String
        timezone: String
        language: String
        latitude: String
        longitude: String
        about: String
        website: String
        twitter: String
        facebook: String
        linkedin: String
        dribbble: String
        behance: String
        github: String
        pinterest: String
        instagram: String
        medium: String
        slideshare: String
        youtube: String
        codepen: String
        tags: [TagInputType]
        lastLogin: Int
        isRegistrationWizardCompleted: Boolean
        accountCreatedOn: String
        accountUpdatedOn: String
        userinfo_access_token: String
        years_of_experience: String
        isEmployed: Boolean
        have_perform_role: String
        why_perform_role: String
        hear_about_us: String
    }

    type UserFeed
    {
        lastKey: String
        userFeed: [User]
    }

    input UserFilter
    {
        tag: String
        city: String
        countrystate: String
        country: String
        language: String
        timezone: String
        gender: String
    }

    type UserListInfo
    {
        totalUsers: String
        currentPage: Int
        totalPage: Int
        currentOffset: Int
        totalOffset: Int
        filters: String
        userFeed: [User]
    }
  
`
