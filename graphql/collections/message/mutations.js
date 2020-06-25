export default `
    createChannel(
        input: createChannelInputType
    ): Channel

    createMessage(
        input: createMessageInputType
    ): Message

    uploadChannelFile(
        channel: String!
        content: String!
        filetype: String!
        filename: String!
    ): DefaultPayloadType

    getFile(
        channel: String!
        file: String!
    ): String

    subscriberToken: String
  
`
