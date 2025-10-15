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

// Mapa global para almacenar instancias de Stagehand por workflow ID
const stagehandInstances = new Map<string, StagehandCore>();

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
		usableAsTool: true,
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
				],
				default: 'openai',
				description: 'Select which AI provider to use for operations that require AI',
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
						description: 'Navigate to a URL',
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
						],
						default: '',
						description: 'AI model to use. If not specified, uses default based on credentials: OpenAI (openai/gpt-4o), Anthropic (anthropic/claude-3-5-sonnet-latest), Google (google/gemini-2.5-flash). Models marked with (Agent) are optimized for agentExecute operation.',
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
						displayName: 'Wait Between Actions (ms)',
						name: 'waitBetweenActions',
						type: 'number',
						default: 0,
						description: 'Delay in milliseconds between actions (only for Agent Execute)',
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
		let modelProvider = aiProvider;
		let modelName = '';

		// Obtener las credenciales del proveedor seleccionado
		try {
			if (aiProvider === 'openai') {
				const openaiCreds = await this.getCredentials('openAiApi');
				if (openaiCreds?.apiKey) {
					apiKey = openaiCreds.apiKey as string;
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

		// Obtener el ID del workflow para identificar la instancia
		const workflowId = this.getWorkflow().id || 'default';

		// Verificar si ya existe una instancia para este workflow
		const existingInstance = stagehandInstances.get(workflowId);

		if (!existingInstance) {
			// Si no existe, crear una nueva instancia
			const enableCaching = this.getNodeParameter('options.enableCaching', 0, true) as boolean;
			const verbose = this.getNodeParameter('options.verbose', 0, 0) as 0 | 1 | 2;
			const domSettleTimeoutMs = this.getNodeParameter('options.domSettleTimeoutMs', 0, 30000) as number;

			// Construir nombre completo del modelo con prefijo del proveedor
			const fullModelName = modelName.includes('/') ? modelName : `${modelProvider}/${modelName}`;

			// Build Stagehand configuration with API key from native credentials
			const stagehandConfig: any = {
				env: 'LOCAL',
				headless: false,
				verbose: verbose,
				enableCaching: enableCaching,
				domSettleTimeoutMs: domSettleTimeoutMs,
				modelName: fullModelName,
				modelClientOptions: {
					apiKey: apiKey,
				},
			};

			stagehand = new StagehandCore(stagehandConfig);
			await stagehand.init();

			// Almacenar la instancia para reutilización
			stagehandInstances.set(workflowId, stagehand);
		} else {
			// Reutilizar la instancia existente
			stagehand = existingInstance;
		}

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;
			const logMessages = this.getNodeParameter('options.logMessages', i, false) as boolean;

			const messages: LogLine[] = [];

			try {
				switch (operation) {
					case 'navigate': {
						const url = this.getNodeParameter('url', i, '') as string;
						await stagehand.page.goto(url);

						results.push({
							json: {
								operation,
								url,
								success: true,
								...(logMessages ? { messages } : {}),
							},
						});
						break;
					}

					case 'act': {
						const instruction = this.getNodeParameter('instruction', i, '') as string;

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

						// Convert arguments object to array of values for page.evaluate
						const argValues = Object.values(evaluateArguments);

						// Execute the JavaScript code in the browser context
						const result = await stagehand.page.evaluate(
							new Function(
								...Object.keys(evaluateArguments),
								`return (${javascriptCode})(...arguments);`,
							) as any,
							...argValues,
						);

						results.push({
							json: {
								operation,
								result: result as any,
								arguments: evaluateArguments,
								...(logMessages ? { messages } : {}),
							},
						});
						break;
					}

					case 'observe': {
						const instruction = this.getNodeParameter('instruction', i, '') as string;

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
						stagehandInstances.delete(workflowId);

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