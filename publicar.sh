#!/usr/bin/env bash
# Crea el repositorio victor-educ/apuntes-5166 en GitHub, sube el contenido y activa GitHub Pages (build por Actions).
# Requiere: gh autenticado como victor-educ (gh auth login) y git configurado.
set -euo pipefail
cd "$(dirname "$0")"
export PATH=/opt/homebrew/bin:$PATH

REPO=victor-educ/apuntes-5166
USER=$(gh api user --jq .login)
if [ "$USER" != "victor-educ" ]; then
  echo "gh está autenticado como '$USER', no como victor-educ. Ejecuta: gh auth login" >&2
  exit 1
fi

if ! gh repo view "$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --public --description "Apuntes del módulo 5166 · Despliegue de plataformas de ejecución de contenedores" \
    --homepage "https://victor-educ.github.io/apuntes-5166/" --source . --remote origin --push
else
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$REPO.git"
  git push -u origin main
fi

# Pages con build por GitHub Actions (el workflow de .github/workflows/deploy.yml publica el sitio)
if ! gh api "repos/$REPO/pages" >/dev/null 2>&1; then
  gh api -X POST "repos/$REPO/pages" -f build_type=workflow >/dev/null
else
  gh api -X PUT "repos/$REPO/pages" -f build_type=workflow >/dev/null
fi
gh repo edit "$REPO" --enable-issues --enable-wiki=false >/dev/null

echo "Repositorio: https://github.com/$REPO"
echo "Esperando al workflow de publicación..."
sleep 10
gh run watch --repo "$REPO" --exit-status $(gh run list --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId') || true
echo "Sitio: https://victor-educ.github.io/apuntes-5166/"
