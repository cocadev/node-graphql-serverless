import dynamoose, { Schema } from "dynamoose"
import User from "../../../models/User.model"
import auth from "../../helpers/auth"
import ses from "../../helpers/aws-ses"
const AWSXRay = require("aws-xray-sdk")
var AWS = AWSXRay.captureAWS(require("aws-sdk"))
import EmailTemplateBase from "email-templates-v2"
import path from "path"
import "handlebars/dist/handlebars.min.js"

export default {}
