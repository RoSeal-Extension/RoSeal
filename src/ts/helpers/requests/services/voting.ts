import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { httpClient } from "../main";

export type GetCurrentUserVoteCountRequest = {
	targetType: string;
};

export type GetCurrentUserVoteCountResponse = {
	userId: number;
	targetType: string;
	platformTypeId: number;
	voteCount: number;
};

export async function getCurrentUserVoteCount(request: GetCurrentUserVoteCountRequest) {
	return (
		await httpClient.httpRequest<GetCurrentUserVoteCountResponse>({
			url: getRobloxUrl("apis", "/voting-api/user/get-vote-count"),
			search: request,
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}
