import dynamoose, { Schema } from "dynamoose"
import User from "../../../models/User.model"
import Channel from "../../../models/Channel.model"
import Channelmember from "../../../models/Channelmember.model"
import Channelmessage from "../../../models/Channelmessage.model"
import auth from "../../helpers/auth"
import shortId from "shortid"
import Raven from "../../helpers/raven"
import userResolver from "../user/resolvers"
import Ably from "ably"
import AWS from "aws-sdk"
import messageHelper from "./helper"

import winston from "winston"
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "error",
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
})

export const createChannel = async (_, args, context) => {
  const tokenUser = await auth.verify(
    context.event.headers.authorization || args.input.userinfo_access_token
  )
  if (!tokenUser.error) {
    const timestamp = new Date().getTime().toString()
    const newChannel = new Channel({
      createdon: timestamp,
      createdby: tokenUser.sub,
      type: args.input.type
    })
    await newChannel.save()
    console.log("newChannel", newChannel)

    const partner = await User.queryOne("id")
      .eq(args.input.channelMemberId)
      .exec()
    var partnername = partner.firstname == null ? "" : partner.firstname
    partnername =
      partner.lastname == null
        ? partnername
        : partnername + " " + partner.lastname

    const newChannelmember1 = new Channelmember({
      user: tokenUser.sub,
      channel: newChannel.id,
      last_message_on: timestamp,
      unreadMessages: 0,
      image: args.input.channelMemberId,
      name: partnername === "" ? "Untitled" : partnername
    })
    newChannelmember1.save()
    console.log("newChannelmember1", newChannelmember1)

    const currentUser = await User.queryOne("id")
      .eq(tokenUser.sub)
      .exec()
    var ownname = currentUser.firstname == null ? "" : currentUser.firstname
    ownname =
      currentUser.lastname == null
        ? ownname
        : ownname + " " + currentUser.lastname

    const newChannelmember2 = new Channelmember({
      user: args.input.channelMemberId,
      channel: newChannel.id,
      last_message_on: timestamp,
      unreadMessages: 0,
      image: tokenUser.sub,
      name: ownname === "" ? "Untitled" : ownname
    })
    newChannelmember2.save()
    console.log("newChannelmember2", newChannelmember2)

    return newChannel
  }
}

export const createMessage = async (_, args, context) => {
  const tokenUser = await auth.verify(
    context.event.headers.authorization || args.userinfo_access_token
  )
  if (!tokenUser.error) {
    const channelAccess = await messageHelper.verifyChannelAccess(
      tokenUser.sub,
      args.input.channel
    )

    if (channelAccess === true) {
      const timestamp = new Date().getTime().toString()
      const message_id = shortId.generate()

      try {
        var ablyRest = new Ably.Rest({
          key: process.env.ABLY_KEY,
          clientId: tokenUser.sub
        })
        var channel = ablyRest.channels.get("dm:" + args.input.channel)
        channel.publish("newMessage", {
          message: args.input.message,
          channel: args.input.channel,
          createdon: timestamp,
          sender: tokenUser.sub,
          file: args.input.file,
          filename: args.input.filename,
          filetype: args.input.filetype,
          id: message_id,
          createdon_sender_id:
            timestamp + "_" + tokenUser.sub + "_" + message_id,
          fileurl: args.input.fileurl // realtime only to get an url
        })
      } catch (error) {
        console.log(error)
      }

      const newMessage = new Channelmessage({
        message: args.input.message,
        channel: args.input.channel,
        createdon: timestamp,
        sender: tokenUser.sub,
        file: args.input.file,
        filename: args.input.filename,
        filetype: args.input.filetype,
        id: message_id,
        createdon_sender_id: timestamp + "_" + tokenUser.sub + "_" + message_id
      })
      await newMessage.save()

      // get channel member here
      Channelmember.query("channel")
        .eq(args.input.channel)
        .exec(function(err, channelmembers) {
          console.log(channelmembers)
          channelmembers.forEach(channelmember => {
            Channelmember.update({
              channel: args.input.channel,
              user: channelmember.user,
              last_message_on: timestamp,
              last_message: args.input.message,
              unreadMessages: 1
            })
          })
        })

      // console.log(
      //     'newMessage',
      //     newMessage
      // )

      return newMessage
    } else {
      return {}
    }
  }
}
export const getFile = async (_, args, context) => {
  const tokenUser = await auth.verify(
    context.event.headers.authorization || args.userinfo_access_token
  )
  if (!tokenUser.error) {
    const channelAccess = await messageHelper.verifyChannelAccess(
      tokenUser.sub,
      args.channel
    )

    if (channelAccess === true) {
      try {
        // TODO validate channel and file access
        var ssm = new AWS.SSM({
          accessKeyId: process.env.SSM_ACCESS_KEY,
          secretAccessKey: process.env.SSM_SECRETACCESS_KEY,
          region: "us-east-1",
          endpoint: "ssm.us-east-1.amazonaws.com"
        })

        var ssmparams = {
          Name:
            "/" +
            process.env.SERVERLESS_STAGE +
            "/MESSAGE_FILE_KMS_ENCRYPTION_ACCESSSECRET_KEY",
          WithDecryption: true
        }

        const ssmRequest = await ssm.getParameter(ssmparams).promise()

        const s3 = new AWS.S3({
          s3ForcePathStyle: true,
          region: "us-east-1",
          endpoint: "s3.amazonaws.com",
          accessKeyId: process.env.MESSAGE_FILE_KMS_ENCRYPTION_ACCESS_KEY,
          secretAccessKey: ssmRequest.Parameter.Value,
          signatureVersion: "v4"
        })
        const s3params = {
          Bucket:
            process.env.SERVERLESS_STAGE === "production"
              ? "files.designed.org"
              : "staging.files.designed.org",
          Key: args.channel + "/" + args.file,
          Expires: 600
        }
        const fileResult = await s3.getSignedUrl("getObject", s3params)
        console.log("fileResult", fileResult)
        if (fileResult && fileResult.indexOf("http") !== -1) {
          return fileResult
        } else {
          return ""
        }
      } catch (error) {
        console.log(error)
        return ""
      }
    } else {
      return ""
    }
  }
}
export const uploadChannelFile = async (_, args, context) => {
  const tokenUser = await auth.verify(
    context.event.headers.authorization || args.userinfo_access_token
  )
  if (!tokenUser.error) {
    const channelAccess = await messageHelper.verifyChannelAccess(
      tokenUser.sub,
      args.channel
    )

    if (channelAccess === true) {
      // logger.log("debug", args)

      try {
        var ssm = new AWS.SSM({
          accessKeyId: process.env.SSM_ACCESS_KEY,
          secretAccessKey: process.env.SSM_SECRETACCESS_KEY,
          region: "us-east-1",
          endpoint: "ssm.us-east-1.amazonaws.com"
        })

        var ssmparams = {
          Name:
            "/" +
            process.env.SERVERLESS_STAGE +
            "/MESSAGE_FILE_KMS_ENCRYPTION_ACCESSSECRET_KEY",
          WithDecryption: true
        }

        // logger.log("debug", 'ssmparams', ssmparams)

        const ssmRequest = await ssm.getParameter(ssmparams).promise()
        const buffer = new Buffer(
          args.content.replace(/^data:\w+\/\w+;base64,/, ""),
          "base64"
        )

        const timestamp = new Date().getTime().toString()
        const file_id = shortId.generate()

        const s3 = new AWS.S3({
          s3ForcePathStyle: true,
          region: "us-east-1",
          endpoint: "s3.amazonaws.com",
          accessKeyId: process.env.MESSAGE_FILE_KMS_ENCRYPTION_ACCESS_KEY,
          secretAccessKey: ssmRequest.Parameter.Value
        })

        // const locals3params = {
        //     Bucket:
        //         "local.files.designed.org",
        //     Key: args.channel+"/"+args.filename,
        //     Body: buffer,
        //     ContentType: args.filetype,
        // }
        // const localuploadResult = await s3.putObject(locals3params).promise()

        const s3params = {
          Bucket:
            process.env.SERVERLESS_STAGE === "production"
              ? "files.designed.org"
              : "staging.files.designed.org",
          Key: args.channel + "/" + file_id,
          Body: buffer,
          ContentType: args.filetype,
          ServerSideEncryption: "aws:kms",
          SSEKMSKeyId: process.env.MESSAGE_FILE_KMS_ENCRYPTION_KEYID,
          ACL: "private",
          Tagging:
            "channel=" +
            args.channel +
            "&userid=" +
            tokenUser.sub.replace("|", "-")
        }

        // logger.log("debug", 's3params', s3params)

        const uploadResult = await s3.putObject(s3params).promise()
        logger.log("debug", "uploadResult", uploadResult)

        if (uploadResult && uploadResult.ETag) {
          const fileurl = await getFile(
            _,
            {
              channel: args.channel,
              file: file_id
            },
            context
          )

          createMessage(
            _,
            {
              input: {
                message: args.filename,
                channel: args.channel,
                file: file_id,
                filetype: args.filetype,
                filename: args.filename,
                fileurl: fileurl
              }
            },
            context
          )

          return {
            id: file_id,
            generatedId: fileurl,
            message: "Uploaded",
            error: ""
          }
        }

        return {
          error: "Failed to upload",
          message: ""
        }
      } catch (error) {
        console.log("error", error)
        Raven.captureException(error, {
          tags: {
            graphqlcollection: "message",
            resolvefunction: "uploadChannelFile-1",
            referenceid: tokenUser.sub
          }
        })
        return {
          error: "Failed to upload",
          message: ""
        }
      }
    } else {
      return {
        error: "Failed to upload",
        message: ""
      }
    }
  }
}

export const subscriberToken = async (_, args, context) => {
  try {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token
    )
    if (!tokenUser.error) {
      const channels = await Channelmember.query("user")
        .eq(tokenUser.sub)
        .descending()
        .exec()

      console.log("channels", channels)
      var userCapabilities = {}
      channels.forEach(function(channel) {
        userCapabilities["dm:" + channel.channel] = ["publish", "subscribe"]
      })

      console.log("userCapabilities", userCapabilities)
      var ablyRest = new Ably.Rest({
        key: process.env.ABLY_KEY,
        clientId: tokenUser.sub
      })

      const ablyToken = await new Promise(function(resolve, reject) {
        ablyRest.auth.requestToken(
          {
            clientId: tokenUser.sub,
            capability: JSON.stringify(userCapabilities)
          },
          null,
          (err, tokenRequest) => {
            if (err) {
              reject("")
            } else {
              resolve(JSON.stringify(tokenRequest))
            }
          }
        )
      })
      return ablyToken
    }
  } catch (error) {
    console.log(error)
    logger.log("error", error, {
      referenceid: ""
    })
    Raven.captureException(error, {
      tags: {
        graphqlcollection: "message",
        resolvefunction: "subscriberToken",
        referenceid: ""
      }
    })
    return null
  }
}

export default {
  createMessage,
  createChannel,
  uploadChannelFile,
  getFile,
  subscriberToken
}
