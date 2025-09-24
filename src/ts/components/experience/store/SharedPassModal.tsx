import type { PassProductInfo } from "src/ts/helpers/requests/services/passes";
import type { RobloxSharedExperiencePass } from "src/ts/helpers/requests/services/roseal";
import { multigetUniversesByIds } from "src/ts/helpers/requests/services/universes";
import Loading from "../../core/Loading";
import SimpleModal from "../../core/modal/SimpleModal";
import RobuxView from "../../core/RobuxView";
import usePromise from "../../hooks/usePromise";
import SlimExperienceCard from "../SlimExperienceCard";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { useMemo } from "preact/hooks";
import { getRegularTime } from "src/ts/helpers/i18n/intlFormats";

export type SharedPassModalProps = {
	sharedDetails: RobloxSharedExperiencePass;
	productDetails: PassProductInfo;
	show: boolean;
	isOwned?: boolean;
	setShow: (open: boolean) => void;
	buyPass: () => void;
};

export default function SharedPassModal({
	sharedDetails,
	productDetails,
	show,
	isOwned,
	setShow,
	buyPass,
}: SharedPassModalProps) {
	const [universesDetails] = usePromise(
		() =>
			multigetUniversesByIds({
				universeIds: sharedDetails.sharedUniverses.map((item) => item.id),
			}),
		[sharedDetails.sharedUniverses],
	);

	const periodChangeText = useMemo(() => {
		const { period, periodSpecificTime, universesChangeAfterPeriod } =
			sharedDetails.benefitData;

		if (!period && !periodSpecificTime) return;

		if (periodSpecificTime) {
			return getMessage(
				`experience.passes.sharedPassModal.periodChangeText.specificTime${universesChangeAfterPeriod ? ".withExperiences" : ""}`,
				{
					time: getRegularTime(periodSpecificTime),
				},
			);
		}

		if (period !== "lifetime")
			return getMessage(
				`experience.passes.sharedPassModal.periodChangeText.period${universesChangeAfterPeriod ? ".withExperiences" : ""}`,
				{
					period,
				},
			);
	}, [sharedDetails.benefitData]);

	return (
		<SimpleModal
			show={show}
			size="md"
			title={getMessage("experience.passes.sharedPassModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			buttons={[
				{
					type: "neutral",
					text: getMessage("experience.passes.sharedPassModal.buttons.neutral"),
					onClick: () => setShow(false),
				},
				...(sharedDetails.links ?? []).map((link) => ({
					type: "neutral" as const,
					buttonType: link.type,
					text: link.label,
					onClick: () => window.open(`https://${link.url}`, "_blank"),
				})),
				{
					type: "action",
					text: getMessage("experience.passes.sharedPassModal.buttons.action"),
					visible: !isOwned,
					onClick: () => {
						buyPass();
						setShow(false);
					},
				},
			]}
		>
			<div className="shared-pass-modal-body">
				<p className="shared-pass-modal-description">
					{isOwned
						? getMessage("experience.passes.sharedPassModal.descriptionOwned", {
								passName: sharedDetails.displayName,
							})
						: getMessage("experience.passes.sharedPassModal.description", {
								passName: sharedDetails.displayName,
								robux: <RobuxView priceInRobux={productDetails.priceInRobux} />,
							})}
				</p>
				<div className="section shared-pass-experiences">
					<div className="experiences-header">
						<h2>{getMessage("experience.passes.sharedPassModal.experiences.title")}</h2>
						{periodChangeText !== undefined && <p>{periodChangeText}</p>}
					</div>
					<ul className="shared-pass-experience-list game-carousel game-cards roseal-game-cards">
						{universesDetails ? (
							universesDetails.map((item) => (
								<SlimExperienceCard
									key={item.id}
									universeId={item.id}
									name={item.name}
									rootPlaceId={item.rootPlaceId}
								/>
							))
						) : (
							<Loading />
						)}
					</ul>
				</div>
			</div>
		</SimpleModal>
	);
}
