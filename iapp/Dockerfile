FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

ENV IEXEC_OUT=/iexec_out
ENV IEXEC_IN=/iexec_in

RUN mkdir -p /iexec_out /iexec_in

ENTRYPOINT ["node", "src/app.js"]
