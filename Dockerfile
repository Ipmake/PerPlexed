FROM node:22-bookworm-slim as runner

WORKDIR /app

COPY backend/* /app

RUN npm install
RUN npx tsc

EXPOSE 3000

COPY frontend/build/ /app/www/

CMD ["node", "dist/index.js"]