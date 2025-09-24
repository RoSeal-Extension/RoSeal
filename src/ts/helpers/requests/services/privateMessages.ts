import { chunk } from "src/ts/utils/objects.ts";
import { httpClient } from "../main.ts";
import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };

export type ListPrivateMessagesRequest = {
	pageSize?: number;
	pageNumber?: number;
};

export type PrivateMessageTarget = {
	id: number;
	name: string;
	displayName: string;
};

export type PrivateMessage = {
	id: number;
	sender: PrivateMessageTarget;
	recipient: PrivateMessageTarget;
	subject: string;
	body: string;
	created: string;
	updated: string;
	isRead: boolean;
	isSystemMessage: boolean;
	isReportAbuseDisplayed: boolean;
};

export type ListPrivateMessagesResponse = {
	collection: PrivateMessage[];
	totalCollectionSize: number;
	totalPages: number;
	pageNumber: number;
};

export type MarkPrivateMessagesReadRequest = {
	messageIds: number[];
};

export type MarkPrivateMessagesReadResponse = {
	failedMessages: number[];
};

export async function listPrivateMessages(request: ListPrivateMessagesRequest) {
	return (
		await httpClient.httpRequest<ListPrivateMessagesResponse>({
			url: getRobloxUrl("privatemessages", "/v1/messages"),
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function markPrivateMessagesRead(
	request: MarkPrivateMessagesReadRequest,
): Promise<MarkPrivateMessagesReadResponse> {
	if (request.messageIds.length > 20) {
		return Promise.all(
			chunk(request.messageIds, 20).map((chunk) =>
				markPrivateMessagesRead({
					messageIds: chunk,
				}),
			),
		).then((chunks) => ({
			failedMessages: chunks.flatMap((chunk) => chunk.failedMessages),
		}));
	}

	return (
		await httpClient.httpRequest<MarkPrivateMessagesReadResponse>({
			method: "POST",
			url: getRobloxUrl("privatemessages", "/v1/messages/mark-read"),
			body: {
				type: "json",
				value: request,
			},
			includeCredentials: true,
		})
	).body;
}
