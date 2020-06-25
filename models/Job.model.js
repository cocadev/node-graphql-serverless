import dynamoose from "dynamoose"
import shortId from "shortid"
import "../config"

const JobSchema = new dynamoose.Schema(
  {
    id: {
      type: String,
      hashKey: true,
      trim: true,
      default: shortId.generate()
    },
    title: String,
    type: String,
    experience: String,
    jobInfoUrl: String,
    description: String,
    source: String,
    remoteFriendly: {
      type: Boolean,
      default: false
    },
    company: {
      id: { type: String },
      name: { type: String },
      domain: { type: String },
      logo: { type: String },
      location: { type: String }
    },
    postedBy: {
      id: { type: String },
      avatarUrl: {
        type: String,
        default:
          "https://s3.amazonaws.com/assets.designed.org/avatars/networking/avatar.png"
      }
    },
    publishedOn: String,
    expiredOn: String,
    isAvailable: {
      type: Boolean,
      default: false,
      index: {
        global: true,
        rangeKey: "publishedOn",
        name: "sortByAvaiabilityIndex",
        project: true
      }
    }
  },
  {
    timestamps: true,
    useDocumentTypes: true
  }
)

export default dynamoose.model(
  process.env.SERVERLESS_STAGE + "-Jobs-designed-app",
  JobSchema
)
