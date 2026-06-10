#!/bin/sh
set -e

VERSION=$1
BRANCH=$2

echo "deploy: $BRANCH @ $VERSION"

# TODO(deploy-activate): Cuando tengas ArgoCD/K3s listos:
#   1. Comenta o elimina el bloque "SIMULACIÓN" de abajo
#   2. Descomenta UNO de los bloques (Opción A o Opción B)
#   3. Los secrets ya están declarados como env en el step del pipeline

# ── SIMULACIÓN (activo hasta configurar ArgoCD/K3s) ──────────────────
echo "⏳ Deploy real pendiente — ver TODO(deploy-activate) en este archivo."
exit 0
# ─────────────────────────────────────────────────────────────────────

# TODO(deploy-activate): Opción A — ArgoCD CLI
# Descomentar este bloque y comentar el bloque SIMULACIÓN de arriba
# argocd login "$ARGOCD_SERVER" \
#   --username "$ARGOCD_USER" \
#   --password "$ARGOCD_PASSWORD" \
#   --insecure
# argocd app sync "tekoapp-backend-${BRANCH}" --force
# argocd app wait "tekoapp-backend-${BRANCH}" --health
# echo "✅ ArgoCD sync completado para $BRANCH @ $VERSION"

# TODO(deploy-activate): Opción B — kubectl directo (sin ArgoCD)
# Descomentar este bloque y comentar el bloque SIMULACIÓN de arriba
# echo "$KUBECONFIG_B64" | base64 -d > /tmp/kubeconfig
# export KUBECONFIG=/tmp/kubeconfig
# kubectl apply -f "ci/${BRANCH}/" --namespace default
# kubectl rollout status deployment/deploy-tekoapp-backend --namespace default
# echo "✅ kubectl apply completado para $BRANCH @ $VERSION"
