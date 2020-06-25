import dynamoose, { Schema } from "dynamoose"
import "../config"
import shortId from "shortid"

const OrganisationSchema = new Schema(
  {
    id: {
      type: String,
      hashKey: true,
      trim: true,
      default: shortId.generate
    },
    domain: {
      type: String,
      trim: true,
      index: {
        name: "organisationByDomain",
        global: true,
        project: true
      }
    },
    name: {
      type: String,
      trim: true,
      index: {
        name: "organisationByName",
        global: true,
        project: true
      }
    },
    status: {
      type: String
    },
    avatarUrl: {
      type: String,
      default:
        "https://s3.amazonaws.com/assets.designed.org/organisations/logos/default-logo.jpg"
    }
  },
  {
    timestamps: true,
    useDocumentTypes: true
  }
)

export default dynamoose.model(
  process.env.SERVERLESS_STAGE + "-Organisation-designed-app",
  OrganisationSchema
)
