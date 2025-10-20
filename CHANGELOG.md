# Changelog

## [0.2.12] - 2025-10-20

### ✨ Nuevas Características

- **Soporte para Chutes y GPT-OSS-120B**: Integración de Chutes como proveedor de IA con soporte para el modelo GPT-OSS-120B (117B parameter open-source model)
- **API Compatible OpenAI**: Chutes utiliza una API compatible con OpenAI, permitiendo integración sin cambios en la arquitectura existente
- **Endpoint Personalizado**: Soporte automático para `https://llm.chutes.ai/v1` con `baseURL` personalizado

### 🔧 Cambios Técnicos

- Añadidas dependencias: `ai@latest` y `@ai-sdk/openai@latest` (Vercel AI SDK)
- Nueva opción en el selector de proveedores: "Chutes (OpenAI-Compatible)"
- Nueva opción de modelo: "Chutes: GPT-OSS-120B" 
- Campo `aiProvider` añadido a la interfaz `StagehandSession` para persistencia de sesión
- Configuración automática de `modelClientOptions` con `baseURL` cuando se selecciona Chutes
- Credenciales reutilizadas de OpenAI para Chutes (API compatible)

### 📚 Documentación

- Nuevo archivo `CHUTES_INTEGRATION.md` con:
  - Instrucciones de configuración paso a paso
  - Ejemplos de uso
  - Casos de uso (automatización económica, razonamiento, privacidad)
  - Troubleshooting

### ✅ Validación

- ✅ TypeScript: Compilación exitosa
- ✅ ESLint: Pasado sin errores críticos
- ✅ Trivy (Seguridad): Sin vulnerabilidades nuevas introducidas
- ✅ Stagehand Official Docs: Implementación valida contra patrones documentados

### 🔐 Seguridad

- Ninguna vulnerabilidad de seguridad introducida
- Endpoint HTTPS confirmado: `https://llm.chutes.ai/v1`
- Credenciales gestionadas seguramente vía n8n

## [0.2.11] - Previous releases

Consulta el repositorio para histórico de versiones anteriores.
