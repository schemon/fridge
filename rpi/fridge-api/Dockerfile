# Stage 1: build the React UI
FROM node:22-alpine AS ui-builder
WORKDIR /ui
COPY ui/package.json ./
RUN npm install
COPY ui/ ./
RUN npm run build

# Stage 2: runtime
FROM node:22-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.mjs ./
COPY --from=ui-builder /ui/dist ./public
ENV HOST=0.0.0.0
ENV PORT=8080
ENV FRIDGE_SESSIONS_DIR=/data/sessions
EXPOSE 8080
CMD ["node", "server.mjs"]
