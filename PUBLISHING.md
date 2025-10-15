# Guía de Publicación en NPM

Este documento contiene las instrucciones para publicar el paquete `n8n-nodes-stagehand-browser` en npm.

## Prerrequisitos

1. **Cuenta de npm**: Debes tener una cuenta en [npmjs.com](https://www.npmjs.com/)
2. **Autenticación**: Debes estar autenticado en npm localmente

```bash
npm login
```

3. **Repositorio GitHub**: Debes crear el repositorio en GitHub:
   - URL: https://github.com/CodimaticSL/n8n-stagehand
   - Inicializar el repositorio y hacer push del código

## Pasos para Publicar

### 1. Verificar la Configuración

Revisa que toda la información en [`package.json`](package.json:1) sea correcta:
- Nombre del paquete: `n8n-nodes-stagehand-browser`
- Versión actual: `0.1.0`
- Autor: Codimatic
- Repositorio: https://github.com/CodimaticSL/n8n-stagehand

### 2. Crear el Repositorio GitHub

```bash
# Inicializar git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit: n8n-nodes-stagehand-browser node"

# Agregar el remote
git remote add origin https://github.com/CodimaticSL/n8n-stagehand.git

# Hacer push
git branch -M main
git push -u origin main
```

### 3. Verificar el Build

El script `prepublishOnly` se ejecutará automáticamente antes de publicar, pero puedes verificarlo manualmente:

```bash
npm run prepublishOnly
```

Esto ejecutará:
- Build de TypeScript
- Copia de iconos
- Linting del código

### 4. Verificar los Archivos que se Publicarán

```bash
npm pack --dry-run
```

Este comando te mostrará qué archivos se incluirán en el paquete sin crear el archivo `.tgz`.

### 5. Publicar en npm

Para la primera publicación:

```bash
npm publish
```

Para versiones posteriores, primero actualiza la versión:

```bash
# Para actualizaciones menores (0.1.0 -> 0.1.1)
npm version patch

# Para nuevas características (0.1.0 -> 0.2.0)
npm version minor

# Para cambios importantes (0.1.0 -> 1.0.0)
npm version major

# Luego publica
npm publish
```

### 6. Verificar la Publicación

Después de publicar, verifica que el paquete esté disponible:

```bash
npm view n8n-nodes-stagehand-browser
```

O visita: https://www.npmjs.com/package/n8n-nodes-stagehand-browser

## Archivos Incluidos en la Publicación

Según la configuración en [`.npmignore`](.npmignore:1) y [`package.json`](package.json:33), se publicarán:

- **Directorio `dist/`**: Código compilado
- **README.md**: Documentación
- **LICENSE**: Licencia MIT
- **package.json**: Configuración del paquete

## Archivos Excluidos

- Código fuente TypeScript (`src/`)
- Archivos de configuración de desarrollo
- Tests
- Carpeta `downloads/`
- `node_modules/`

## Actualización de Versiones

Sigue [Semantic Versioning](https://semver.org/):

- **PATCH** (0.0.X): Corrección de bugs
- **MINOR** (0.X.0): Nuevas características compatibles
- **MAJOR** (X.0.0): Cambios que rompen compatibilidad

## Solución de Problemas

### Error: "You do not have permission to publish"

El nombre del paquete puede estar tomado. Verifica en npmjs.com o elige otro nombre.

### Error durante prepublishOnly

Revisa los errores de linting o compilación y corrígelos antes de publicar.

### El paquete no aparece en npm

Puede tardar unos minutos en aparecer en el registro. Espera y vuelve a verificar.

## Mantenimiento Post-Publicación

1. **Monitorea issues**: Revisa https://github.com/CodimaticSL/n8n-stagehand/issues
2. **Actualiza dependencias**: Mantén las dependencias actualizadas
3. **Documenta cambios**: Mantén un CHANGELOG.md con los cambios de cada versión
4. **Prueba antes de publicar**: Siempre prueba los cambios localmente antes de publicar

## Recursos Adicionales

- [Documentación de npm publish](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [Guía de n8n para crear nodos](https://docs.n8n.io/integrations/creating-nodes/)
- [Semantic Versioning](https://semver.org/)