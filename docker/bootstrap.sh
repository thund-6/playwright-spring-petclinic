# Shared fresh-clone setup for run.sh / test.sh. Source, don't execute.

ensure_submodules() {
  if [ ! -f spring-petclinic-angular/package.json ] || [ ! -f spring-petclinic-rest/pom.xml ]; then
    echo "Submodules not initialized, running 'git submodule update --init --recursive'..." >&2
    git submodule update --init --recursive
  fi
}

ensure_env_file() {
  if [ ! -f .env ]; then
    echo "No .env found, creating one from .env.example..." >&2
    cp .env.example .env
    printf 'UID=%s\nGID=%s\n' "$(id -u)" "$(id -g)" >> .env
  fi
}
