# n8n-stagehand

Nodo de n8n para integrar [Stagehand](https://github.com/browserbase/stagehand), una librería de automatización de navegador impulsada por IA.

## Instalación

Para instalar este nodo en tu instancia de n8n:

```bash
npm install n8n-stagehand
```

## Prerrequisitos

- n8n versión 1.0.0 o superior
- Node.js versión 18 o superior

## Características

Este nodo permite automatizar interacciones con navegadores web utilizando las capacidades de IA de Stagehand, incluyendo:

- Navegación web automatizada
- Extracción de datos inteligente
- Interacciones con elementos de página
- Ejecución de scripts personalizados
- Captura de screenshots

## Configuración

1. Instala el paquete en tu instancia de n8n
2. Reinicia n8n
3. El nodo "Stagehand" aparecerá disponible en la lista de nodos

## Credenciales

Este nodo requiere credenciales de API de Stagehand. Para configurarlas:

1. Ve a "Credentials" en n8n
2. Crea nuevas credenciales de tipo "Stagehand API"
3. Ingresa tu API key de Stagehand

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
cd n8n-nodes-stagehand
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