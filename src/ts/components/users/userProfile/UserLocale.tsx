import MdOutlineTranslateFill from "@material-symbols/svg-400/outlined/translate-fill.svg";
import usePromise from "../../hooks/usePromise";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import { getSiteLocaleData } from "src/ts/utils/context";
import { languageNamesFormat } from "src/ts/helpers/i18n/intlFormats";
import { useMemo } from "preact/hooks";

export type UserProfileLocaleProps = {
	userId: number;
	promise: Promise<string | undefined>;
};

export default function UserProfileLocale({ userId, promise }: UserProfileLocaleProps) {
	const [authenticatedUser] = useAuthenticatedUser();

	const [viewingUserLocale] = usePromise(() => promise, [userId, authenticatedUser?.userId]);
	const [userLocale] = usePromise(
		() => getSiteLocaleData().then((data) => data?.languageCode),
		[],
	);

	const displayLanguage = useMemo(() => {
		if (!userLocale || !viewingUserLocale || userLocale === viewingUserLocale) return;

		const splitUserLocale = userLocale?.split("_");
		const splitViewingUserLocale = viewingUserLocale?.split("_");

		if (splitUserLocale[0] === splitViewingUserLocale[0]) {
			try {
				return languageNamesFormat.of(splitViewingUserLocale.join("-"));
			} catch {
				return;
			}
		}

		return languageNamesFormat.of(splitViewingUserLocale[0]);
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
