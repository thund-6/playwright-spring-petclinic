# syntax=docker/dockerfile:1.7
#
# Playwright test runner. Only installs tests/ dependencies - it does not
# build the app images.
#
# Build context is the repository root - see docker-compose.yml.

ARG PLAYWRIGHT_IMAGE=mcr.microsoft.com/playwright:v1.61.1-noble
FROM ${PLAYWRIGHT_IMAGE}

# Must match the `user:` the compose service runs as. Creating the account
# (rather than just chown'ing at runtime) means `npm ci` below runs as this
# uid/gid, so the named node_modules volume - which Docker seeds from this
# image path, inheriting ownership - comes out already owned by the host user.
ARG UID=1000
ARG GID=1000

# The base image sets neither HOME nor USER (it runs as root by default).
# /ms-playwright is already `chmod -R 777` by the upstream build, so browsers
# are readable/executable by any uid - that part just works. HOME is the real
# trap: with no ENV HOME, Docker derives it from /etc/passwd, and an
# unmatched numeric uid resolves to "/", which is not writable, so npm and
# Chromium's crashpad/cache both fail with confusing errors.
#
# Note: on this image's noble base, `ubuntu` already owns uid 1000 and
# playwright's own `pwuser` is 1001 - so only create an account when the
# requested id is actually free, and don't assume either of those names.
RUN set -eux; \
    if ! getent group  "${GID}" >/dev/null; then groupadd -g "${GID}" tester; fi; \
    if ! getent passwd "${UID}" >/dev/null; then \
      useradd -u "${UID}" -g "${GID}" -M -d /home/tester -s /bin/bash tester; \
    fi; \
    mkdir -p /home/tester /work/tests; \
    chown -R "${UID}:${GID}" /home/tester /work

ENV HOME=/home/tester \
    NPM_CONFIG_CACHE=/tmp/.npm \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

USER ${UID}:${GID}
WORKDIR /work/tests
COPY --chown=${UID}:${GID} tests/package.json tests/package-lock.json ./
RUN --mount=type=cache,target=/tmp/.npm,uid=${UID},gid=${GID} npm ci
