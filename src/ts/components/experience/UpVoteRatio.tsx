import { getPlaceVotes } from "src/ts/helpers/requests/services/places";
import usePromise from "../hooks/usePromise";
import { getRolimonsUpvoteRatio } from "src/ts/helpers/requests/services/rolimons";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Tooltip from "../core/Tooltip";
import MdOutlineInfoIcon from "@material-symbols/svg-400/outlined/info.svg";

export type PlaceUpVoteRatioProps = {
	placeId: number;
	days: number;
};

export default function PlaceUpVoteRatio({ placeId, days }: PlaceUpVoteRatioProps) {
	{
		const [ratio] = usePromise(
			() =>
				getPlaceVotes({
					placeId,
				}),
			[placeId],
		);
		const [recentRatio] = usePromise(
			() =>
				getRolimonsUpvoteRatio({
					placeId,
					days,
				}),
			[placeId, days],
		);

		return (
			<>
				{ratio && (
					<div id="all-time-upvote-ratio" className="text-emphasis small">
						{asLocaleString(ratio?.upVotesRatio, {
							style: "percent",
							minimumFractionDigits: 0,
							maximumFractionDigits: 1,
						})}
					</div>
				)}
				{recentRatio && (
					<div id="recent-upvote-ratio" className="text small">
						<Tooltip button={<MdOutlineInfoIcon className="roseal-icon" />}>
							{getMessage("experience.voting.recentUpVoteRatio.tooltip", {
								days: asLocaleString(days),
							})}
						</Tooltip>
						{getMessage("experience.voting.recentUpVoteRatio", {
							ratio: asLocaleString(recentRatio?.upVotesRatio, {
								style: "percent",
								minimumFractionDigits: 0,
								maximumFractionDigits: 1,
							}),
						})}
					</div>
				)}
			</>
		);
	}
}
