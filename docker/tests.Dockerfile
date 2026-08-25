# syntax=docker/dockerfile:1.7
#
# Playwright test runner - only installs playwright/ deps, doesn't build the
# app images. Build context is the repo root - see docker-compose.yml.

ARG PLAYWRIGHT_IMAGE=mcr.microsoft.com/playwright:v1.61.1-noble
FROM ${PLAYWRIGHT_IMAGE}

# Must match the compose service's `user:` - creating the account (instead of
# chown'ing at runtime) means `npm ci` runs as this uid/gid, so the named
# node_modules volume comes out already owned by the host user.
ARG UID=1000
ARG GID=1000

# No ENV HOME means Docker derives it from /etc/passwd, and an unmatched
# numeric uid resolves to "/" (not writable) - npm/Chromium then fail with
# confusing errors. Only create the account if the id is actually free (this
# noble base already has `ubuntu`=1000 and playwright's `pwuser`=1001).
RUN set -eux; \
    if ! getent group  "${GID}" >/dev/null; then groupadd -g "${GID}" tester; fi; \
    if ! getent passwd "${UID}" >/dev/null; then \
      useradd -u "${UID}" -g "${GID}" -M -d /home/tester -s /bin/bash tester; \
    fi; \
    mkdir -p /home/tester /work/playwright; \
    chown -R "${UID}:${GID}" /home/tester /work

ENV HOME=/home/tester \
    NPM_CONFIG_CACHE=/tmp/.npm \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

USER ${UID}:${GID}
WORKDIR /work/playwright
COPY --chown=${UID}:${GID} playwright/package.json playwright/package-lock.json ./
RUN --mount=type=cache,target=/tmp/.npm,uid=${UID},gid=${GID} npm ci
