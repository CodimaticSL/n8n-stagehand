# Changelog

## [0.2.28] - 2025-10-22

### 🚀 NUEVA INTEGRACIÓN: OPENROUTER COMO AGREGADOR

**NUEVO PROVEEDOR AI**: OpenRouter agregado como alternativa para acceder a modelos Cerebras y otros proveedores.

#### ✅ Características Implementadas

1. **Proveedor OpenRouter** - Nuevo AI provider con soporte completo:
   - **Credenciales dedicadas**: `openRouterApi` para configuración de API key
   - **Archivo de credenciales**: `src/credentials/OpenRouterApi.credentials.ts` creado y exportado
   - **Modelos disponibles**: 4 modelos principales incluyendo acceso a Cerebras GPT-OSS-120B
   - **Integración AI SDK**: Usa `@openrouter/ai-sdk-provider` para máxima compatibilidad

2. **Modelos OpenRouter Disponibles**:
   - `openrouter/openai/gpt-oss-120b` - **Acceso a Cerebras GPT-OSS-120B vía OpenRouter**
   - `openrouter/deepseek/deepseek-chat` - Modelo DeepSeek V3
   - `openrouter/anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet
   - `openrouter/openai/gpt-4o` - GPT-4o de OpenAI

3. **Configuración Automática**:
   - **Detección automática**: Extrae nombre del modelo sin prefijo 'openrouter/'
   - **Headers personalizados**: Configuración optimizada para OpenRouter API
   - **Logging mejorado**: Traza completa para diagnóstico con OpenRouter

4. **Solución a Problemas Cerebras**:
   - **Alternativa funcional**: OpenRouter como solución cuando Cerebras API directa falla
   - **Misma experiencia**: UX idéntica a otros providers
   - **Acceso confiable**: Mayor estabilidad para acceder a modelos Cerebras

#### 📋 Cómo Usar OpenRouter

**CONFIGURACIÓN**:
1. **AI Provider**: Seleccionar "OpenRouter"
2. **Credenciales**: Configurar API key de OpenRouter (https://openrouter.ai/keys)
3. **Modelo**: Elegir entre los 4 modelos disponibles
4. **Operaciones**: Usar normalmente como cualquier otro provider

**EJEMPLO CON CEREBRAS GPT-OSS-120B**:
```
AI Provider: OpenRouter
Model Name: OpenRouter: Cerebras GPT-OSS-120B
Operation: Agent Execute
Instruction: "Navega por la web y extrae información"
```

#### 🔧 Detalles Técnicos

- **Dependencia**: `@openrouter/ai-sdk-provider` añadida al proyecto
- **Integración**: `createOpenRouter()` con configuración personalizada
- **Modelo por defecto**: `openrouter/openai/gpt-oss-120b` si no se especifica
- **API Key**: Requerida desde OpenRouter (https://openrouter.ai/keys)

#### 🎯 Beneficios

- ✅ **Acceso Cerebras**: Solución alternativa para modelos Cerebras
- ✅ **Mayor estabilidad**: OpenRouter como agregador confiable
- ✅ **Múltiples proveedores**: Acceso a OpenAI, Anthropic, DeepSeek, etc.
- ✅ **Configuración simple**: Same UX que otros providers
- ✅ **Fully compatible**: Todas las características existentes funcionan

---

## [0.2.27] - 2025-10-21

### 🚀 NUEVA INTEGRACIÓN: CEREBRAS Y GPT-OSS-120B

**NUEVO PROVEEDOR AI**: Integración completa con Cerebras AI y su modelo GPT-OSS-120B de alto rendimiento.

#### ✅ Características Implementadas

1. **Proveedor Cerebras** - Nuevo AI provider con soporte completo:
   - **Credenciales dedicadas**: `cerebrasApi` para configuración de API key
   - **Archivo de credenciales**: `src/credentials/CerebrasApi.credentials.ts` creado y exportado
   - **Modelos disponibles**: 7 modelos Cerebras incluyendo GPT-OSS-120B
   - **Integración AI SDK**: Usa `@ai-sdk/cerebras` para máxima compatibilidad

2. **Modelos Cerebras Disponibles**:
   - `cerebras/llama3.1-8b` - Modelo ligero y rápido
   - `cerebras/llama-3.3-70b` - Modelo balanceado
   - `cerebras/gpt-oss-120b` - **Modelo optimizado para Agent Execute**
   - `cerebras/qwen-3-235b-a22b-instruct-2507` - Modelo de alta capacidad
   - `cerebras/qwen-3-32b` - Modelo mediano
   - `cerebras/qwen-3-coder-480b` - Especializado en código

3. **Configuración Automática**:
   - **Detección automática**: Extrae nombre del modelo sin prefijo 'cerebras/'
   - **Headers personalizados**: Incluye referencias de n8n para identificación
   - **Logging mejorado**: Traza completa para diagnóstico con Cerebras

4. **Compatibilidad Total**:
   - **Todas las operaciones**: Navigate, Extract, Act, Observe, Agent Execute, Evaluate
   - **Heartbeat recursivo**: Funciona perfectamente con sesiones Cerebras
   - **Browserless compatible**: Sin conflictos con conexiones remotas

#### 📋 Cómo Usar Cerebras

**CONFIGURACIÓN**:
1. **AI Provider**: Seleccionar "Cerebras"
2. **Credenciales**: Configurar API key de Cerebras Platform (ahora visible en n8n)
3. **Modelo**: Elegir entre los 7 modelos disponibles
4. **Operaciones**: Usar normalmente como cualquier otro provider

**SOLUCIÓN DE PROBLEMAS**:
- ✅ **Credenciales visibles**: Las credenciales de Cerebras ahora aparecen en el dropdown de n8n
- ✅ **Archivo creado**: `src/credentials/CerebrasApi.credentials.ts` con estructura correcta
- ✅ **Exportación**: Credenciales exportadas en `src/index.ts` para reconocimiento de n8n

**EJEMPLO CON GPT-OSS-120B**:
```
AI Provider: Cerebras
Model Name: Cerebras: GPT-OSS-120B (Agent)
Operation: Agent Execute
Instruction: "Navega por la web y extrae información"
```

#### 🔧 Detalles Técnicos

- **Dependencia**: `@ai-sdk/cerebras` añadida al proyecto
- **Integración**: `createCerebras()` con configuración personalizada
- **Modelo por defecto**: `cerebras/llama3.1-8b` si no se especifica
- **API Key**: Requerida desde Cerebras Platform (https://cloud.cerebras.ai)

#### 🎯 Beneficios

- ✅ **Alto rendimiento**: Modelos Cerebras con Wafer-Scale Engines
- ✅ **GPT-OSS-120B**: Acceso al modelo de 120B parámetros
- ✅ **Optimizado para agentes**: Modelos especializados en automation
- ✅ **Configuración simple**: Same UX que otros providers
- ✅ **Fully compatible**: Todas las características existentes funcionan

#### 🐛 Problemas Resueltos en v0.2.27

1. **Error "Forbidden" (403)**:
   - **Problema**: Error de autenticación "Forbidden - perhaps check your credentials?"
   - **Causa**: Faltaba propiedad `authenticate` en el archivo de credenciales
   - **Solución**: Agregada propiedad `authenticate` con configuración Bearer token

2. **Error "body: Input should be a valid dictionary"**:
   - **Problema**: Error en operación Extract con Cerebras gpt-oss-120b
   - **Causa**: Conflicto de variable de entorno OPENAI_API_KEY y falta de soporte structured output
   - **Solución**: Eliminación de variable de entorno y modo manual JSON parsing

3. **Environment Variable Conflict**:
   - **Problema**: Buscando API key de OpenAI cuando se usaba Cerebras
   - **Causa**: AISdkClient esperaba variable de entorno incorrecta
   - **Solución**: Establecer `process.env.CEREBRAS_API_KEY` para AISdkClient

4. **AISdkClient Configuration**:
   - **Problema**: Uso incorrecto de configuración estándar vs AISdkClient
   - **Causa**: Stagehand no tiene soporte nativo para Cerebras en configuración estándar
   - **Solución**: Usar AISdkClient con provider `@ai-sdk/cerebras` y variable de entorno correcta

5. **Final Solution - OpenAI-Compatible Provider (Tipo Chutes)**:
   - **Problema**: Error persistente "body: Input should be a valid dictionary or object to extract fields from"
   - **Causa**: Incompatibilidad directa entre AISdkClient y structured output de Cerebras
   - **Solución**: Usar Cerebras como provider OpenAI-compatible con baseURL personalizado (igual que Chutes)
   - **Implementación**:
     - Usar `createOpenAI` con `baseURL: 'https://api.cerebras.ai/v1'`
     - Mantener structured output nativo de OpenAI que Cerebras soporta
     - Eliminar dependencia de `@ai-sdk/cerebras` y `zodToJsonSchema`
     - Configurar headers personalizados para identificación
     - Usar modelo directo sin prefijo 'cerebras/'

---

## [0.2.26] - 2025-10-21

### 🛠️ HEARTBEAT RECURSIVO SEGURO - SOLUCIÓN DEFINITIVA

**PROBLEMA CRÍTICO RESUELTO**: Error "Target page, context or browser has been closed" causado por Browserless v2.xx cerrando conexiones inactivas entre nodos n8n.

#### ✅ Cambios Implementados

1. **Heartbeat Recursivo Seguro** - Nueva implementación que mantiene conexiones Browserless activas:
   - **Reemplazado `setInterval` por `setTimeout` recursivo**: Elimina riesgo de acumulación de callbacks
   - **Control de estado con `isHeartbeatActive`**: Previene ejecuciones no deseadas
   - **Limpieza automática de recursos**: Garantiza que no queden timers activos
   - **Manejo robusto de errores**: Detiene heartbeat automáticamente en fallos

2. **Mecanismo de Keep-Alive Inteligente**:
   - **Operación segura**: Usa `page.title()` para mantener conexión activa sin riesgos de seguridad
   - **Frecuencia optimizada**: Heartbeat cada 20 segundos (mitad del timeout típico de Browserless)
   - **Logging detallado**: Información completa para diagnóstico con verbose level 2
   - **Compatible con TIMEOUT=1800000**: Soporta timeouts extendidos de 30 minutos

3. **Arquitectura Mejorada - Sesiones Persistentes**:
   - ✅ **MANTENIDO**: Mapa global de sesiones con heartbeat
   - ✅ **MEJORADO**: Reconexión automática entre nodos
   - ✅ **OPTIMIZADO**: Detección temprana de conexiones caídas
   - ✅ **SEGURO**: Sin acumulación de callbacks ni memory leaks

#### 🔴 Raíz del Problema (Identificada)

Browserless v2.xx **NO soporta `keepAlive`** - Las conexiones inactivas se cierran automáticamente después del timeout configurado.
**Solución**: Heartbeat recursivo que mantiene la conexión activa de forma segura.

#### 📋 Cómo Usar v0.2.26

**CONFIGURACIÓN RECOMENDADA**:
- `Browserless Timeout`: 1800000ms (30 minutos)
- `Verbose Level`: 2 (All Logs) para ver heartbeat
- Workflow: Navigate → Extract → Act (sesión persistente)

**FUNCIONAMIENTO**:
- Nodo Navigate → crea sesión A + inicia heartbeat ✅
- Nodo Extract → reutiliza sesión A (heartbeat mantiene conexión) ✅
- Nodo Act → reutiliza sesión A (heartbeat sigue activo) ✅

#### 🚀 Beneficios
- ✅ **Fiable**: Cero errores de "browser context is undefined"
- ✅ **Seguro**: Sin riesgos de seguridad o acumulación de callbacks
- ✅ **Flexible**: Funciona con cualquier timeout de Browserless
- ✅ **Diagnóstico**: Logs detallados para monitoreo y troubleshooting
- ✅ **Compatible**: Todas las operaciones existentes funcionan sin cambios

## [0.2.25] - 2025-10-21

### Fixed
- **Critical**: Fixed "Target page, context or browser has been closed" error when using Extract, Evaluate, or other non-Navigate operations after Navigate
- Implemented robust CDP context validation before reusing sessions to detect closed connections early
- Enhanced heartbeat mechanism to keep CDP connections alive between operations (every 20 seconds instead of 30)
- Added keep-alive evaluation to prevent Browserless from closing idle connections
- Improved error handling in `reconnectIfNeeded()` to validate browser context accessibility
- Fixed issue where CDP context could be closed while session appeared valid

### Changed
- Heartbeat now performs dual validation: checks page state AND actively keeps connection alive with window variable updates
- Context validation in session reuse now checks both `page.isClosed()` and browser accessibility
- Increased heartbeat frequency from 30 seconds to 20 seconds for more responsive connection monitoring

### Technical Details
- Added `__heartbeatInterval` and `__lastHeartbeatTime` tracking on Stagehand instances for remote CDP connections
- Enhanced validation in `reconnectIfNeeded()` with context browser accessibility checks
- Improved logging for CDP connection diagnostics

## [0.2.24] - 2025-10-21
### Fixed
- **Session Reuse Bug**: Fixed critical issue where Extract, Evaluate, and Act operations were not reusing browser sessions from Navigate operations
  - Operations other than 'navigate' now correctly inherit browserMode, cdpUrl, and browserlessTimeout from existing sessions
  - Prevents creation of unnecessary new browser instances with default 'local' mode
  - Sessions now properly maintain context across multiple sequential operations (Navigate → Extract → Evaluate)
- **URL Persistence**: Added logging to track URL preservation across sequential operations
  - Ensures `lastNavigatedUrl` is properly saved in session after navigate operation
  - Enables automatic navigation recovery for subsequent operations

### Changed
- Session reuse logic now checks for existing sessions for all non-navigate operations (not just when `!needsNewInstance`)
- Enhanced debugging logs for session management and URL tracking


## [0.2.23] - 2025-10-21

### Fix: Browserless 408 Request Timeout Error (Critical Bug Fix)

- **Problem:** WebSocket error `408 Request Timeout` when connecting to Browserless CDP endpoint
  ```
  WebSocket error: wss://integraciones-browserless.fuqvaq.easypanel.host/ 408 Request Timeout
  StagehandInitError: The browser context is undefined. This means the CDP connection to the browser failed
  ```

- **Root Cause:** The `timeout` parameter in the CDP URL was causing conflicts with Browserless's WebSocket handshake, interrupting the connection before the browser context could be created

- **Solution:** Removed the conflicting `timeout` parameter from the CDP URL
  - ❌ BEFORE: `cdpUrl = "...?timeout=300&blockAds=true&stealth=true"`
  - ✅ AFTER: `cdpUrl = "...?blockAds=true&stealth=true"`
  - Playwright handles the client-side timeout automatically

- **Impact:**
  - ✅ Browserless connections now succeed immediately (<1s handshake)
  - ✅ Browser context created correctly
  - ✅ No more `408 Request Timeout` errors
  - ✅ Remote CDP connections are stable and monitored with heartbeat

- **Testing:** Verified in n8n with successful connection logs:
  ```
  [Stagehand DEBUG] Stagehand.init() completado exitosamente
  [Stagehand DEBUG] newStagehand.context existe: true
  [Stagehand DEBUG] newStagehand.page existe: true
  [Stagehand DEBUG] Browser accesible: true
  ```

## [0.2.21] - 2025-10-21

### Fix: Proper OpenAI-Compatible API Support Using AISdkClient

- **Fixed:** Now correctly uses `AISdkClient` with Vercel AI SDK provider for OpenAI-compatible APIs
- **Implementation:** When baseURL is configured in OpenAI credentials:
  ```typescript
  const customProvider = createOpenAI({
    baseURL: baseURL,  // e.g., https://llm.chutes.ai/v1
    apiKey: apiKey,
  });
  stagehandConfig.llmClient = new AISdkClient({
    model: customProvider('gpt-oss-120b'),
  });
  ```
- **Documentation**: Based on official Stagehand docs for custom model configuration
- **Support:** Works with Chutes, LocalAI, LM Studio, or any OpenAI-compatible API
- **Debug:** Added console logs to track custom client creation

## [0.2.20] - 2025-10-21

### Fix: Proper OpenAI-Compatible API Support Using Vercel AI SDK

- **Fixed:** Now correctly uses Vercel AI SDK (`createOpenAI`) to create custom provider with baseURL
- **Change:** Uses `llmProvider` instead of `llmClient` for custom OpenAI-compatible endpoints
- **Implementation:** When baseURL is configured in OpenAI credentials, creates custom provider:
  ```typescript
  const customProvider = createOpenAI({
    baseURL: baseURL,  // e.g., https://llm.chutes.ai/v1
    apiKey: apiKey,
  });
  stagehandConfig.llmProvider = customProvider;
  ```
- **Support:** Works with Chutes, LocalAI, LM Studio, or any OpenAI-compatible API
- **Debug:** Added console logs to track custom provider creation

## [0.2.19] - 2025-10-21

### Fix: Add GPT-OSS-120B Model to Model List

- **Added:** `openai/gpt-oss-120b` to the available models list
- **Note:** Requires Base URL configured in OpenAI credentials (`https://llm.chutes.ai/v1`)
- Works with the simplified OpenAI-compatible API approach introduced in v0.2.18

## [0.2.18] - 2025-10-21

### Improvement: Simplified OpenAI-Compatible API Support

- **Change:** Removed separate "Chutes" AI provider option
- **New Approach:** Use OpenAI credentials with custom Base URL for any OpenAI-compatible API
  - Configure Base URL in OpenAI credentials (e.g., `https://llm.chutes.ai/v1`)
  - Specify custom model name in Advanced Options (e.g., `openai/gpt-oss-120b`)
  - Works with Chutes, LocalAI, LM Studio, or any OpenAI-compatible endpoint

- **Benefits:**
  - Cleaner UI - no separate provider option
  - More flexible - works with any OpenAI-compatible API
  - Less confusion - reuses existing OpenAI credential type
  - No duplicate credential management

## [0.2.17] - 2025-10-20

### Fix: Include Missing Stagehand PeerDependencies

- **Problem:** Stagehand v2.5.2 has peerDependencies that weren't included: dotenv@^16.4.5 and deepmerge@^4.3.1
- **Solution:** Added missing peerDependencies as regular dependencies
  - Added: dotenv@^16.4.5 (required by Stagehand)
  - Added: deepmerge@^4.3.1 (required by Stagehand)

- **Final Dependency Set:**
  - @browserbasehq/stagehand@2.5.2
  - ai@^4.3.19
  - @ai-sdk/openai@^1.3.24
  - zod@3.25.67 (exact version to avoid conflicts)
  - playwright@1.56.0
  - dotenv@^16.4.5
  - deepmerge@^4.3.1
  - json-schema-to-zod@2.6.1
  - json-to-zod@1.1.2

- **Verified:** 
  - ✓ Local test with n8n succeeds
  - ✓ All dependencies load correctly
  - ✓ Stagehand node instantiates without errors
  - ✓ Module resolution hierarchy is clean

## [0.2.16] - 2025-10-20

### MAJOR FIX: Resolve Nested Module Resolution Issue

- **Problem:** n8n error: Cannot find module '/home/node/.n8n/nodes/node_modules/n8n-nodes-stagehand-browser/node_modules/@browserbasehq/stagehand/node_modules/ai/dist/index.js'
- **Root Cause:** Packaging all dependencies caused npm to create deeply nested node_modules structures when installed via n8n

- **Solution:** Attempted to move large dependencies to peerDependencies (later reversed in v0.2.17)
- **Result:** Led to discovery that Stagehand's peerDependencies needed to be included

## [0.2.15] - 2025-10-20

### Fix: Resolve Zod Version Conflict

- **Problem in n8n:** Cannot find module '@browserbasehq/stagehand/node_modules/ai/dist/index.js' - caused by module duplication
- **Root Cause Analysis:**
  - Stagehand v2.5.2 requires: zod@>=3.25.0 <3.25.68 (exact constraint)
  - npm was resolving zod@^3.25.0 to zod@3.25.76 (latest patch)
  - Version 3.25.76 violates Stagehand constraint (exceeds <3.25.68 limit)
  
- **Solution:** Anchor zod to exact version 3.25.67
  - Satisfies: zod@>=3.25.0 <3.25.68 (Stagehand requirement)
  - Compatible with: ai@^4.3.19 and @ai-sdk/openai@^1.3.24
  - Eliminates version conflicts and module duplication

- **Verified Dependencies:**
  - ai@^4.3.19 (deduped correctly via Stagehand)
  - @ai-sdk/openai@^1.3.24 (deduped correctly via Stagehand)
  - zod@3.25.67 (exact, within Stagehand constraint)
  - All 1000 packages resolve without conflicts
  - Published successfully to npm

## [0.2.14] - 2025-10-20

### Technical Changes

- **Fix:** Resolved zod dependency conflict between @ai-sdk/openai and @browserbasehq/stagehand
- Reverted @ai-sdk/openai to ^1.3.24 (compatible with zod 3.25.x required by Stagehand)
- Reverted ai to ^4.3.19 (compatible with @ai-sdk/openai 1.3.24)
- Updated zod from ^3.25.76 to ^3.25.0 for compatibility
- Result: Installation without ERESOLVE errors (FIXED)

## [0.2.12] - 2025-10-20

### New Features

- **Chutes and GPT-OSS-120B Support:** Integration of Chutes as AI provider with support for GPT-OSS-120B model
- **OpenAI-Compatible API:** Chutes uses OpenAI-compatible API, allowing integration without architecture changes
- **Custom Endpoint:** Automatic support for https://llm.chutes.ai/v1 with custom baseURL

### Technical Changes

- Added dependencies: ai and @ai-sdk/openai (Vercel AI SDK)
- New provider option in selector: "Chutes (OpenAI-Compatible)"
- New model option: "Chutes: GPT-OSS-120B"
- Added aiProvider field to StagehandSession interface for session persistence
- Automatic modelClientOptions configuration with baseURL when Chutes is selected
- OpenAI credentials reused for Chutes (API-compatible)

### Documentation

- Added CHUTES_INTEGRATION.md with detailed integration information
