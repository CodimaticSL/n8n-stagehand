# 🔧 Instrucciones para Resolver el Error de Módulo en n8n

## Error Reportado
```
Cannot find module '/home/node/.n8n/nodes/node_modules/n8n-nodes-stagehand-browser/node_modules/@browserbasehq/stagehand/node_modules/ai/dist/index.js'
```

## Causa Raíz Identificada
El error indica que n8n tiene una instalación corrupta o cacheada de una versión anterior del paquete que contenía anidamientos problemáticos de `node_modules`.

## Solución: Limpieza Completa

### Paso 1: Desinstalar el paquete actual
```bash
# En tu instancia de n8n, ejecuta:
npm uninstall n8n-nodes-stagehand-browser
```

### Paso 2: Limpiar el directorio de nodos de n8n
```bash
# Eliminar el directorio de nodos completo
rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-stagehand-browser

# O si usas Docker, dentro del contenedor:
rm -rf /home/node/.n8n/nodes/node_modules/n8n-nodes-stagehand-browser
```

### Paso 3: Limpiar cache de npm
```bash
npm cache clean --force
```

### Paso 4: Reinstalar la versión 0.2.17
```bash
npm install n8n-nodes-stagehand-browser@0.2.17
```

### Paso 5: Reiniciar n8n
```bash
# Si usas Docker:
docker restart <container-name>

# Si usas npm:
# Detener n8n (Ctrl+C) y volver a iniciar
n8n start
```

## Verificación de la Instalación Correcta

La instalación correcta debería tener esta estructura:

```
~/.n8n/nodes/node_modules/n8n-nodes-stagehand-browser/
├── dist/
├── node_modules/          ← Dependencias incluidas aquí
│   ├── @browserbasehq/
│   │   └── stagehand/     ← Sin node_modules propios
│   ├── ai/                ← Aquí en el nivel correcto
│   ├── @ai-sdk/
│   └── ... otras dependencias
├── package.json
└── README.md
```

## Estructura INCORRECTA (versiones antiguas)

```
node_modules/n8n-nodes-stagehand-browser/
└── node_modules/
    └── @browserbasehq/
        └── stagehand/
            └── node_modules/     ← ❌ NO debería existir
                └── ai/           ← ❌ Anidamiento problemático
```

## Verificar Versión Instalada

```bash
npm list n8n-nodes-stagehand-browser

# Debería mostrar:
# └── n8n-nodes-stagehand-browser@0.2.17
```

## Si el Problema Persiste

1. **Verificar permisos**: Asegúrate de tener permisos de escritura en `~/.n8n/nodes/`
2. **Verificar espacio en disco**: `df -h`
3. **Ver logs completos de npm**: `npm install n8n-nodes-stagehand-browser@0.2.17 --loglevel=verbose`
4. **Intentar con npm legacy flags**: `npm install n8n-nodes-stagehand-browser@0.2.17 --legacy-peer-deps`

## Notas Técnicas

- ✅ v0.2.17 fue probado localmente con `--install-strategy=shallow` (el método que usa n8n)
- ✅ El tarball publicado en npm NO contiene anidamientos de node_modules
- ✅ El paquete carga correctamente con todas las dependencias incluidas
- ✅ Todas las peerDependencies de Stagehand están incluidas (dotenv, deepmerge, zod)

## Contacto

Si después de seguir estos pasos el problema persiste, por favor proporciona:
1. Versión de n8n: `n8n --version`
2. Versión de Node.js: `node --version`
3. Versión de npm: `npm --version`
4. Sistema operativo
5. Output completo del comando de instalación con `--loglevel=verbose`
