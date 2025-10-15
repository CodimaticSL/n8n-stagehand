#!/bin/bash

# Script de despliegue para n8n-nodes-stagehand-browser
# Ejecuta este script para inicializar git, crear el repositorio y publicar en npm

echo "==================================="
echo "Despliegue de n8n-nodes-stagehand-browser"
echo "==================================="
echo ""

# Paso 1: Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio correcto."
    exit 1
fi

echo "✓ Directorio verificado"
echo ""

# Paso 2: Inicializar git si no existe
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio Git..."
    git init
    git branch -M main
    echo "✓ Git inicializado"
else
    echo "✓ Git ya inicializado"
fi
echo ""

# Paso 3: Agregar archivos al staging
echo "📝 Agregando archivos..."
git add .
echo "✓ Archivos agregados"
echo ""

# Paso 4: Hacer commit inicial
echo "💾 Creando commit inicial..."
git commit -m "Initial commit: n8n-nodes-stagehand-browser ready for npm"
echo "✓ Commit creado"
echo ""

# Paso 5: Agregar remote (debes tener el repositorio creado en GitHub)
echo "🔗 Configurando remote de GitHub..."
echo ""
echo "IMPORTANTE: Antes de continuar, asegúrate de:"
echo "1. Haber creado el repositorio en: https://github.com/CodimaticSL/n8n-stagehand"
echo "2. No inicializar el repositorio con README, .gitignore o LICENSE (ya los tenemos)"
echo ""
read -p "¿Has creado el repositorio en GitHub? (s/n): " confirm

if [ "$confirm" != "s" ]; then
    echo "❌ Por favor, crea primero el repositorio en GitHub y vuelve a ejecutar este script."
    exit 1
fi

# Verificar si ya existe el remote
if git remote | grep -q "origin"; then
    echo "✓ Remote origin ya existe"
    git remote set-url origin https://github.com/CodimaticSL/n8n-stagehand.git
else
    git remote add origin https://github.com/CodimaticSL/n8n-stagehand.git
fi
echo "✓ Remote configurado"
echo ""

# Paso 6: Push a GitHub
echo "⬆️  Subiendo código a GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✓ Código subido a GitHub exitosamente"
else
    echo "❌ Error al subir a GitHub. Verifica tus credenciales y permisos."
    exit 1
fi
echo ""

# Paso 7: Verificar autenticación en npm
echo "🔐 Verificando autenticación en npm..."
npm whoami > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ No estás autenticado en npm. Ejecuta: npm login"
    echo "   Luego vuelve a ejecutar este script."
    exit 1
fi

echo "✓ Autenticado en npm como: $(npm whoami)"
echo ""

# Paso 8: Verificar que el nombre del paquete esté disponible
echo "🔍 Verificando disponibilidad del nombre 'n8n-nodes-stagehand-browser'..."
npm view n8n-nodes-stagehand-browser > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "⚠️  El paquete 'n8n-nodes-stagehand-browser' ya existe en npm."
    read -p "¿Deseas continuar de todos modos? (s/n): " continue_publish
    if [ "$continue_publish" != "s" ]; then
        echo "❌ Publicación cancelada."
        exit 1
    fi
fi
echo ""

# Paso 9: Publicar en npm
echo "🚀 Publicando en npm..."
echo "   Esto ejecutará: npm run build && npm run lint && npm publish"
echo ""
read -p "¿Estás seguro de publicar? (s/n): " final_confirm

if [ "$final_confirm" != "s" ]; then
    echo "❌ Publicación cancelada."
    exit 1
fi

npm publish

if [ $? -eq 0 ]; then
    echo ""
    echo "==================================="
    echo "✅ ¡DESPLIEGUE EXITOSO!"
    echo "==================================="
    echo ""
    echo "📦 Paquete: n8n-nodes-stagehand-browser"
    echo "🔗 GitHub: https://github.com/CodimaticSL/n8n-stagehand"
    echo "📚 npm: https://www.npmjs.com/package/n8n-nodes-stagehand-browser"
    echo ""
    echo "Puedes verificar la publicación con: npm view n8n-nodes-stagehand-browser"
else
    echo ""
    echo "❌ Error durante la publicación en npm."
    echo "Revisa los errores anteriores y corrígelos antes de volver a intentar."
    exit 1
fi