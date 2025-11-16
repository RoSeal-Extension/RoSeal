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
		method: "POST",
		url: getRobloxUrl("auth", "/v1/authentication-ticket"),
		body: {
			type: "json",
			value: request,
		},
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});

	return {
		code: res.headers.get("RBX-Authentication-Ticket"),
	};
}

export async function generateClientAssertion(): Promise<GenerateAuthenticationTicketRequest> {
	return (
		await httpClient.httpRequest<GenerateAuthenticationTicketRequest>({
			url: getRobloxUrl("auth", "/v1/client-assertion"),
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function updateClientStatus(request: ClientStatusRequest) {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: getRobloxUrl("apis", "/matchmaking-api/v1/client-status"),
		body: {
			type: "json",
			value: request,
		},
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function getClientStatus() {
	return (
		await httpClient.httpRequest<ClientStatusRequest>({
			url: getRobloxUrl("apis", "/matchmaking-api/v1/client-status"),
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}
