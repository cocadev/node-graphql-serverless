const AWSXRay = require("aws-xray-sdk")
const dynamoose = require("dynamoose")
dynamoose.AWS = AWSXRay.captureAWS(require("aws-sdk"))

try {
  dynamoose.AWS.config.update({
    region: process.env.SERVERLESS_REGION
  })
  if (process.env.IS_OFFLINE && process.env.USE_AWS !== "yes") {
    dynamoose.AWS.config.endpoint = new dynamoose.AWS.Endpoint(
      process.env.LOCAL_DDB_ENDPOINT
    )
    dynamoose.setDefaults({
      update: true
    })
    dynamoose.local(process.env.LOCAL_DDB_ENDPOINT)
  } else {
    dynamoose.setDefaults({
      create: false,
      update: true
    })
    dynamoose.AWS.config.endpoint = new dynamoose.AWS.Endpoint(
      "https://dynamodb." + process.env.SERVERLESS_REGION + ".amazonaws.com"
    )
    if (process.env.IS_OFFLINE && process.env.USE_AWS === "yes") {
      console.log("use aws")

      dynamoose.AWS.config.update({
        accessKeyId: process.env.DYNAMO_ACCESS_KEY,
        secretAccessKey: process.env.DYNAMO_ACCESS_SECRETKEY
      })
    }
  }
} catch (error) {
  console.log("Failed to configure dynamoose: ", error)
}
