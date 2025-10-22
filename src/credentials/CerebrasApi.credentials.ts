import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CerebrasApi implements ICredentialType {
	name = 'cerebrasApi';
	displayName = 'Cerebras API';
	documentationUrl = 'https://docs.cerebras.ai/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'The API key for your Cerebras account. Get your key from https://cloud.cerebras.ai',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test = {
		request: {
			baseURL: 'https://api.cerebras.ai/v1',
			url: '/models',
			headers: {
				'Content-Type': 'application/json',
			},
		},
	};
}