export default `
    user(userinfo_access_token: String): User
    adminuser(id: String, accounttype: String, userinfo_access_token: String): User
    userFromAdmin(id: String!): User
    getAllUsers: [User]
    getInternalUsers: [User]
    getUsersByRole(role: String): [User]
    getTotalActiveUsersByRole(filter: UserFilter, role: String): String
    getActiveUsersByRole(role: String): [User]
    getMoreActiveUsersByRole(filter: UserFilter, role: String, lastKey: String): UserFeed
    getRandomUsers(filter: UserFilter, role: String, offset: Int): UserListInfo @cacheControl(maxAge: 86400)
    getMoreActiveUsersByRoleFromAlgolia(filter: UserFilter, role: String, sortByType: String, page: Int): UserListInfo @cacheControl(maxAge: 600)
    getApprovedUsersByRole(role: String): [User]
    getUnapprovedUsersByRole(role: String): [User]
    mentors: [User]
    getActiveMentors: [User]
    mentees: [User]
    recruiters: [User] 
    users: [User]
    getWaitQueueStatus(id: String!): DefaultPayloadType
    getTotalUsers(approved: Boolean, isAvailable: Boolean): DefaultPayloadType
    upload(userid: String!, objectName: String!, url: String!, contentType: String!): UploadType
    getBasicUsers: [User]
    region: String
    userFullname(id: String!): String @cacheControl(maxAge: 6000)
    userProfile(id: String!): User
    getToken(id: String!): String
`
