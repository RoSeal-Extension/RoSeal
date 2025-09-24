import classNames from "classnames";
import { presenceTypes } from "src/ts/constants/presence";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { UniverseDetail } from "src/ts/helpers/requests/services/universes";
import type { UserPresence } from "src/ts/helpers/requests/services/users";
import Icon from "../Icon";
import { useMemo } from "preact/hooks";
import useFeatureValue from "../../hooks/useFeatureValue";

export type PresenceStatusIconProps = {
	presence: UserPresence;
	href?: string;
	universe?: UniverseDetail;
	linkClassName?: string;
};

export function PresenceStatusLabel({
	presence,
	href,
	universe,
	linkClassName,
}: PresenceStatusIconProps) {
	const presenceType = useMemo(
		() => presenceTypes.find((type) => type.typeId === presence.userPresenceType),
		[presence.userPresenceType],
	);

	const message = getMessage(`presence.${presenceType?.type ?? "Offline"}`);

	if (!presenceType || presenceType?.type === "Online" || presenceType?.type === "Offline") {
		return message;
	}

	if (presence.rootPlaceId) {
		return (
			<a href={href} className={linkClassName}>
				{presence.lastLocation || universe?.name}
			</a>
		);
	}

	return message;
}

export default function PresenceStatusIcon({
	presence,
	href,
	linkClassName,
}: PresenceStatusIconProps) {
	const presenceType = useMemo(
		() => presenceTypes.find((type) => type.typeId === presence.userPresenceType),
		[presence.userPresenceType],
	);

	const [showOfflineStatus] = useFeatureValue("showOfflineStatusIcon", false);

	if (!presenceType || (presenceType.type === "Offline" && !showOfflineStatus)) {
		return null;
	}

	const statusClassName = classNames("presence-status-label", linkClassName, {
		"roseal-offline-icon": presenceType.type === "Offline",
	});
	const statusTitle = presenceType.type !== "Offline" ? presence.lastLocation : undefined;

	if ("iconName" in presenceType) {
		return (
			<Icon
				as={href ? "a" : "span"}
				name={presenceType.iconName}
				className={statusClassName}
				href={href}
				title={statusTitle}
			/>
		);
	}

	return <span className={statusClassName} />;
}
