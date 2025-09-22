FROM node:20-bookworm

WORKDIR /app

# ffmpeg for media processing (can be used later by route handlers)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy Next.js app
WORKDIR /app/next
COPY next/package.json next/package-lock.json* ./
RUN npm ci || npm install

COPY next .

ENV NODE_ENV=production

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]


