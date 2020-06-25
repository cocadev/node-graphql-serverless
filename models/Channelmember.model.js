import dynamoose, { Schema } from "dynamoose"
import shortId from "shortid"
import "../config"
import { Array } from "core-js/library/web/timers"

const ChannelmemberSchema = new Schema(
  {
    channel: {
      type: String,
      hashKey: true,
      trim: true
    },
    user: {
      type: String,
      rangeKey: true,
      trim: true,
      required: true,
      index: {
        name: "userchannels",
        rangeKey: "last_message_on",
        global: true,
        project: true
      }
    },
    image: {
      // defines image for the user to see
      type: String
    },
    id: {
      type: String,
      default: shortId.generate
    },
    last_message_on: {
      type: String
    },
    last_message: {
      type: String
    },
    unreadMessages: {
      type: Number
    },
    name: {
      type: String
    }
  },
  {
    timestamps: true,
    useDocumentTypes: true
  }
)

export default dynamoose.model(
  process.env.SERVERLESS_STAGE + "-Channelmember-designed-app",
  ChannelmemberSchema
)
