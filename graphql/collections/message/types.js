export default `

    type Message {
        id: String
        file: String
        filetype: String
        filename: String
        sender: String
        message: String
        channel: String
        createdon: String
    }

    type Feed {
        cursor: String
        messages: [Message]
    }

    type Inbox {
        cursor: String
        channels: [Channel]
    }

    type Channel {
        id: String
        channel: String
        type: String # dm, private, public
        image: String # userid1_userid2, TBD for channels
        name: String # userid1_userid2, TBD for channels
        last_message_on: String
        last_message: String
        unreadMessages: Int
        createdby: String
        createdon: String
    }
  
    input createChannelInputType {
        channelMemberId: String   
        type: String 
    }

    input createMessageInputType {
        message: String
        channel: String    
    }
  
`
