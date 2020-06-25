import dynamoose, { Schema } from "dynamoose"
import "../config"
import { Array } from "core-js/library/web/timers"

const ChannelmessageSchema = new Schema(
  {
    channel: {
      type: String,
      hashKey: true,
      trim: true
    },
    createdon_sender_id: {
      type: String,
      rangeKey: true
    },
    createdon: {
      type: String,
      trim: true,
      required: true
    },
    sender: {
      type: String,
      trim: true,
      required: true
    },
    file: {
      type: String
    },
    filetype: {
      type: String
    },
    filename: {
      type: String
    },
    message: {
      type: String,
      required: true
    },
    id: {
      type: String
    }
  },
  {
    timestamps: true,
    useDocumentTypes: true
  }
)

export default dynamoose.model(
  process.env.SERVERLESS_STAGE + "-Channelmessage-designed-app",
  ChannelmessageSchema
)
