import auth from '../../helpers/auth';
import ses from '../../helpers/aws-ses';
import Job from '../../../models/Job.model';
import User from '../../../models/User.model';
import Organisation from '../../../models/Organisation.model';
import { getOrganisationAndSaveCompanyLogo } from './helper/queries.helper';
import EmailTemplateBase from 'email-templates-v2';
import path from 'path';
import 'handlebars';

export default {
  createJob: async (_: any, args: any, context: any) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );

    if (!tokenUser.error) {
      const user = await User.queryOne('id')
        .eq(tokenUser.user_id)
        .exec();
      const today = new Date().getTime().toString();
      // var expiredDate = new Date(today + 30 * 24 * 60 * 60 * 1000)
      args.company.domain = args.company.domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '');
      const job = new Job(
        {
          title: args.title,
          type: args.type,
          experience: args.experience,
          remoteFriendly: args.remoteFriendly,
          jobInfoUrl: args.jobInfoUrl,
          isAvailable: true,
          expiredOn: null,
          publishedOn: today,
          company: {
            name: args.company.name,
            location: args.company.location,
            logo: args.company.logo,
            domain: args.company.domain,
          },
          postedBy: {
            id: user.id,
            avatarUrl: user.avatarUrl,
          },
        });
      await job.save();
      const org = await getOrganisationAndSaveCompanyLogo(
        Organisation,
        args.company.name,
        args.company.domain,
        args.logoImageFile,
      );
      if (org) {
        await Job.update(
          {
            id: job.id,
            company: {
              id: org.id,
              name: org.name,
              location: args.company.location,
              domain: org.domain,
              logo: org.avatarUrl,    // careers/" + job.id + "/company/logo.jpg"
            },
          });
      }
      // send mail
      process.env.PATH =
        process.env.PATH + ':' + process.env.LAMBDA_TASK_ROOT;
      const templateDirForJobPost = !process.env.IS_OFFLINE
        ? path.join(__dirname, '/var/task/email/templates', 'job_post_success')
        : './email/templates/job_post_success';

      const approvalEmailForJobPost = new EmailTemplateBase.EmailTemplate(
        templateDirForJobPost,
      );

      const params = {
        Destination: {
          ToAddresses: [user.email],
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: 'Your job has been posted successfully.',
            },
            Text: {
              Charset: 'UTF-8',
              Data: 'Welcome to Designed.org!',
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: 'Job Post',
          },
        },
        ReturnPath: 'welcome@designed.org',
        Source: 'Designed.org <welcome@designed.org>',
      };

      await approvalEmailForJobPost.render(
        { First_name: 'firstName' },
        (err: any, templateresult: { html: string; }) => {
          if (!err) {
            params.Message.Body.Html.Data = templateresult.html;
          }
        },
      );
      const emailRequest = await ses.sendEmail(params);
      if (emailRequest.error) {
        return null;
      }
      return job;
    }

    return null;
  },
  updateJob: async (_: any, args: any, context: any) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    // console.log(tokenUser)
    if (!tokenUser.error) {
      const job = await Job.queryOne('id')
        .eq(args.input.id)
        .exec();

      if (args.input.company && args.input.company.domain) {
        args.input.company.domain = args.input.company.domain.replace(
          /^(?:https?:\/\/)?(?:www\.)?/i,
          '',
        );
      }
      const today = new Date().getTime();
      const oneMonthCheckoutDate = new Date(
        today - 30 * 24 * 60 * 60 * 1000,
      ).toString();
      if (
        (!job.isAvailable ||
          job.publishedOn < oneMonthCheckoutDate ||
          (job.expiredOn && job.expiredOn < today)) &&
        args.input.isAvailable
      ) {
        args.input.publishedOn = today;
        // input.expiredOn = null
      }

      await Job.update(args.input);

      if (args.input.company && args.input.company.name && args.input.company.domain) {
        const org = await getOrganisationAndSaveCompanyLogo(
          Organisation,
          args.input.company.name,
          args.input.company.domain,
          args.logoImageFile,
        );
        if (org && args.input && args.input.company) {
          if (org.avatarUrl !== args.input.company.logo) {
            await Job.update(
              {
                id: job.id,
                company: {
                  id: org.id,
                  name: org.name,
                  location: args.input.company.location,
                  domain: org.domain,
                  logo: org.avatarUrl,
                },
              });
          }
        }
      }

      return {
        error: null,
        message: 'Job updated',
      };
    }

    return {
      error: 'error',
      message: null,
    };
  },
  deleteJob: async (_: any, args: any, context: any) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      await Job.delete(args.id);

      return {
        error: null,
        message: 'Job deleted',
      };
    }

    return {
      error: 'error',
      message: 'can\'t delete',
    };
  },
  deleteAllJobs: async (_: any, args: any, context: any) => {
    const tokenUser = await auth.verify(
      context.event.headers.authorization || args.userinfo_access_token,
    );
    if (
      !tokenUser.error &&
      tokenUser.roles &&
      tokenUser.roles.includes('Admin')
    ) {
      const jobs = await Job.scan()
        .all()
        .exec();
      await Job.batchDelete(jobs);

      return {
        error: null,
        message: 'Jobs deleted',
      };
    }

    return {
      error: 'error',
      message: 'can\'t delete',
    };
  },
};
