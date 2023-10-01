from docker.io/node:18
workdir /app/backend/
copy ./backend/package*.json ./backend/.npmrc ./
run npm ci
copy ./backend/ ./

from docker.io/node:18
workdir /app/frontend/
copy ./frontend/package*.json ./frontend/.npmrc ./
run npm ci
copy ./frontend/ ./
run npm run build

from docker.io/ubuntu:22.04
run apt update
run apt install -y ca-certificates curl gnupg postgresql-client-14 wait-for-it
run mkdir -p /etc/apt/keyrings/ && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && apt update && apt install -y nodejs
run npm install -g concurrently
workdir /app/backend/
copy --from=0 /app/backend/ ./
workdir /app/frontend/build/
copy --from=1 /app/frontend/build/ ./
