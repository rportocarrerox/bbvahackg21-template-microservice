FROM node:alpine
LABEL maintainer="fearless-team"

COPY package.json /app/package.json
COPY ./src /app/src
COPY ./config /app/config
WORKDIR /app
RUN npm install

RUN chmod -R u+x /app && \
    chgrp -R 0 /app && \
    chmod -R g=u /app /etc/passwd

ENV PORT 8091
ENV JWT_SECRET fearlesshack21
ENV DATABASE [DATABASE_NAME]

EXPOSE 8091

CMD ["npm", "run", "ibm-cloud"]
