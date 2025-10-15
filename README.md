# n8n-nodes-stagehand-browser

Nodo de n8n para integrar [Stagehand](https://github.com/browserbase/stagehand), una librería de automatización de navegador impulsada por IA.

## 🎉 NUEVA VERSIÓN 0.2.0 - Soporte para Browserless

**¡Ahora funciona con Alpine Linux!** Este nodo soporta dos modos de operación:

1. **Modo Local**: Ejecuta Chromium localmente (requiere Debian/Ubuntu)
2. **Modo Remoto (CDP)**: Conecta a un navegador remoto vía Browserless (**compatible con Alpine Linux**)

### ¿Qué es Browserless?

[Browserless](https://www.browserless.io/) es un servicio que proporciona navegadores remotos vía WebSocket (CDP). Permite ejecutar automatizaciones de navegador sin necesidad de instalar Chromium localmente, lo que lo hace compatible con cualquier sistema operativo, incluido Alpine Linux.

## Instalación

### Opción 1: Docker con Browserless (RECOMENDADO - Compatible con Alpine)

Esta es la opción más simple y funciona con cualquier imagen de n8n, incluida la oficial (`n8nio/n8n`).

Crea un archivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Servicio Browserless (navegador remoto)
  browserless:
    image: browserless/chrome:latest
    restart: unless-stopped
    environment:
      - CONCURRENT=2
      - TOKEN=mi-token-secreto  # Opcional: añade autenticación
      - MAX_CONCURRENT_SESSIONS=2
      - PREBOOT_CHROME=true
    ports:
      - "3000:3000"  # Solo si necesitas acceder desde fuera de Docker
    # Recursos opcionales para limitar uso
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  # Servicio n8n (puede usar la imagen oficial)
  n8n:
    image: n8nio/n8n:latest  # ¡Funciona con Alpine!
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - browserless

volumes:
  n8n_data:
```

Ejecutar:

```bash
docker-compose up -d
```

**Configuración en el nodo:**
- **Browser Mode**: Selecciona "Remote CDP (Browserless)"
- **CDP URL**: `ws://browserless:3000` (dentro de Docker) o `ws://localhost:3000` (desde tu máquina)

### Opción 2: Usar imagen custom basada en Debian (Modo Local)

Crea un `Dockerfile`:

```dockerfile
# Usar la imagen oficial de Playwright como base (ya tiene todas las dependencias)
FROM mcr.microsoft.com/playwright:v1.56.0-jammy

# Instalar n8n globalmente
RUN npm install -g n8n

# Crear directorio para n8n
RUN mkdir -p /home/node/.n8n

# Instalar el nodo Stagehand
RUN npm install -g n8n-nodes-stagehand-browser

# Establecer el usuario correcto
USER node

# Directorio de trabajo
WORKDIR /home/node

EXPOSE 5678

# Variables de entorno opcionales
ENV N8N_PORT=5678

CMD ["npx", "n8n"]
```

Construir y ejecutar:
```bash
docker build -t n8n-with-stagehand .
docker run -it --rm -p 5678:5678 n8n-with-stagehand
```

**Opción 2: Dockerfile desde cero con Debian** (Alternativa)

```dockerfile
FROM node:18-bullseye-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Instalar n8n y el nodo
RUN npm install -g n8n n8n-nodes-stagehand-browser

# Instalar Chromium con Playwright
RUN npx playwright install chromium --with-deps

# Usuario y directorio
USER node
WORKDIR /home/node

EXPOSE 5678

CMD ["npx", "n8n"]
```

## 🔄 Migración desde la imagen oficial de n8n

Si ya tienes n8n corriendo con la imagen oficial (`n8nio/n8n`), tienes estas opciones:

### Opción 1: Migrar a una imagen compatible (Recomendado)

**Paso 1: Crear Dockerfile**

Crea un archivo `Dockerfile` en tu directorio de n8n:

```dockerfile
# Usar imagen de Playwright (recomendado - más simple)
FROM mcr.microsoft.com/playwright:v1.56.0-jammy

# Variables de entorno (ajusta según tu configuración)
ENV N8N_BASIC_AUTH_ACTIVE=true \
    N8N_BASIC_AUTH_USER=admin \
    N8N_BASIC_AUTH_PASSWORD=yourpassword \
    N8N_PORT=5678

# Instalar n8n globalmente
RUN npm install -g n8n

# Crear directorio para n8n
RUN mkdir -p /home/node/.n8n

# Instalar el nodo Stagehand
RUN npm install -g n8n-nodes-stagehand-browser

# Establecer el usuario correcto
USER node

# Directorio de trabajo
WORKDIR /home/node

EXPOSE 5678

CMD ["npx", "n8n"]
```

**Paso 2: Backup de tus datos**

Antes de migrar, haz backup de tus workflows y credenciales:

```bash
# Si usas docker-compose, detén el contenedor
docker-compose down

# O si usas docker run
docker stop tu-contenedor-n8n
```

**Paso 3: Actualizar docker-compose.yml**

Si usas `docker-compose.yml`, actualízalo así:

```yaml
version: '3.8'

services:
  n8n:
    build: .  # Construir desde el Dockerfile
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/root/.n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=yourpassword
      # ... otras variables de entorno

volumes:
  n8n_data:
```

**Paso 4: Reconstruir y ejecutar**

```bash
docker-compose up -d --build
```

**Importante**: Tus datos (workflows, credenciales) se mantendrán en el volumen `n8n_data`.

### Opción 3: Browserless Cloud (Servicio Externo)

Si no quieres gestionar tu propio servicio Browserless, puedes usar [Browserless.io](https://www.browserless.io/) (servicio de pago):

1. Regístrate en https://www.browserless.io/
2. Obtén tu API key y URL de conexión
3. Configura el nodo:
   - **Browser Mode**: "Remote CDP (Browserless)"
   - **CDP URL**: `wss://chrome.browserless.io?token=TU_API_KEY`

### Opción 4: Desplegar n8n en otra infraestructura

Si no puedes cambiar la imagen de Docker, considera:

1. **n8n Cloud**: Usar el servicio oficial de n8n (https://n8n.io/cloud)
2. **VPS con instalación nativa**: Instalar n8n directamente en un servidor Ubuntu/Debian
3. **Otro servicio de hosting**: Railway, Render, etc. con soporte para Debian

### Opción 5: No usar este nodo (Ya no necesario con v0.2.0)

**NOTA**: Con la versión 0.2.0 y el soporte para Browserless, ya no necesitas renunciar a usar este nodo. Simplemente usa la Opción 1 (Docker con Browserless) que funciona en Alpine.

### Para n8n instalado localmente (npm)

Para instalar este nodo en tu instancia de n8n:

```bash
npm install n8n-nodes-stagehand-browser
```

El navegador Chromium se instalará automáticamente durante la instalación del paquete.

## Configuración del Nodo

### Modos de Navegador

El nodo ofrece dos modos de operación que puedes seleccionar en el campo **Browser Mode**:

#### 1. Modo Local (`Local Browser`)
- **Cuándo usar**: Desarrollo local, máquinas con Debian/Ubuntu
- **Requisitos**: Sistema operativo con glibc (NO Alpine)
- **Ventajas**: No requiere servicios adicionales, respuesta más rápida
- **Desventajas**: No compatible con Alpine Linux

**Configuración necesaria:**
- Browser Mode: Selecciona `Local Browser`
- No requiere CDP URL

#### 2. Modo Remoto (`Remote CDP (Browserless)`)
- **Cuándo usar**: Producción con Alpine, Docker, n8n Cloud
- **Requisitos**: Servicio Browserless en ejecución
- **Ventajas**: Compatible con cualquier sistema operativo, escalable, gestión centralizada
- **Desventajas**: Requiere configurar Browserless (pero es simple con Docker Compose)

**Configuración necesaria:**
- Browser Mode: Selecciona `Remote CDP (Browserless)`
- CDP URL: URL WebSocket del navegador remoto
  - **Docker interno**: `ws://browserless:3000`
  - **Local externo**: `ws://localhost:3000`
  - **Browserless.io**: `wss://chrome.browserless.io?token=TU_API_KEY`

### Ejemplo Completo con Docker Compose

```yaml
# docker-compose.yml - Configuración completa de producción
version: '3.8'

services:
  # Servicio Browserless
  browserless:
    image: browserless/chrome:latest
    restart: unless-stopped
    environment:
      # Configuración básica
      - CONCURRENT=2                    # Sesiones simultáneas
      - MAX_CONCURRENT_SESSIONS=2
      - PREBOOT_CHROME=true            # Iniciar Chrome anticipadamente
      
      # Seguridad (opcional pero recomendado)
      - TOKEN=mi-token-secreto-123     # Reemplaza con un token fuerte
      
      # Timeouts
      - CONNECTION_TIMEOUT=60000        # 60 segundos
      - MAX_QUEUE_LENGTH=10
      
      # Limpieza automática
      - WORKSPACE_DELETE_EXPIRED=true
      - WORKSPACE_EXPIRE_DAYS=1
    volumes:
      - browserless_data:/workspace     # Persistir workspace
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  # Servicio n8n
  n8n:
    image: n8nio/n8n:latest             # ¡Funciona con Alpine!
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      # Configuración básica de n8n
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - N8N_HOST=localhost
      
      # Autenticación básica
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme
      
      # Zona horaria
      - GENERIC_TIMEZONE=Europe/Madrid
      - TZ=Europe/Madrid
      
      # Base de datos (opcional - usar PostgreSQL)
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=n8n_password
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - browserless
      - postgres

  # Base de datos PostgreSQL (opcional pero recomendado)
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=n8n_password
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  browserless_data:
  postgres_data:
```

### Pasos de Configuración en n8n

1. **Instalar el nodo** (desde la interfaz de n8n):
   - Ve a "Settings" → "Community Nodes"
   - Instala `n8n-nodes-stagehand-browser`

2. **Configurar credenciales de IA**:
   - Ve a "Credentials" → Añadir credencial
   - Selecciona tu proveedor (OpenAI, Anthropic, o Google PaLM)
   - Ingresa tu API key

3. **Añadir el nodo a tu workflow**:
   - Busca "Stagehand" en la lista de nodos
   - Arrastra al canvas

4. **Configurar el nodo**:
   - **Browser Mode**: `Remote CDP (Browserless)`
   - **CDP URL**: `ws://browserless:3000`
   - **AI Provider**: Selecciona tu proveedor configurado
   - **Operation**: Elige la operación (Navigate, Act, Extract, etc.)

## Prerrequisitos

### Para Modo Local:
- n8n versión 1.0.0 o superior
- Node.js versión 18 o superior
- **Sistema operativo con glibc** (Debian, Ubuntu, RHEL, etc.) - NO Alpine Linux
- Playwright Chromium browser (se instala automáticamente)

### Para Modo Remoto (Browserless):
- n8n versión 1.0.0 o superior
- Servicio Browserless ejecutándose
- **Compatible con cualquier sistema operativo**, incluido Alpine Linux

### Instalación Manual de Playwright (si es necesario)

Si el script `postinstall` no se ejecuta automáticamente o tienes problemas con el navegador, ejecuta manualmente:

```bash
npx playwright install chromium
```

## Solución de Problemas

### Error: "Executable doesn't exist at /path/to/chrome"

Este error indica que los navegadores de Playwright no están instalados. Soluciones:

1. **Instalación automática**: El paquete debería instalar Chromium automáticamente. Si no lo hace, ejecuta:
   ```bash
   npx playwright install chromium
   ```

2. **Permisos**: Asegúrate de que el usuario que ejecuta n8n tenga permisos para instalar y ejecutar navegadores.

3. **Docker/Contenedores**: Si usas Docker, sigue las instrucciones de la sección "Para n8n en Docker" arriba.

4. **Reinstalar el paquete**:
   ```bash
   npm uninstall n8n-nodes-stagehand-browser
   npm install n8n-nodes-stagehand-browser
   ```

### Error: "The browser context is undefined" o símbolos no encontrados (Modo Local)

Este error ocurre cuando intentas usar **Modo Local** en Alpine Linux o distribución incompatible.

**Síntomas típicos:**
- Errores sobre símbolos no encontrados (libglib-2.0.so.0, libnss3.so, etc.)
- El navegador no se inicia
- Error "Error loading shared library"

**Solución SIMPLE (Recomendada):**
Cambia a **Modo Remoto (CDP)** con Browserless. Sigue las instrucciones de la sección "Docker con Browserless" arriba.

**Solución Alternativa:**
Si prefieres usar Modo Local, debes migrar a una imagen Docker basada en Debian/Ubuntu con glibc.

### Error de conexión a Browserless

Si el nodo no puede conectarse a Browserless:

**Síntomas:**
- Error "Unable to connect to browser"
- "WebSocket connection failed"
- Timeout al intentar inicializar

**Soluciones:**

1. **Verifica que Browserless esté ejecutándose**:
   ```bash
   docker ps | grep browserless
   ```

2. **Verifica la URL de CDP**:
   - Si n8n y Browserless están en el mismo docker-compose: `ws://browserless:3000`
   - Si están en la misma máquina pero contenedores separados: `ws://localhost:3000`
   - Si Browserless está en otra máquina: `ws://IP_MAQUINA:3000`

3. **Verifica logs de Browserless**:
   ```bash
   docker logs tu-contenedor-browserless
   ```

4. **Prueba la conexión desde tu navegador**:
   - Abre `http://localhost:3000` (debe mostrar la interfaz de Browserless)

### Verificar compatibilidad del sistema

Para verificar si tu sistema es compatible, ejecuta:

```bash
# Verificar si tienes glibc (debe mostrar la versión)
ldd --version

# Si muestra "musl" en lugar de "glibc", NO es compatible
```

## Características

Este nodo permite automatizar interacciones con navegadores web utilizando las capacidades de IA de Stagehand, incluyendo:

- Navegación web automatizada
- Extracción de datos inteligente
- Interacciones con elementos de página
- Ejecución de scripts personalizados
- Captura de screenshots

## Configuración

1. Instala el paquete en tu instancia de n8n (siguiendo las instrucciones de Docker si corresponde)
2. Reinicia n8n
3. El nodo "Stagehand" aparecerá disponible en la lista de nodos

## Credenciales

Este nodo requiere credenciales de API de un proveedor de IA. Soporta:

- **OpenAI** (GPT-4, GPT-4o)
- **Anthropic** (Claude 3.5/3.7 Sonnet)
- **Google** (Gemini 2.5)

Para configurarlas:

1. Ve a "Credentials" en n8n
2. Crea nuevas credenciales del tipo de proveedor que uses (OpenAI API, Anthropic API, o Google PaLM API)
3. Ingresa tu API key del proveedor elegido

## Uso

El nodo Stagehand puede utilizarse para:

- Automatizar flujos de trabajo de web scraping
- Realizar pruebas automatizadas de interfaces web
- Integrar datos de sitios web en tus workflows
- Automatizar tareas repetitivas en navegadores

## Desarrollo

### Clonar el repositorio

```bash
git clone https://github.com/CodimaticSL/n8n-stagehand.git
cd n8n-nodes-stagehand-browser
```

### Instalar dependencias

```bash
npm install
```

### Compilar el proyecto

```bash
npm run build
```

### Desarrollo con auto-recarga

```bash
npm run dev
```

### Linting

```bash
npm run lint
npm run lintfix
```

## Licencia

MIT

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request en el repositorio.

## Soporte

Para reportar bugs o solicitar nuevas características, por favor abre un issue en:
https://github.com/CodimaticSL/n8n-stagehand/issues

## Autor

**Codimatic**
- Email: info@codimatic.com
- GitHub: [@CodimaticSL](https://github.com/CodimaticSL)

## Enlaces

- [Documentación de n8n](https://docs.n8n.io/)
- [Stagehand GitHub](https://github.com/browserbase/stagehand)
- [Guía de creación de nodos personalizados](https://docs.n8n.io/integrations/creating-nodes/)
- [Playwright en Docker](https://playwright.dev/docs/docker)