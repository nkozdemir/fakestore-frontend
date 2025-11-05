FROM node:24.11-alpine3.22 AS build

WORKDIR /app

# Provide the API base URL at build time so Vite can inline it
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Install dependencies using the lockfile for reproducible builds
COPY package*.json ./
RUN npm ci

# Copy the source and build the production bundle
COPY . .
RUN npm run build

# -- Production image -------------------------------------------------------
FROM nginx:1.27-alpine3.22 AS runtime
RUN apk upgrade --no-cache

# Copy the static build output to nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
