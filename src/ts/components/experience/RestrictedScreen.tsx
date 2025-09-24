import { getAssetById } from "src/ts/helpers/requests/services/assets";
import usePromise from "../hooks/usePromise";
import { placeAssetTypeId } from "src/ts/utils/itemTypes";
import {
	getAvatarAssetLink,
	getExperienceLink,
	getHomePageUrl,
	getRobloxSupportUrl,
} from "src/ts/utils/links";
import { getPlaceUniverseId } from "src/ts/helpers/requests/services/places";
import {
	multigetUniversesByIds,
	multigetUniversesPlayabilityStatuses,
} from "src/ts/helpers/requests/services/universes";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Button from "../core/Button";
import Loading from "../core/Loading";
import Page404 from "../core/errors/404";

export type ExperienceRestrictedScreenProps = {
	placeId: number;
};

export default function ExperienceRestrictedScreen({ placeId }: ExperienceRestrictedScreenProps) {
	const [isPlace] = usePromise(
		() =>
			getAssetById({
				assetId: placeId,
			})
				.then((data) => {
					if (data.assetTypeId !== placeAssetTypeId) {
						location.pathname = getAvatarAssetLink(data.assetId, data.name);
						return false;
					}

					return true;
				})
				.catch(() => {
					return false;
				}),

		[placeId],
	);
	const [universeId] = usePromise(
		() =>
			getPlaceUniverseId({
				placeId,
			}),
		[placeId],
	);
	const [playabilityReason] = usePromise(() => {
		if (!universeId) {
			return;
		}

		return multigetUniversesPlayabilityStatuses({
			universeIds: [universeId],
		}).then((data) => {
			const item = data?.[0];
			const reason = item.playabilityStatus;
			if (reason === "ContextualPlayabilityRegionalCompliance") {
				return "Blocked";
			}

			if (reason === "ContextualPlayabilityRegionalAvailability") {
				return "Unavailable";
			}

			if (reason === "UnderReview") {
				return "UnderReview";
			}

			if (item?.isPlayable === false) {
				return "UnavailableOther";
			}

			return multigetUniversesByIds({
				universeIds: [universeId],
			})
				.then((data) => {
					if (!data[0]) {
						return "Unavailable";
					}

					return "Available";
				})
				.catch(() => "UnavailableOther" as const);
		});
	}, [universeId]);

	if (isPlace === false) {
		return <Page404 />;
	}
	if (!isPlace || !playabilityReason) {
		return <Loading />;
	}

	if (playabilityReason === "Available") {
		location.pathname = getExperienceLink(placeId);
		return null;
	}

	const suffix = playabilityReason ?? "Orphan";

	return (
		<div className="item-blocked-screen experience-restricted-screen">
			<div className="item-blocked">
				<h2 className="block-title">
					{getMessage(`experienceRestricted.title.${suffix}`)}
				</h2>
				<span className="text block-view-text">
					{getMessage(`experienceRestricted.message.${suffix}`)}
				</span>
				<div className="action-btns">
					<Button
						as="a"
						className="back-btn"
						type="primary"
						onClick={() => history.back()}
					>
						{getMessage("experienceRestricted.actions.back")}
					</Button>
					<Button as="a" className="home-btn" type="control" href={getHomePageUrl()}>
						{getMessage("experienceRestricted.actions.home")}
					</Button>
				</div>
				<span className="text-footer">
					{getMessage("experienceRestricted.footer", {
						supportLink: (contents: string) => (
							<a href={getRobloxSupportUrl()} className="text-link">
								{contents}
							</a>
						),
					})}
				</span>
			</div>
		</div>
	);
}
