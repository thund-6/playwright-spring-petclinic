# syntax=docker/dockerfile:1.7
#
# Builds spring-petclinic-rest from the local submodule checkout (not the
# published springcommunity/spring-petclinic-rest image), so Playwright tests
# run against your actual local code.
#
# Build context is the repository root - see docker-compose.yml.

ARG JDK_IMAGE=eclipse-temurin:17-jdk
ARG JRE_IMAGE=eclipse-temurin:17-jre

# spring-boot-starter-parent:4.1.0 pins java.version=17 (a floor via the
# maven-enforcer-plugin, not a ceiling) and the project pom does not override
# it - confirmed against the resolved parent pom and the CI workflows, which
# all use JDK 17 temurin too.
FROM ${JDK_IMAGE} AS build
ENV MAVEN_OPTS="-Xmx1g"
WORKDIR /workspace

# Full submodule tree: the openapi-generator-maven-plugin needs
# src/main/resources/openapi.yml at generate-sources time, and
# .mvn/wrapper/maven-wrapper.jar is committed, so mvnw never needs to reach
# out over curl/wget for itself - only Maven Central for dependencies.
COPY spring-petclinic-rest/ ./

# `package`, NOT `verify`: the jacoco-maven-plugin's `check` execution enforces
# 85% line / 66% branch coverage and is bound to the `verify` phase. With
# -DskipTests that would fail the build at 0% coverage. `package` stops one
# phase earlier and still produces the runnable jar.
# The wrapper resolves Maven 3.9.9, which maven-enforcer-plugin requires.
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -ntp package -DskipTests

# spring-boot-maven-plugin's `repackage` execution (inherited from the
# parent's pluginManagement) leaves both the fat jar and a *.jar.original in
# target/ - assert there is exactly one plain jar before copying it.
RUN set -eux; \
    jar="$(ls target/*.jar | grep -v '\.original$')"; \
    test "$(printf '%s\n' "$jar" | wc -l)" -eq 1; \
    cp "$jar" /workspace/app.jar

FROM ${JRE_IMAGE} AS runtime
WORKDIR /app
COPY --from=build /workspace/app.jar ./app.jar
EXPOSE 9966

ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"

# temurin JRE images ship bash but no curl; use bash's /dev/tcp instead of
# adding an apt layer just for a healthcheck.
HEALTHCHECK --interval=5s --timeout=3s --start-period=30s --retries=30 CMD \
  bash -c 'exec 3<>/dev/tcp/127.0.0.1/9966; printf "GET /petclinic/actuator/health HTTP/1.0\r\n\r\n" >&3; grep -q "\"status\":\"UP\"" <&3' || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
