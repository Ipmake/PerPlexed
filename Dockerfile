FROM node:20-bookworm-slim as frontend_builder

WORKDIR /app

COPY frontend/package*.json ./

# Install the app dependencies
RUN npm install

COPY frontend .

RUN npm run build

FROM caddy  as runner
# Expose the port on which the app will run

WORKDIR /app

COPY Caddyfile /etc/caddy/Caddyfile

COPY --from=frontend_builder /app/build ./www

EXPOSE 3000
# Start the app
