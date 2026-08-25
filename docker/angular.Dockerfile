# syntax=docker/dockerfile:1.7
#
# Builds spring-petclinic-angular from the local submodule checkout and
# serves it via nginx. Two upstream quirks this Dockerfile deliberately works
# around (the submodule's own Dockerfile gets both wrong):
#
#  1. @angular/build:application with outputPath: "dist" emits the browser
#     bundle under dist/browser/, plus dist/3rdpartylicenses.txt and
#     dist/prerendered-routes.json at the dist/ root. Copying dist/ itself
#     (as the submodule's Dockerfile does) serves the app from /browser/.
#  2. src/index.html ships <base href="/petclinic"> with NO trailing slash.
#     The build emits relative asset URLs (e.g. src="./assets/images/pets.png",
#     <script src="main-HASH.js">); resolved against a base with no trailing
#     slash, the last path segment is dropped and assets 404 at the origin
#     root instead of under /petclinic/. --base-href=/petclinic/ is a fix,
#     not a style choice. The Angular router is unaffected either way -
#     @angular/common normalises the base path before routing.
#
# Build context is the repository root - see docker-compose.yml.

# node:24-alpine is a trap here: @angular/build's optional `lmdb` dependency
# has no musl-linked prebuild, and @lmdb/lmdb-linux-x64 declares no "libc"
# field at all, so npm installs the glibc binary on Alpine and it fails to
# load at require() time. `--omit=optional` is not a workaround - it would
# also drop the rolldown/esbuild/oxc-parser native binaries the build needs.
ARG NODE_IMAGE=node:24-bookworm-slim
ARG NGINX_IMAGE=nginx:1.29-alpine

FROM ${NODE_IMAGE} AS build
ARG REST_API_URL=/petclinic/api/
ARG BASE_HREF=/petclinic/
ENV CI=1 NG_CLI_ANALYTICS=false
WORKDIR /workspace

COPY spring-petclinic-angular/package.json spring-petclinic-angular/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Requires **/node_modules in .dockerignore, or this COPY clobbers the
# install above with a possibly stale/wrong-arch host-side node_modules.
COPY spring-petclinic-angular/ ./

# The REST_API_URL the app talks to is a compile-time constant (every
# *.service.ts does `environment.REST_API_URL + 'owners'` etc., and
# fileReplacements swaps this file in for the `production` build config).
# Overwrite the whole two-property file rather than sed'ing it, so the result
# can't depend on upstream's quoting/formatting - then assert it took effect.
RUN set -eux; \
    printf 'export const environment = {\n  production: true,\n  REST_API_URL: %s\n};\n' "'${REST_API_URL}'" \
      > src/environments/environment.prod.ts; \
    cat src/environments/environment.prod.ts; \
    grep -Fq "'${REST_API_URL}'" src/environments/environment.prod.ts

RUN npm run build -- --configuration production --base-href="${BASE_HREF}"

# Tripwires: fail the build loudly here instead of producing an image that
# looks fine but 404s on every asset or hits the wrong backend.
RUN set -eux; \
    test -f dist/browser/index.html; \
    grep -Fq "base href=\"${BASE_HREF}\"" dist/browser/index.html

FROM ${NGINX_IMAGE} AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/browser/ /usr/share/nginx/html/petclinic/
EXPOSE 8080

HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=12 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/petclinic/ || exit 1
