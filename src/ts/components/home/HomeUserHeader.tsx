import classNames from "classnames";
import { useEffect, useState } from "preact/hooks";
import Confetti from "react-confetti";
import { BIRTHDAYMESSAGE_DELAY_KEY } from "src/ts/constants/home";
import {
	formatCustomMessage,
	getMessage,
	getMessageKeysWithPrefix,
} from "src/ts/helpers/i18n/getMessage";
import { getBirthdate, getPublicRoles } from "src/ts/helpers/requests/services/account";
import { getUserProfileLink } from "src/ts/utils/links";
import { delay } from "src/ts/utils/misc";
import { randomInt } from "src/ts/utils/random";
import { renderAppend } from "src/ts/utils/render";
import Thumbnail from "../core/Thumbnail";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import useFeatureValue from "../hooks/useFeatureValue";
import VerifiedBadge from "../icons/VerifiedBadge";
import { getSecondsSinceMidnight } from "src/ts/utils/time";

function getMessagePool(roles: string[]) {
	const pool = getMessageKeysWithPrefix("homeHeader.messages.default");
	for (const role of roles) {
		pool.push(...getMessageKeysWithPrefix(`homeHeader.messages.${role}`));
	}

	if (!browser.i18n.getUILanguage().startsWith("en")) {
		pool.push("homeHeader.messages.nonEnglish");
	}

	return pool;
}

export default function HomeUserHeader() {
	const [authenticatedUser] = useAuthenticatedUser();
	const [easterEggText, setEasterEggText] = useState<string>();
	const [isBirthday, setIsBirthday] = useState<boolean>(false);
	const [isBirthdayEnabled] = useFeatureValue("homeUserHeader.birthdayMessage", false);
	const [isEasterEggTextEnabled] = useFeatureValue("homeUserHeader.easterEggText", false);
	const [_greetingText] = useFeatureValue("homeUserHeader.greetingText", [false]);
	const [preferredNameType] = useFeatureValue("homeUserHeader.displayNameType", "both");
	const [avatarType] = useFeatureValue("homeUserHeader.thumbnailType", "AvatarHeadShot");
	const [includeWhiteBackground] = useFeatureValue("homeUserHeader.includeWhiteBackground", true);
	const [includeBadges] = useFeatureValue("homeUserHeader.includeBadges", true);

	useEffect(() => {
		if (isBirthdayEnabled) {
			const currentDay = new Date();
			getBirthdate()
				.then(({ birthMonth, birthDay }) => {
					if (
						currentDay.getMonth() + 1 === birthMonth &&
						currentDay.getDate() === birthDay
					) {
						setIsBirthday(true);
						delay(BIRTHDAYMESSAGE_DELAY_KEY, 7_200_000, (value) => {
							if (!value) return;

							renderAppend(
								<Confetti
									recycle={false}
									numberOfPieces={4_000}
									tweenDuration={10_000}
									onConfettiComplete={() => div.remove()}
								/>,
								document.body,
							);
							const div = document.createElement("div");
							document.body.appendChild(div);
						});
					}
				})
				.catch(() => {});
		}

		if (isEasterEggTextEnabled) {
			if (Math.random() < 0.1) {
				getPublicRoles()
					.catch(() => ({
						roles: [],
					}))
					.then(({ roles }) => {
						const pool = getMessagePool(roles);
						setEasterEggText(getMessage(pool[randomInt(0, pool.length - 1)]));
					});
			}
		}
	}, [isBirthdayEnabled, isEasterEggTextEnabled]);

	if (!authenticatedUser) {
		return <></>;
	}

	const greetingName =
		preferredNameType === "username"
			? authenticatedUser.username
			: authenticatedUser.displayName;
	const greetingText = _greetingText?.[0]
		? formatCustomMessage(_greetingText[1]!, {
				preferredName: greetingName,
				...authenticatedUser,
				seconds: getSecondsSinceMidnight(),
			})
		: greetingName;

	return (
		<div id="roseal-home-header" className="col-xs-12 home-header-container">
			<div className="home-header">
				<a
					className={classNames("user-avatar-container avatar", {
						"avatar-headshot": avatarType === "AvatarHeadShot",
					})}
					href={getUserProfileLink(authenticatedUser.userId)}
				>
					<Thumbnail
						request={{
							targetId: authenticatedUser.userId,
							type: avatarType,
							size: "180x180",
						}}
						containerClassName={
							includeWhiteBackground ? "avatar-card-image" : undefined
						}
					/>
				</a>
				<div className="home-userinfo-upsell-container">
					{isBirthdayEnabled && isBirthday && (
						<p className="h2 birthday-message">
							{getMessage("homeHeader.birthdayMessage")}
						</p>
					)}
					<div className="user-info-container">
						<h1 className="greeting-container">
							<a href={getUserProfileLink(authenticatedUser.userId)}>
								{greetingText !== undefined && !isBirthday
									? greetingText
									: greetingName}
							</a>
							{includeBadges &&
								authenticatedUser.hasPremium &&
								!authenticatedUser.hasVerifiedBadge && (
									<div className="user-icon-container">
										<span className="medium-icon icon-premium-medium" />
										<span className="small-icon icon-premium-small" />
									</div>
								)}
							{includeBadges && authenticatedUser.hasVerifiedBadge && (
								<VerifiedBadge />
							)}
						</h1>
					</div>
					{preferredNameType === "both" && (
						<div className="user-name-container text">
							@{authenticatedUser.username}
						</div>
					)}
					{isEasterEggTextEnabled && easterEggText && (
						<p className="easter-egg-text">{easterEggText}</p>
					)}
				</div>
			</div>
		</div>
	);
}
