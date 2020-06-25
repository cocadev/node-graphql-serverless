import dynamoose from "dynamoose"
import "../config"

const UserSchema = new dynamoose.Schema(
  {
    id: {
      type: String,
      hashKey: true,
      trim: true
    },
    role: {
      type: String,
      index: {
        name: "sortByRole",
        global: true,
        project: true
      }
    },
    email: {
      type: String,
      trim: true,
      required: true
    },
    username: String,
    firstname: String,
    lastname: String,
    gender: String,
    isAvailable: Boolean,
    isEnabled: {
      type: Boolean,
      default: true
    },
    avatarUrl: {
      type: String,
      default:
        "https://s3.amazonaws.com/assets.designed.org/avatars/networking/avatar.png"
    },
    jobTitle: String,
    employer: String,
    location: String,
    zipcode: String,
    city: String,
    countrystate: String,
    country: String,
    timezone: String,
    language: String,
    latitude: String,
    longitude: String,
    about: String,
    website: String,
    twitter: String,
    facebook: String,
    linkedin: String,
    dribbble: String,
    behance: String,
    github: String,
    pinterest: String,
    instagram: String,
    medium: String,
    slideshare: String,
    youtube: String,
    codepen: String,
    approved: Boolean,
    email_verified: Boolean,
    phone_number_verified: Boolean,
    accountType: String,
    tags: [
      {
        text: { type: String },
        id: { type: String }
      }
    ],
    lastLogin: Number,
    isRegistrationWizardCompleted: {
      type: Boolean,
      default: false
    },
    isInternal: Boolean,
    accountCreatedOn: Date,
    accountUpdatedOn: Date,
    years_of_experience: String,
    isEmployed: Boolean,
    have_perform_role: String,
    why_perform_role: String,
    hear_about_us: String
  },
  {
    timestamps: true,
    useDocumentTypes: true
  }
)

export default dynamoose.model(
  process.env.SERVERLESS_STAGE + "-Users-designed-app",
  UserSchema
)
