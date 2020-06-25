FROM mhart/alpine-node:8

COPY package.json yarn.lock /app/

# ADD app-backend/dynamodb/yarn.lock /yarn.lock
# ADD app-backend/dynamodb/package.json /package.json

# ENV NODE_PATH=/node_modules
# ENV PATH=$PATH:/node_modules/.bin
RUN yarn global add serverless@1.43.0
RUN apk --update add openjdk7-jre
RUN apk add --update openssl
RUN apk add libssh2
RUN apk add libcurl
RUN apk add curl
RUN apk add git
RUN apk add openssh
RUN apk --no-cache add ca-certificates

#Parallel && AWS CLI
RUN apk add parallel \
    && apk add py-pip && pip install --upgrade pip \
    && pip install awscli && aws configure set default.region us-east-1

WORKDIR /app

RUN yarn --pure-lockfile

# RUN -p mkdir ~/.aws
RUN chmod 700 ~/.aws
# RUN rm ~/.aws/config
RUN touch ~/.aws/credentials
RUN echo "[default]" > ~/.aws/credentials
RUN echo "aws_access_key_id=a" >> ~/.aws/credentials
RUN echo "aws_secret_access_key=a" >> ~/.aws/credentials

# ADD . /app

CMD ["yarn", "start"]
