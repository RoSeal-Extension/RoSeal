import MdOutlineTranslateFill from "@material-symbols/svg-400/outlined/translate-fill.svg";
import { tryOpenCloudAuthRequest } from "src/ts/utils/cloudAuth";
import usePromise from "../../hooks/usePromise";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import { getOpenCloudUser } from "src/ts/helpers/requests/services/users";
import { getSiteLocaleData } from "src/ts/utils/context";
import { languageNamesFormat } from "src/ts/helpers/i18n/intlFormats";
import { useMemo } from "preact/hooks";

export type UserProfileLocaleProps = {
	userId: number;
};

export default function UserProfileLocale({ userId }: UserProfileLocaleProps) {
	const [authenticatedUser] = useAuthenticatedUser();

	const [viewingUserLocale] = usePromise(
		() =>
			authenticatedUser &&
			tryOpenCloudAuthRequest(
				authenticatedUser.userId,
				authenticatedUser.isUnder13 === false,
				(authType, authCode) =>
					getOpenCloudUser({
						authType,
						authCode,
						userId,
					}).then((data) => data.locale),
			),
		[userId, authenticatedUser?.userId],
	);
	const [userLocale] = usePromise(
		() => getSiteLocaleData().then((data) => data?.languageCode),
		[],
	);

	const displayLanguage = useMemo(() => {
		if (!userLocale || !viewingUserLocale || userLocale === viewingUserLocale) return;

		const splitUserLocale = userLocale?.split("_")[0];
		const splitViewingUserLocale = viewingUserLocale?.split("_")[0];

		if (splitUserLocale === splitViewingUserLocale) {
			return languageNamesFormat.of(viewingUserLocale);
		}

		return languageNamesFormat.of(splitViewingUserLocale);
	}, [viewingUserLocale, userLocale]);

	if (!displayLanguage) return;

	return (
		<div className="user-locale-text">
			<div className="locale-icon-container">
				<MdOutlineTranslateFill className="roseal-icon" />
			</div>
			<div className="locale-name">{displayLanguage}</div>
		</div>
	);
}
