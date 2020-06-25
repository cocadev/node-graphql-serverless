import dynamoose, { Schema } from "dynamoose"
import shortId from "shortid"
import "../config"

const TagSchema = new Schema(
  {
    id: {
      type: String,
      hashKey: true,
      trim: true,
      default: shortId.generate
    },
    text: {
      type: String,
      trim: true
    },
    lowercasetext: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  {
    timestamps: true,
    useDocumentTypes: true
  }
)

export default dynamoose.model(
  process.env.SERVERLESS_STAGE + "-Tags-designed-app",
  TagSchema
)
