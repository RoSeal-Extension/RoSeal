import { subHours } from "date-fns";
import { getRolimonsUrl } from "src/ts/utils/baseUrls";
import { httpClient } from "../main";

type InternalRolimonsData = {
	num_points: number;
	timestamps: number[];
	players: number[];
	avg_playtime: number[];
	visits: number[];
	upvotes: number[];
	downvotes: number[];
	favorites: number[];
};

export type GetRolimonsUpvoteRatioRequest = {
	placeId: number;
	days: number;
};

export async function getRolimonsUpvoteRatio({ placeId, days }: GetRolimonsUpvoteRatioRequest) {
	const document = (
		await httpClient.httpRequest<Document>({
			url: `${getRolimonsUrl("www")}/game/${placeId}`,
			expect: "dom",
			bypassCORS: true,
		})
	).body;

	for (const script of document.querySelectorAll("script")) {
		const content = script.textContent;
		if (!content?.startsWith("var game_history = {")) continue;

		const match = content.match(/({.+})/)?.[1];
		if (!match) continue;

		const data: InternalRolimonsData = JSON.parse(match);

		const endTime = Date.now();
		const startTime = subHours(endTime, days).getTime();

		let startUpVotes = 0;
		let startDownVotes = 0;

		for (let i = data.num_points; i >= 0; i--) {
			const date = data.timestamps[i] * 1000;
			if (date > endTime) continue;
			if (date < startTime) {
				break;
			}

			startUpVotes = data.upvotes[i];
			startDownVotes = data.downvotes[i];
		}

		const totalUpVotes = data.upvotes[data.num_points - 1] - startUpVotes;
		const totalDownVotes = data.downvotes[data.num_points - 1] - startDownVotes;

		if (!totalUpVotes && !totalDownVotes) {
			return null;
		}

		return {
			totalUpVotes,
			totalDownVotes,
			upVotesRatio: totalUpVotes / (totalUpVotes + totalDownVotes) || 0,
		};
	}
}
