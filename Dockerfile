# cypod-telemetry
# Backend/Dockerfile

# note: four stages rather than the usual two. The extra ones exist because this project has TWO
# Prisma clients generated into src/, and because migrations must run from the Prisma CLI — a
# dev dependency the runtime image has no business carrying. Splitting them lets the container that
# ships to production hold production dependencies only, while the migration job still gets the
# full toolchain it needs.

# --- build: full toolchain, generates both clients, compiles to dist/ -------------------------
FROM node:24-alpine AS build
WORKDIR /app

# note: Prisma shells out to OpenSSL to pick its engine target. Alpine ships without it, and the
# failure surfaces as an opaque "Unable to require libquery_engine" much later, at runtime.
RUN apk add --no-cache openssl

COPY package*.json ./
# note: --ignore-scripts because postinstall runs `prisma generate`, and the schemas are not in the
# image yet at this point. Generation happens explicitly below, once the source is present.
RUN npm ci --ignore-scripts

COPY . .

# note: `prisma generate` reads the datasource block and refuses to run without a URL, even though
# it never connects. These are throwaway build-time values — the real ones arrive as environment
# variables at run time and nothing here is baked into the image.
ENV AUTH_DATABASE_URL="postgresql://build:build@localhost:5432/auth_db" \
    DEVICES_DATABASE_URL="postgresql://build:build@localhost:5432/devices_db"

RUN npm run auth:db:generate && npm run devices:db:generate
RUN npm run build

# --- deps: production dependencies only, for the runtime image -------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# --- migrate: the one-shot migration job compose runs before the API starts -------------------
# note: built FROM build because applying a migration needs the Prisma CLI, the .prisma schemas and
# the migration folders — none of which the API needs once it is running. Keeping this a separate
# image is what allows the runtime stage below to stay free of dev dependencies.
FROM build AS migrate
CMD ["sh", "-c", "npm run auth:db:deploy && npm run devices:db:deploy"]

# --- runtime: what actually serves traffic ----------------------------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
# note: dist/ already contains the generated Prisma clients — the schemas emit into src/, and the
# build copies them through. Nothing has to be re-generated here.
COPY --from=build /app/dist ./dist
COPY package.json ./

# note: the base image ships an unprivileged `node` user. Running as root inside a container is the
# default and is worth undoing in one line.
USER node

EXPOSE 3000
CMD ["node", "dist/main"]
