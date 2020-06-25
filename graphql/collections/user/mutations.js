export default `
    setState(
        state: String!
    ): DefaultPayloadType

    createUser(
        email:String, 
        id: String,
        username: String
    ): User

    verifyEmail(
        userinfo_access_token: String!
    ) : DefaultPayloadType

    updateUser(
        input: updateUserType
    ): DefaultPayloadType

    sendApprovalEmail(
        id: String
        userinfo_access_token: String
    ): DefaultPayloadType

    createSocialUser(
        role: String!
        updateAuth0: Boolean!
        signup_access_token: String!
    ): DefaultPayloadType

    
    updateUserByAdmin(
        input: updateUserType
        userinfo_access_token: String
    ): DefaultPayloadType

    deleteUserByAdmin(
        id: String!
        userinfo_access_token: String
    ): DefaultPayloadType

    deleteUserByOwn(
        id: String!
        userinfo_access_token: String
    ): DefaultPayloadType

    approveUserByAdmin(
        id: String!,
        approved: Boolean
        userinfo_access_token: String
    ): DefaultPayloadType

    setUserCreation(
        id: String!
        accountCreatedOn: String!
        userinfo_access_token: String
    ): DefaultPayloadType
    
    setInternalUser(
        id: String!,
        isInternal: Boolean!
        userinfo_access_token: String
    ): DefaultPayloadType

    uploadAvatar(
        base64: String!
        id: String
        userinfo_access_token: String
    ): DefaultPayloadType

`
