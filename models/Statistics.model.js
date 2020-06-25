import dynamoose, { Schema } from "dynamoose"
import "../config"

const StatisticsSchema = new Schema(
  {
    id: {
      type: String,
      hashKey: true,
      trim: true
    },
    updatedOn: String
  },
  {
    timestamps: true,
    useDocumentTypes: true
  }
)

export default dynamoose.model(
  process.env.SERVERLESS_STAGE + "-Statistics-designed-app",
  StatisticsSchema
)
