import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { httpClient } from "../main.ts";

export type GenerateAuthenticationTicketResponse = {
	code: string | null;
};

export type GenerateAuthenticationTicketRequest = {
	clientAssertion: string;
};

export type ClientStatusRequest = {
	status:
		| "Unknown"
		| "BootstrapperInstalling"
		| "AppStarted"
		| "AcquiringGame"
		| "JoiningGame"
		| "InGame"
		| "LeftGame";
};

export async function generateAuthenticationTicket(
	request: GenerateAuthenticationTicketRequest,
): Promise<GenerateAuthenticationTicketResponse> {
	const res = await httpClient.httpRequest({
		url: getRobloxUrl("auth", "/v1/authentication-ticket"),
		method: "POST",
		body: {
			type: "json",
			value: request,
		},
		expect: "none",
		includeCredentials: true,
	});

	return {
		code: res.headers.get("RBX-Authentication-Ticket"),
	};
}

export async function generateClientAssertion(): Promise<GenerateAuthenticationTicketRequest> {
	return (
		await httpClient.httpRequest<GenerateAuthenticationTicketRequest>({
			url: getRobloxUrl("auth", "/v1/client-assertion"),
			includeCredentials: true,
		})
	).body;
}

export async function updateClientStatus(request: ClientStatusRequest) {
	await httpClient.httpRequest<void>({
		url: getRobloxUrl("apis", "/matchmaking-api/v1/client-status"),
		method: "POST",
		body: {
			type: "json",
			value: request,
		},
		expect: "none",
		includeCredentials: true,
	});
}

export async function getClientStatus() {
	return (
		await httpClient.httpRequest<ClientStatusRequest>({
			url: getRobloxUrl("apis", "/matchmaking-api/v1/client-status"),
			includeCredentials: true,
		})
	).body;
}
