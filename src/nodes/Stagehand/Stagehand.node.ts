import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { ApplicationError, NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { LogLine, Stagehand as StagehandCore } from '@browserbasehq/stagehand';
import { z } from 'zod';
import type { ZodTypeAny } from 'zod';
import jsonToZod from 'json-to-zod';
import jsonSchemaToZod from 'json-schema-to-zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createCerebras } from '@ai-sdk/cerebras';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { zodToJsonSchema } from 'zod-to-json-schema';
// @ts-ignore - AISdkClient is not yet in published types
import { AISdkClient } from '@browserbasehq/stagehand';

// Interfaz para almacenar instancia y configuración de Stagehand
interface StagehandSession {
	instance: StagehandCore;
	browserMode: string;
	cdpUrl?: string;
	browserlessTimeout?: number;
	apiKey: string;
	modelName: string;
	enableCaching: boolean;
	verbose: 0 | 1 | 2;
	domSettleTimeoutMs: number;
	waitUntil: 'load' | 'domcontentloaded' | 'networkidle';
	lastNavigatedUrl?: string; // Guardar la última URL navegada
	aiProvider: string;
	heartbeatTimeout?: NodeJS.Timeout | null; // Timeout para heartbeat recursivo
	lastHeartbeat?: number; // Timestamp del último heartbeat
	heartbeatCount?: number; // Contador de heartbeats exitosos
	isHeartbeatActive?: boolean; // Estado del heartbeat
}

// Mapa global para almacenar sesiones de Stagehand por workflow ID
const stagehandSessions = new Map<string, StagehandSession>();

type Field = {
	fieldName: string;
	fieldType: string;
	optional: boolean;
};

export class Stagehand implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Stagehand',
		name: 'stagehand',
		icon: 'file:stagehand.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Control browser using Stagehand with AI automation',
		defaults: {
			name: 'Stagehand',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'openAiApi',
				required: true,
				displayOptions: {
					show: {
						aiProvider: ['openai'],
					},
				},
			},
			{
				name: 'anthropicApi',
				required: true,
				displayOptions: {
					show: {
						aiProvider: ['anthropic'],
					},
				},
			},
			{
				name: 'googlePalmApi',
				required: true,
				displayOptions: {
					show: {
						aiProvider: ['google'],
					},
				},
			},
			{
				name: 'cerebrasApi',
				required: true,
				displayOptions: {
					show: {
						aiProvider: ['cerebras'],
					},
				},
			},
			{
				name: 'openRouterApi',
				required: true,
				displayOptions: {
					show: {
						aiProvider: ['openrouter'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'AI Provider',
				name: 'aiProvider',
				type: 'options',
				options: [
					{
						name: 'OpenAI',
						value: 'openai',
					},
					{
						name: 'Anthropic (Claude)',
						value: 'anthropic',
					},
					{
						name: 'Google (Gemini)',
						value: 'google',
					},
					{
						name: 'Cerebras',
						value: 'cerebras',
					},
					{
						name: 'OpenRouter',
						value: 'openrouter',
					},
				],
				default: 'openai',
				description: 'Select which AI provider to use for operations that require AI. For OpenAI-compatible APIs (like Chutes), select OpenAI and configure the Base URL in the credentials.',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Navigate',
						value: 'navigate',
						description: 'Navigate to a URL and initialize browser session',
						action: 'Navigate to a URL',
					},
					{
						name: 'Act',
						value: 'act',
						description: 'Execute an action on the page using natural language',
						action: 'Execute an action on the page',
					},
					{
						name: 'Extract',
						value: 'extract',
						description: 'Extract structured data from the page',
						action: 'Extract data from the page',
					},
					{
						name: 'Observe',
						value: 'observe',
						description: 'Observe the page and plan an action',
						action: 'Observe the page',
					},
					{
						name: 'Agent Execute',
						value: 'agentExecute',
						description: 'Execute complex multi-step tasks using AI agent',
						action: 'Execute multi-step tasks',
					},
					{
						name: 'Evaluate',
						value: 'evaluate',
						description: 'Execute JavaScript code in the browser context',
						action: 'Execute JavaScript code',
					},
					{
						name: 'Close Session',
						value: 'closeSession',
						description: 'Close the browser session and cleanup resources',
						action: 'Close browser session',
					},
				],
				default: 'navigate',
			},
			{
				displayName: 'Browser Mode',
				name: 'browserMode',
				type: 'options',
				options: [
					{
						name: 'Local Browser',
						value: 'local',
						description: 'Use local Chromium (requires compatible OS, not Alpine)',
					},
					{
						name: 'Remote CDP (Browserless)',
						value: 'remote',
						description: 'Connect to remote browser via CDP (compatible with Alpine)',
					},
				],
				default: 'local',
				description: 'How to connect to the browser. This setting is used for the entire workflow session.',
				displayOptions: {
					show: {
						operation: ['navigate'],
					},
				},
			},
			{
				displayName: 'CDP URL',
				name: 'cdpUrl',
				type: 'string',
				default: 'ws://browserless:3000',
				placeholder: 'ws://browserless:3000 or wss://your-domain',
				description: 'WebSocket URL of the remote browser CDP endpoint. Used only when initializing the session.',
				displayOptions: {
					show: {
						operation: ['navigate'],
						browserMode: ['remote'],
					},
				},
				required: true,
			},
			{
				displayName: 'Browserless Timeout (ms)',
				name: 'browserlessTimeout',
				type: 'number',
				default: 300000,
				placeholder: '300000',
				description: 'Timeout in milliseconds for Browserless sessions. Default is 300000ms (5 minutes). This prevents the browser from closing between operations.',
				displayOptions: {
					show: {
						operation: ['navigate'],
						browserMode: ['remote'],
					},
				},
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://example.com',
				description: 'URL to navigate to',
				displayOptions: {
					show: {
						operation: ['navigate'],
					},
				},
				required: true,
			},
			{
				displayName: 'Instruction',
				name: 'instruction',
				type: 'string',
				default: '',
				description: 'Instruction for the Stagehand to perform',
				displayOptions: {
					show: {
						operation: ['act', 'extract', 'observe', 'agentExecute'],
					},
				},
				required: true,
			},
			{
				displayName: 'JavaScript Code',
				name: 'javascriptCode',
				type: 'string',
				typeOptions: {
					rows: 10,
				},
				default: '',
				description: 'JavaScript code to execute in the browser context',
				displayOptions: {
					show: {
						operation: ['evaluate'],
					},
				},
				required: true,
				placeholder:
					'// Example: Extract all links\nconst links = Array.from(document.querySelectorAll(\'a\')).map(a => a.href);\nreturn links;',
			},
			{
				displayName: 'Arguments (JSON)',
				name: 'evaluateArguments',
				type: 'json',
				typeOptions: {
					rows: 3,
				},
				default: '{}',
				description:
					'JSON object with arguments to pass to the JavaScript function. Access them as function parameters.',
				displayOptions: {
					show: {
						operation: ['evaluate'],
					},
				},
				placeholder: '{\n  "hostname": "example.com",\n  "maxLinks": 100\n}',
			},
			{
				displayName: 'Schema Source',
				name: 'schemaSource',
				type: 'options',
				options: [
					{
						name: 'Field List',
						value: 'fieldList',
					},
					{
						name: 'Example JSON',
						value: 'example',
					},
					{
						name: 'JSON Schema',
						value: 'jsonSchema',
					},
					{
						name: 'Manual Zod',
						value: 'manual',
					},
				],
				displayOptions: {
					show: {
						operation: ['extract'],
					},
				},
				default: 'fieldList',
				required: true,
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Field',
					minRequiredFields: 1,
				},
				default: [],
				description: 'List of output fields and their types',
				options: [
					{
						displayName: 'Field',
						name: 'field',
						values: [
							{
								displayName: 'Name',
								name: 'fieldName',
								type: 'string',
								default: '',
								description: 'Property name in the extracted object',
								required: true,
							},
							{
								displayName: 'Type',
								name: 'fieldType',
								type: 'options',
								options: [
									{
										name: 'Array',
										value: 'array',
									},
									{
										name: 'Boolean',
										value: 'boolean',
									},
									{
										name: 'Number',
										value: 'number',
									},
									{
										name: 'Object',
										value: 'object',
									},
									{
										name: 'String',
										value: 'string',
									},
								],
								default: 'string',
								required: true,
							},
							{
								displayName: 'Optional',
								name: 'optional',
								type: 'boolean',
								default: false,
								required: true,
							},
						],
					},
				],
				displayOptions: {
					show: {
						operation: ['extract'],
						schemaSource: ['fieldList'],
					},
				},
			},
			{
				displayName: 'Example JSON',
				name: 'exampleJson',
				type: 'json',
				typeOptions: {
					rows: 4,
				},
				displayOptions: {
					show: {
						operation: ['extract'],
						schemaSource: ['example'],
					},
				},
				default: '{\n  "title": "My Title",\n  "description": "My Description"\n}',
				required: true,
			},
			{
				displayName: 'JSON Schema',
				name: 'jsonSchema',
				type: 'json',
				typeOptions: {
					rows: 6,
				},
				displayOptions: {
					show: {
						operation: ['extract'],
						schemaSource: ['jsonSchema'],
					},
				},
				default:
					'{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object",\n  "properties": {\n    "title": { "type": "string", "description": "The page title" },\n    "description": { "type": "string", "description": "The page description" }\n  },\n  "required": ["title", "description"]\n}',
				required: true,
			},
			{
				displayName: 'Zod Code',
				name: 'manualZod',
				type: 'string',
				typeOptions: { rows: 6 },
				displayOptions: {
					show: {
						operation: ['extract'],
						schemaSource: ['manual'],
					},
				},
				default:
					'z.object({\n  title: z.string().describe("The page title"),\n  description: z.string().describe("The page description")\n})',
				required: true,
			},
			{
				displayName: 'Max Steps',
				name: 'maxSteps',
				type: 'number',
				default: 20,
				description: 'Maximum number of steps the agent can take',
				displayOptions: {
					show: {
						operation: ['agentExecute'],
					},
				},
			},
			{
				displayName: 'Auto Screenshot',
				name: 'autoScreenshot',
				type: 'boolean',
				default: true,
				description: 'Whether to take screenshots before each action',
				displayOptions: {
					show: {
						operation: ['agentExecute'],
					},
				},
			},
			// ADVANCED OPTIONS
			{
				displayName: 'Advanced Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				description: 'Advanced options for Stagehand',
				options: [
					{
						displayName: 'Model Name',
						name: 'modelName',
						type: 'options',
						options: [
							{
								name: 'OpenAI: GPT-4.1',
								value: 'openai/gpt-4.1',
							},
							{
								name: 'OpenAI: GPT-4o',
								value: 'openai/gpt-4o',
							},
							{
								name: 'OpenAI: Computer Use Preview (Agent)',
								value: 'computer-use-preview',
							},
							{
								name: 'DeepSeek V3 (Chutes)',
								value: 'deepseek-ai/DeepSeek-V3-0324',
							},
							{
								name: 'Anthropic: Claude 3.7 Sonnet (Latest)',
								value: 'anthropic/claude-3-7-sonnet-latest',
							},
							{
								name: 'Anthropic: Claude 3.5 Sonnet (Latest)',
								value: 'anthropic/claude-3-5-sonnet-latest',
							},
							{
								name: 'Anthropic: Claude Sonnet 4 (Agent)',
								value: 'claude-sonnet-4-20250514',
							},
							{
								name: 'Google: Gemini 2.5 Flash',
								value: 'google/gemini-2.5-flash',
							},
							{
								name: 'Google: Gemini 2.5 Pro',
								value: 'google/gemini-2.5-pro',
							},
							{
								name: 'Google: Gemini 2.5 Computer Use Preview (Agent)',
								value: 'gemini-2.5-computer-use-preview-10-2025',
							},
							{
								name: 'Cerebras: Llama 3.1 8B',
								value: 'cerebras/llama3.1-8b',
							},
							{
								name: 'Cerebras: Llama 3.3 70B',
								value: 'cerebras/llama-3.3-70b',
							},
							{
								name: 'Cerebras: GPT-OSS-120B (Agent)',
								value: 'cerebras/gpt-oss-120b',
							},
							{
								name: 'Cerebras: Qwen 3 235B',
								value: 'cerebras/qwen-3-235b-a22b-instruct-2507',
							},
							{
								name: 'Cerebras: Qwen 3 32B',
								value: 'cerebras/qwen-3-32b',
							},
							{
								name: 'Cerebras: Qwen 3 Coder 480B',
								value: 'cerebras/qwen-3-coder-480b',
							},
							{
								name: 'OpenRouter: Cerebras GPT-OSS-120B',
								value: 'openrouter/openai/gpt-oss-120b',
							},
							{
								name: 'OpenRouter: DeepSeek V3',
								value: 'openrouter/deepseek/deepseek-chat',
							},
							{
								name: 'OpenRouter: Claude 3.5 Sonnet',
								value: 'openrouter/anthropic/claude-3.5-sonnet',
							},
							{
								name: 'OpenRouter: GPT-4o',
								value: 'openrouter/openai/gpt-4o',
							},
						],
						default: '',
						description: 'AI model to use. If not specified, uses default based on credentials: OpenAI (openai/gpt-4o), Anthropic (anthropic/claude-3-5-sonnet-latest), Google (google/gemini-2.5-flash), Cerebras (cerebras/llama3.1-8b), OpenRouter (openrouter/cerebras/gpt-oss-120b). Models marked with (Agent) are optimized for agentExecute operation. Note: DeepSeek V3 requires Base URL configured in credentials (https://llm.chutes.ai/v1). OpenRouter provides access to Cerebras models through their aggregator.',
					},
					{
						displayName: 'Enable Caching',
						name: 'enableCaching',
						type: 'boolean',
						default: true,
						description: 'Whether to enable caching for Stagehand operations',
					},
					{
						displayName: 'Log Messages',
						name: 'logMessages',
						type: 'boolean',
						default: false,
						description: 'Whether to include Stagehand log messages in the node output',
					},
					{
						displayName: 'Verbose Level',
						name: 'verbose',
						type: 'options',
						options: [
							{
								name: 'No Logs',
								value: 0,
							},
							{
								name: 'Only Errors',
								value: 1,
							},
							{
								name: 'All Logs',
								value: 2,
							},
						],
						default: 0,
						description: 'Level of verbosity for Stagehand internal logging',
					},
					{
						displayName: 'DOM Settle Timeout (ms)',
						name: 'domSettleTimeoutMs',
						type: 'number',
						default: 30000,
						description: 'Maximum time to wait for DOM to stabilize',
					},
					{
						displayName: 'Wait Until',
						name: 'waitUntil',
						type: 'options',
						options: [
							{
								name: 'Load',
								value: 'load',
								description: 'Wait until the load event is fired',
							},
							{
								name: 'DOMContentLoaded',
								value: 'domcontentloaded',
								description: 'Wait until the DOMContentLoaded event is fired',
							},
							{
								name: 'Network Idle',
								value: 'networkidle',
								description: 'Wait until there are no more than 2 network connections for at least 500ms',
							},
						],
						default: 'networkidle',
						description: 'When to consider navigation succeeded. Network Idle ensures the page is fully loaded.',
					},
					{
						displayName: 'Wait Between Actions (ms)',
						name: 'waitBetweenActions',
						type: 'number',
						default: 0,
						description: 'Delay in milliseconds between actions (only for Agent Execute)',
					},
					{
						displayName: 'Act Timeout (ms)',
						name: 'actTimeout',
						type: 'number',
						default: 30000,
						description: 'Maximum time to wait for actions to complete. Reduce for simple operations (e.g., 5000-10000ms for clicks).',
					},
					{
						displayName: 'Block Heavy Resources',
						name: 'blockHeavyResources',
						type: 'boolean',
						default: false,
						description: 'Block images, fonts, and media to speed up page loads. Useful for text-only extraction.',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];

		// Obtener el proveedor seleccionado por el usuario
		const aiProvider = this.getNodeParameter('aiProvider', 0) as string;
		
		// Obtener el modelo personalizado del usuario (si está configurado)
		const customModelName = this.getNodeParameter('options.modelName', 0, '') as string;

		// Obtener credenciales según el proveedor seleccionado
		let apiKey: string | undefined;
		let baseURL: string | undefined;
		let modelProvider = aiProvider;
		let modelName = '';

		// Obtener las credenciales del proveedor seleccionado
		try {
			if (aiProvider === 'openai') {
				const openaiCreds = await this.getCredentials('openAiApi');
				if (openaiCreds?.apiKey) {
					apiKey = openaiCreds.apiKey as string;
					// Obtener baseURL si está configurado (para APIs compatibles con OpenAI como Chutes)
					// n8n puede usar 'baseURL', 'baseUrl', o 'url' dependiendo de la versión y configuración
					baseURL = (openaiCreds.baseURL || openaiCreds.baseUrl || openaiCreds.url) as string | undefined;
					modelName = customModelName || 'openai/gpt-4o';
				}
			} else if (aiProvider === 'anthropic') {
				const anthropicCreds = await this.getCredentials('anthropicApi');
				if (anthropicCreds?.apiKey) {
					apiKey = anthropicCreds.apiKey as string;
					modelName = customModelName || 'anthropic/claude-3-5-sonnet-latest';
				}
			} else if (aiProvider === 'google') {
				const googleCreds = await this.getCredentials('googlePalmApi');
				if (googleCreds?.apiKey) {
					apiKey = googleCreds.apiKey as string;
					modelName = customModelName || 'google/gemini-2.5-flash';
				}
			} else if (aiProvider === 'cerebras') {
				const cerebrasCreds = await this.getCredentials('cerebrasApi');
				if (cerebrasCreds?.apiKey) {
					apiKey = cerebrasCreds.apiKey as string;
					modelName = customModelName || 'cerebras/llama3.1-8b';
				}
			} else if (aiProvider === 'openrouter') {
				const openRouterCreds = await this.getCredentials('openRouterApi');
				if (openRouterCreds?.apiKey) {
					apiKey = openRouterCreds.apiKey as string;
					modelName = customModelName || 'openrouter/openai/gpt-oss-120b';
				}
			}
		} catch (error) {
			throw new ApplicationError(
				`Failed to get ${aiProvider} credentials. Please configure the ${aiProvider} API credentials in the node settings.`,
			);
		}

		// Validar que se obtuvo una API key
		if (!apiKey) {
			throw new ApplicationError(
				`No API key found for ${aiProvider}. Please configure the ${aiProvider} API credentials.`,
			);
		}

		let stagehand: StagehandCore;
		
		// Obtener el ID del workflow para identificar la sesión
		const workflowId = this.getWorkflow().id || 'default';
		const operation = this.getNodeParameter('operation', 0) as string;

		// Obtener configuración común
		const enableCaching = this.getNodeParameter('options.enableCaching', 0, true) as boolean;
		const verbose = this.getNodeParameter('options.verbose', 0, 0) as 0 | 1 | 2;
		const domSettleTimeoutMs = this.getNodeParameter('options.domSettleTimeoutMs', 0, 30000) as number;
		const waitUntil = this.getNodeParameter('options.waitUntil', 0, 'networkidle') as 'load' | 'domcontentloaded' | 'networkidle';
		const blockHeavyResources = this.getNodeParameter('options.blockHeavyResources', 0, false) as boolean;
		const fullModelName = modelName.includes('/') ? modelName : `${modelProvider}/${modelName}`;

		// Verificar si existe una sesión
		const existingSession = stagehandSessions.get(workflowId);
		let needsNewInstance = !existingSession;

		// Si existe sesión, verificar si está viva
		if (existingSession) {
			try {
				const isAlive = existingSession.instance.page && !existingSession.instance.page.isClosed();
				if (!isAlive) {
					needsNewInstance = true;
					stagehandSessions.delete(workflowId);
				}
			} catch (error) {
				needsNewInstance = true;
				stagehandSessions.delete(workflowId);
			}
		}

		// Función helper para crear/recrear instancia de Stagehand
		const createStagehandInstance = async (
			browserMode: string,
			cdpUrl: string | undefined,
			browserlessTimeout: number | undefined,
			provider: string = aiProvider,
		): Promise<StagehandCore> => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const stagehandConfig: any = {
				env: 'LOCAL',
				verbose: verbose,
				enableCaching: enableCaching,
				// Si waitUntil es 'networkidle', no necesitamos domSettleTimeoutMs largo
				domSettleTimeoutMs: waitUntil === 'networkidle' ? 1000 : domSettleTimeoutMs,
			};

			// Si hay un baseURL configurado (para APIs compatibles como Chutes)
			// usar AISdkClient con createOpenAI para configurar el provider personalizado
			if (baseURL && aiProvider === 'openai') {
				console.log('[Stagehand] Creating custom AI client with baseURL:', baseURL);
				console.log('[Stagehand] Provider:', aiProvider);
				console.log('[Stagehand] Using full model name:', fullModelName);
				console.log('[Stagehand] API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
				
				// Establecer la variable de entorno para el cliente
				process.env.OPENAI_API_KEY = apiKey;
				
				// Crear provider OpenAI compatible con configuración específica para Chutes
				const customProvider = createOpenAI({
					baseURL: baseURL,
					apiKey: apiKey,
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'HTTP-Referer': 'https://n8n.io',
						'X-Title': 'n8n Stagehand Integration',
					},
				});
				
				let model;
				
				// Para Chutes API, detectar si es Chutes y usar gpt-oss-120b
				const isChutesAPI = baseURL.includes('chutes.ai');
				
				if (isChutesAPI) {
					// Para Chutes API, usar el modelo por defecto según la documentación
					console.log('[Stagehand] Detected Chutes API - using default model from documentation');
					
					model = customProvider.chat('deepseek-ai/DeepSeek-V3-0324') as any;
					
					console.log('[Stagehand] Using Chutes API with default model: deepseek-ai/DeepSeek-V3-0324');
				} else {
					// Para otros modelos, usar el nombre completo
					model = customProvider.chat(fullModelName) as any;
					console.log('[Stagehand] Using model:', fullModelName);
				}
				
				// Crear AISdkClient con el modelo personalizado
				stagehandConfig.llmClient = new AISdkClient({ model });
				console.log('[Stagehand] Custom AI client created successfully');
			} else if (aiProvider === 'cerebras') {
				// Configurar Cerebras como provider OpenAI-compatible (tipo Chutes)
				console.log('[Stagehand] Creating Cerebras AI client using OpenAI-compatible provider');
				console.log('[Stagehand] Provider:', aiProvider);
				console.log('[Stagehand] Using full model name:', fullModelName);
				console.log('[Stagehand] API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
				
				// Usar OpenAI provider con baseURL de Cerebras (como Chutes)
				// Cerebras es compatible con OpenAI API: https://api.cerebras.ai/v1
				const cerebrasBaseURL = 'https://api.cerebras.ai/v1';
				
				// Establecer variable de entorno para el cliente
				process.env.OPENAI_API_KEY = apiKey;
				
				// Crear provider OpenAI compatible con configuración específica para Cerebras
				const cerebrasProvider = createOpenAI({
					baseURL: cerebrasBaseURL,
					apiKey: apiKey,
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'HTTP-Referer': 'https://n8n.io',
						'X-Title': 'n8n Stagehand Integration',
					},
				});
				
				// Para Cerebras, el modelo ya viene sin prefijo en el valor seleccionado
				// No necesitamos quitar el prefijo porque el usuario selecciona el modelo correcto
				const cerebrasModelName = fullModelName.includes('cerebras/')
					? fullModelName.replace('cerebras/', '')
					: fullModelName;
				
				let model;
				
				// Para Cerebras, usar el nombre del modelo directamente con el método correcto
				console.log('[Stagehand] Using Cerebras OpenAI-compatible API with model:', cerebrasModelName);
				
				// Para Cerebras, usar el método .chat() que es más compatible con OpenAI API
				// Según el curl, el endpoint es /chat/completions
				try {
					model = cerebrasProvider.chat(cerebrasModelName) as any;
					console.log('[Stagehand] Using chat method for Cerebras (OpenAI-compatible)');
				} catch (error) {
					console.log('[Stagehand] Falling back to direct model creation for Cerebras:', error);
					model = cerebrasProvider(cerebrasModelName) as any;
				}
				
				// Crear AISdkClient con el modelo Cerebras (OpenAI-compatible)
				stagehandConfig.llmClient = new AISdkClient({ model });
				
				console.log('[Stagehand] Cerebras AI client created successfully using OpenAI-compatible provider');
				console.log('[Stagehand] Base URL:', cerebrasBaseURL);
				console.log('[Stagehand] Model:', cerebrasModelName);
				console.log('[Stagehand] Using OpenAI structured output with Cerebras');
			} else if (aiProvider === 'openrouter') {
				// Configurar OpenRouter como provider
				console.log('[Stagehand] Creating OpenRouter AI client');
				console.log('[Stagehand] Provider:', aiProvider);
				console.log('[Stagehand] Using full model name:', fullModelName);
				console.log('[Stagehand] API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
				
				// Establecer variable de entorno para el cliente
				process.env.OPENAI_API_KEY = apiKey;
				
				// Crear provider OpenRouter
				const openRouterProvider = createOpenRouter({
					apiKey: apiKey,
				});
				
				// Para OpenRouter, el modelo ya viene con el formato correcto
				// Necesitamos quitar el prefijo 'openrouter/' si existe
				const openRouterModelName = fullModelName.includes('openrouter/')
					? fullModelName.replace('openrouter/', '')
					: fullModelName;
				
				let model;
				
				console.log('[Stagehand] Using OpenRouter API with model:', openRouterModelName);
				
				// Para OpenRouter, usar el método .chat()
				try {
					model = openRouterProvider.chat(openRouterModelName) as any;
					console.log('[Stagehand] Using chat method for OpenRouter');
				} catch (error) {
					console.log('[Stagehand] Falling back to direct model creation for OpenRouter:', error);
					model = openRouterProvider(openRouterModelName) as any;
				}
				
				// Crear AISdkClient con el modelo OpenRouter
				stagehandConfig.llmClient = new AISdkClient({ model });
				
				console.log('[Stagehand] OpenRouter AI client created successfully');
				console.log('[Stagehand] Model:', openRouterModelName);
				console.log('[Stagehand] Using OpenRouter structured output');
			} else {
				// Usar la configuración estándar de modelName y modelClientOptions
				stagehandConfig.modelName = fullModelName;
				stagehandConfig.modelClientOptions = {
					apiKey: apiKey,
				};
			}

			console.log('[Stagehand] Configuration:', JSON.stringify({
				modelName: fullModelName,
				hasApiKey: !!apiKey,
				hasBaseURL: !!baseURL,
				baseURL: baseURL,
				providerPrefix: aiProvider,
				usingCustomClient: !!(baseURL && aiProvider === 'openai'),
			}, null, 2));



			// Configure browser connection based on mode
			if (browserMode === 'remote' && cdpUrl) {
				stagehandConfig.localBrowserLaunchOptions = {
					cdpUrl: cdpUrl,
					args: [
						'--window-size=1920,1080',
						'--disable-dev-shm-usage',
					],
				};
			} else {
				stagehandConfig.headless = false;
				stagehandConfig.localBrowserLaunchOptions = {
					args: ['--window-size=1920,1080'],
				};
			}

			// Crear nueva instancia
			const newStagehand = new StagehandCore(stagehandConfig);
			await newStagehand.init();

			// Bloquear recursos pesados si está habilitado
			if (blockHeavyResources && newStagehand.context) {
				await newStagehand.context.route('**/*', (route) => {
					const resourceType = route.request().resourceType();
					if (['image', 'font', 'media'].includes(resourceType)) {
						route.abort();
					} else {
						route.continue();
					}
				});
			}

			// Almacenar sesión completa
			const session: StagehandSession = {
				instance: newStagehand,
				browserMode,
				apiKey: apiKey!,
				modelName: fullModelName,
				enableCaching,
				verbose,
				domSettleTimeoutMs,
				waitUntil,
				aiProvider: provider,
			};

			if (cdpUrl) {
				session.cdpUrl = cdpUrl;
			}

			if (browserlessTimeout) {
				session.browserlessTimeout = browserlessTimeout;
			}

			stagehandSessions.set(workflowId, session);
			return newStagehand;
		};

		// Función helper para ejecutar heartbeat de forma recursiva y segura
		const executeHeartbeat = async (session: StagehandSession): Promise<void> => {
			try {
				// Verificar si el heartbeat debe seguir activo
				if (!session.isHeartbeatActive) {
					return;
				}

				// Operación robusta para mantener conexión activa - método seguro sin user input
				// Usamos title() que es una operación simple y segura para mantener conexión activa
				const pageTitle = await session.instance.page.title();
				
				// Información adicional para logging (sin ejecución dinámica)
				const currentUrl = session.instance.page.url();
				
				// Actualizar estado del heartbeat
				session.lastHeartbeat = Date.now();
				session.heartbeatCount = (session.heartbeatCount || 0) + 1;

				// Logging detallado para diagnóstico
				if (session.verbose >= 2) {
					console.log(`[Stagehand] Heartbeat #${session.heartbeatCount} for workflow ${workflowId}:`, {
						url: currentUrl,
						pageTitle: pageTitle,
						method: 'title',
						lastActivity: new Date(session.lastHeartbeat).toISOString()
					});
				}

				// Programar siguiente heartbeat de forma recursiva solo si sigue activo
				if (session.isHeartbeatActive) {
					session.heartbeatTimeout = setTimeout(() => {
						executeHeartbeat(session);
					}, 20000); // Cada 20 segundos
				}

			} catch (error) {
				console.error(`[Stagehand] Heartbeat failed for workflow ${workflowId}:`, error);
				
				// Detener heartbeat en caso de error
				session.isHeartbeatActive = false;
				if (session.heartbeatTimeout) {
					clearTimeout(session.heartbeatTimeout);
					session.heartbeatTimeout = null;
				}

				// Marcar sesión como inválida
				session.lastHeartbeat = 0;
				session.heartbeatCount = 0;
			}
		};

		// Función helper para iniciar heartbeat de la sesión
		const startHeartbeat = (session: StagehandSession): void => {
			// Detener cualquier heartbeat existente
			stopHeartbeat(session);

			// Iniciar nuevo heartbeat recursivo
			session.isHeartbeatActive = true;
			session.heartbeatCount = 0;
			
			// Iniciar el primer heartbeat inmediatamente
			executeHeartbeat(session);
		};

		// Función helper para detener heartbeat
		const stopHeartbeat = (session: StagehandSession): void => {
			// Marcar como inactivo
			session.isHeartbeatActive = false;
			
			// Limpiar timeout si existe
			if (session.heartbeatTimeout) {
				clearTimeout(session.heartbeatTimeout);
				session.heartbeatTimeout = null;
			}
			
			console.log(`[Stagehand] Heartbeat stopped for workflow ${workflowId}`);
		};

		// Función helper para reconectar cuando se detecta sesión perdida
		const reconnectIfNeeded = async (): Promise<void> => {
			const session = stagehandSessions.get(workflowId);
			if (!session) {
				throw new ApplicationError(
					'Browser session lost. Please execute the Navigate operation first to initialize the browser.',
				);
			}

			// Detener heartbeat antes de reconectar
			stopHeartbeat(session);

			if (!session.lastNavigatedUrl) {
				throw new ApplicationError(
					'Browser session lost and no previous URL found. Please execute the Navigate operation first.',
				);
			}

			console.log(`[Stagehand] Reconnecting session for workflow ${workflowId} to ${session.lastNavigatedUrl}`);

			// Recrear instancia con la configuración guardada
			stagehand = await createStagehandInstance(
				session.browserMode,
				session.cdpUrl,
				session.browserlessTimeout,
			);

			// Navegar automáticamente a la última URL con el waitUntil guardado
			await stagehand.page.goto(session.lastNavigatedUrl, { waitUntil: session.waitUntil });

			// Reiniciar heartbeat con la nueva instancia
			const updatedSession = stagehandSessions.get(workflowId);
			if (updatedSession) {
				startHeartbeat(updatedSession);
			}
		};

		if (!needsNewInstance && existingSession) {
			// Reutilizar instancia existente
			stagehand = existingSession.instance;
		} else {
			// Obtener configuración de navegador
			let browserMode = 'local';
			let cdpUrl: string | undefined;
			let browserlessTimeout: number | undefined;

			if (operation === 'navigate') {
				browserMode = this.getNodeParameter('browserMode', 0, 'local') as string;
				if (browserMode === 'remote') {
					cdpUrl = this.getNodeParameter('cdpUrl', 0) as string;
					browserlessTimeout = this.getNodeParameter('browserlessTimeout', 0, 300000) as number;
					
					// Agregar el parámetro timeout a la URL de CDP
					if (cdpUrl && browserlessTimeout) {
						const separator = cdpUrl.includes('?') ? '&' : '?';
						cdpUrl = `${cdpUrl}${separator}timeout=${browserlessTimeout}`;
					}
				}
			} else if (existingSession) {
				// Reutilizar configuración de sesión anterior
				browserMode = existingSession.browserMode;
				cdpUrl = existingSession.cdpUrl;
				browserlessTimeout = existingSession.browserlessTimeout;
			}

			stagehand = await createStagehandInstance(browserMode, cdpUrl, browserlessTimeout);
		}

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;
			const logMessages = this.getNodeParameter('options.logMessages', i, false) as boolean;

			const messages: LogLine[] = [];

			try {
				switch (operation) {
					case 'navigate': {
						const url = this.getNodeParameter('url', i, '') as string;
						const waitUntil = this.getNodeParameter('options.waitUntil', i, 'networkidle') as 'load' | 'domcontentloaded' | 'networkidle';
						await stagehand.page.goto(url, { waitUntil });

						// Guardar la URL navegada en la sesión
						const session = stagehandSessions.get(workflowId);
						if (session) {
							session.lastNavigatedUrl = url;
							session.waitUntil = waitUntil;
							stagehandSessions.set(workflowId, session);
						}

						results.push({
							json: {
								operation,
								url,
								waitUntil,
								success: true,
								...(logMessages ? { messages } : {}),
							},
						});
						break;
					}

					case 'act': {
						const instruction = this.getNodeParameter('instruction', i, '') as string;

						// Validar que la página esté activa, reconectar si es necesario
						const actUrl = stagehand.page.url();
						if (!actUrl || actUrl === 'about:blank') {
							await reconnectIfNeeded();
							// Continuar con la operación después de reconectar
						}

						const result = await stagehand.page.act(instruction);
						results.push({
							json: {
								operation,
								result,
								...(logMessages ? { messages } : {}),
							},
						});
						break;
					}

					case 'extract': {
						const instruction = this.getNodeParameter('instruction', i, '') as string;
						const schemaSource = this.getNodeParameter('schemaSource', i, 'fieldList') as string;

						// Validar que la página esté activa, reconectar si es necesario
						const extractUrl = stagehand.page.url();
						if (!extractUrl || extractUrl === 'about:blank') {
							await reconnectIfNeeded();
							// Continuar con la operación después de reconectar
						}

						let schema: z.ZodObject<any>;
						switch (schemaSource) {
							case 'fieldList': {
								const fields = this.getNodeParameter('fields.field', i, []) as Field[];
								schema = Stagehand.fieldsToZodSchema(fields);
								break;
							}

							case 'example': {
								const example = this.getNodeParameter('exampleJson', i) as string;
								schema = new Function('z', `${jsonToZod(JSON.parse(example))}return schema;`)(
									z,
								);
								break;
							}

							case 'jsonSchema': {
								const jsonSchema = this.getNodeParameter('jsonSchema', i) as string;
								schema = new Function('z', `return ${jsonSchemaToZod(JSON.parse(jsonSchema))};`)(
									z,
								);
								break;
							}

							case 'manual': {
								const zodCode = this.getNodeParameter('manualZod', i) as string;
								schema = new Function('z', `return ${zodCode};`)(z);
								break;
							}

							default: {
								throw new ApplicationError(`Unsupported schema source: ${schemaSource}`);
							}
						}

						const result = await stagehand.page.extract({
							instruction,
							schema: schema as any,
						});

						results.push({
							json: {
								operation,
								result,
								...(logMessages ? { messages } : {}),
							},
						});
						break;
					}

					case 'evaluate': {
						const javascriptCode = this.getNodeParameter('javascriptCode', i, '') as string;
						const evaluateArgumentsStr = this.getNodeParameter('evaluateArguments', i, '{}') as string;

						let evaluateArguments: any = {};
						try {
							evaluateArguments = JSON.parse(evaluateArgumentsStr);
						} catch (error) {
							throw new ApplicationError(
								`Invalid JSON in Arguments: ${(error as Error).message}`,
							);
						}

						// Validar que la página esté activa, reconectar si es necesario
						const currentUrl = stagehand.page.url();
						if (!currentUrl || currentUrl === 'about:blank') {
							await reconnectIfNeeded();
							// Continuar con la operación después de reconectar
						}

						// Convert arguments object to array of values for page.evaluate
						const argValues = Object.values(evaluateArguments);

						// Execute the JavaScript code in the browser context
						// The code should be a function expression that we call with the arguments
						const result = await stagehand.page.evaluate(
							new Function(
								...Object.keys(evaluateArguments),
								`return (${javascriptCode}).apply(null, arguments);`,
							) as any,
							...argValues,
						);

						results.push({
							json: {
								operation,
								result: result as any,
								arguments: evaluateArguments,
								currentUrl: currentUrl, // Include current URL for debugging
								...(logMessages ? { messages } : {}),
							},
						});
						break;
					}

					case 'observe': {
						const instruction = this.getNodeParameter('instruction', i, '') as string;

						// Validar que la página esté activa, reconectar si es necesario
						const observeUrl = stagehand.page.url();
						if (!observeUrl || observeUrl === 'about:blank') {
							await reconnectIfNeeded();
							// Continuar con la operación después de reconectar
						}

						const result = await stagehand.page.observe({
							instruction,
						});

						results.push({
							json: {
								operation,
								result,
								...(logMessages ? { messages } : {}),
							},
						});
						break;
					}

					case 'agentExecute': {
						const instruction = this.getNodeParameter('instruction', i, '') as string;

						// Validar que la página esté activa, reconectar si es necesario
						const agentUrl = stagehand.page.url();
						if (!agentUrl || agentUrl === 'about:blank') {
							await reconnectIfNeeded();
							// Continuar con la operación después de reconectar
						}
						const maxSteps = this.getNodeParameter('maxSteps', i, 20) as number;
						const autoScreenshot = this.getNodeParameter('autoScreenshot', i, true) as boolean;
						const waitBetweenActions = this.getNodeParameter('options.waitBetweenActions', i, 0) as number;

						// Usar el modelProvider y modelName detectados al inicio
						// Construir nombre completo del modelo
						const fullModelName = modelName.includes('/') ? modelName : `${modelProvider}/${modelName}`;
						
						// Extract provider and model for agent
						let agentProvider = modelProvider;
						let agentModel = modelName;
						
						if (fullModelName.includes('/')) {
							const parts = fullModelName.split('/');
							agentProvider = parts[0] || 'openai';
							agentModel = parts[1] || fullModelName;
						}

						// Create agent instance using the API key from native credentials
						const agent = (stagehand as any).agent({
							provider: agentProvider,
							model: agentModel,
							instructions: 'You are a helpful web automation assistant.',
							options: {
								apiKey: apiKey,
							},
						});

						const result = await agent.execute({
							instruction,
							maxSteps,
							autoScreenshot,
							waitBetweenActions,
						});

						results.push({
							json: {
								operation,
								result,
								...(logMessages ? { messages } : {}),
							},
						});
						break;
					}

					case 'closeSession': {
						// Cerrar la sesión del navegador y limpiar recursos
						await stagehand.close();
						stagehandSessions.delete(workflowId);

						results.push({
							json: {
								operation,
								success: true,
								message: 'Browser session closed successfully',
								...(logMessages ? { messages } : {}),
							},
						});
						break;
					}

					default: {
						throw new ApplicationError(`Unsupported operation: ${operation}`);
					}
				}
			} catch (error) {
				results.push({
					error: new NodeOperationError(this.getNode(), error as Error, {
						message: `Error executing Stagehand operation: ${(error as Error).message}`,
					}),
					json: {
						operation,
						...(logMessages ? { messages } : {}),
					},
				});
			}
		}

		return [results];
	}

	static fieldsToZodSchema(fields: Field[]): z.ZodObject<any> {
		const shape: Record<string, ZodTypeAny> = {};

		for (const { fieldName, fieldType, optional } of fields) {
			let zType: ZodTypeAny;

			switch (fieldType) {
				case 'string':
					zType = z.string();
					break;
				case 'number':
					zType = z.number();
					break;
				case 'boolean':
					zType = z.boolean();
					break;
				case 'array':
					zType = z.array(z.any());
					break;
				case 'object':
					zType = z.object({}).passthrough();
					break;
				default:
					zType = z.any();
			}

			shape[fieldName] = optional ? zType.optional() : zType;
		}

		return z.object(shape);
	}
}