export default `
    channel(id: String): Channel
    channelFeed(id: String!,type: String,cursor: String): Feed
    userChannels(cursor: String): Inbox    
`
