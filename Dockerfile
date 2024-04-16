FROM node:20-bookworm-slim as frontend_builder

WORKDIR /app

COPY frontend/package*.json ./

# Install the app dependencies
RUN npm install

COPY frontend .

RUN npm run build

# /// Runner ///

FROM node:20-bookworm-slim as runner

WORKDIR /app

COPY backend/* /app

RUN npm install
RUN npx tsc

EXPOSE 3000

COPY --from=frontend_builder /app/build/ /app/www/

CMD ["node", "dist/index.js"]