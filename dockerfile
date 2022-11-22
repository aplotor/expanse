from docker.io/node:lts
workdir /app/backend/
copy ./backend/package*.json ./backend/.npmrc ./
run npm ci
copy ./backend/ ./

from docker.io/node:lts
workdir /app/frontend/
copy ./frontend/package*.json ./frontend/.npmrc ./
run npm ci
copy ./frontend/ ./
run npm run build

from docker.io/ubuntu:latest
run apt update
run apt install -y curl wait-for-it postgresql-client-14
run curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && apt install -y nodejs
run npm install -g concurrently
workdir /app/backend/
copy --from=0 /app/backend/ ./
workdir /app/frontend/build/
copy --from=1 /app/frontend/build/ ./
