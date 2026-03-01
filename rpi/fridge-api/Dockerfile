FROM node:22-alpine
WORKDIR /app
COPY server.mjs ./server.mjs
ENV HOST=0.0.0.0
ENV PORT=8080
ENV FRIDGE_SESSIONS_DIR=/data/sessions
EXPOSE 8080
CMD ["node","server.mjs"]
