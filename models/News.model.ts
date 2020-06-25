import dynamoose from "dynamoose"
import shortId from "shortid"
import "../config"

const NewsSchema = new dynamoose.Schema(
  {
    id: {
      type: String,
      hashKey: true,
      default: shortId.generate
    },
    author: {
      type: String
    },
    createdby: {
      type: String,
    },
    updatedby: {
      type: String,
    },
    title: {
      type: String,
    },
    body: {
      type: String,
    },
    product: {
      type: String,
    },
    type: {
      type: String,
    },
    publishedon: {
      type: String,
      default: "unpublished"
    }
  },
  {
    timestamps: true,
    useDocumentTypes: true
  }
)

export default dynamoose.model(
  process.env.SERVERLESS_STAGE + "-News-designed-app",
  NewsSchema
)