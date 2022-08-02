FROM node:16-alpine

# update packages
RUN apk update

# create root application folder
WORKDIR /variamos

# copy configs to /variamos folder
COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

# copy source code to /variamos/src folder
COPY ./ . 

# # check files list
# RUN ls -a

# No sense to run this after copying!!!
# RUN npm ci
# RUN npm install -g ts-node
# RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
