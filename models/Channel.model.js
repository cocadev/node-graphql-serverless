import dynamoose, { Schema } from "dynamoose"
import shortId from "shortid"
import "../config"
import { Array } from "core-js/library/web/timers"

const ChannelSchema = new Schema(
  {
    id: {
      type: String,
      hashKey: true,
      trim: true,
      default: shortId.generate
    },
    createdon: {
      type: String,
      trim: true,
      required: true
    },
    createdby: {
      type: String
    },
    type: {
      type: String
    }
  },
  {
    timestamps: true,
    useDocumentTypes: true
  }
)

export default dynamoose.model(
  process.env.SERVERLESS_STAGE + "-Channel-designed-app",
  ChannelSchema
)
