FROM node:20-bookworm-slim as frontend_builder

WORKDIR /app

COPY frontend/package*.json ./

# Install the app dependencies
RUN npm install

COPY frontend .

RUN npm run build

# /// Runner ///

FROM debian:bookworm-slim as runner

# Install dependencies for caddy
RUN apt-get update && apt install -y \
debian-keyring \
debian-archive-keyring \
apt-transport-https \
curl

# Add caddy apt repo
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list

# Install caddy
RUN apt update && apt install -y caddy

WORKDIR /app

COPY Caddyfile /etc/caddy/Caddyfile

COPY --from=frontend_builder /app/build ./www

EXPOSE 3000

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]