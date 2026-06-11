#!/bin/sh
set -e

echo "prepare: actualizando imagen en deployment.yml"

VERSION=$1
BRANCH=$2
FILE=$3

SCRIPT_DIR=$(dirname "$0")
FILE_PATH=$(realpath "$SCRIPT_DIR/../ci/$BRANCH/$FILE")

echo "  branch : $BRANCH"
echo "  version: $VERSION"
echo "  file   : $FILE_PATH"

# Reemplaza la etiqueta de versión en cualquier imagen que contenga 'tekoapp-backend:X.Y.Z'
# Funciona independientemente del dominio del registry configurado.
# GNU sed (Linux/GitHub Actions): -i sin extension no crea archivos .bak
sed -i -E "s|(image:.*tekoapp-backend):([0-9a-zA-Z._-]+)|\1:${VERSION}|" "$FILE_PATH"

echo "  imagen tekoapp-backend actualizada a :${VERSION} en $BRANCH"
