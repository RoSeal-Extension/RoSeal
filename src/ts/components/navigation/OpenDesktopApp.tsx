import { useEffect, useState } from "preact/hooks";
import currentUrl from "src/ts/utils/currentUrl";
import { deepLinksParser } from "src/ts/utils/deepLinks";
import Icon from "../core/Icon";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { NavigationFavoritesProps } from "./Favorites";
import LeftNavItem from "./LeftNavItem";

export default function NavigationDesktopApp({ useNewNav }: NavigationFavoritesProps) {
	const [url, setUrl] = useState<string>();

	useEffect(() => {
		let cancelled = false;
		deepLinksParser()
			.parseWebsiteLink(currentUrl.value.url.toString())
			.then((data) => {
				const protocolUrl = data?.toProtocolUrl();
				if (protocolUrl && !cancelled) {
					setUrl(protocolUrl);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [currentUrl.value]);

	if (!url) return null;

	if (useNewNav) {
		return (
			<LeftNavItem
				id="open-desktop-nav"
				href={url}
				iconComponent={<Icon name="default-logo-r" />}
			>
				{getMessage("navigation.desktopApp")}
			</LeftNavItem>
		);
	}

	return (
		<li>
			<a
				id="nav-desktop-app"
				target="_self"
				className="dynamic-overflow-container text-nav"
				href={url}
			>
				<div>
					<Icon name="default-logo-r" />
				</div>
				<span className="font-header-2 dynamic-ellipsis-item">
					{getMessage("navigation.desktopApp")}
				</span>
			</a>
		</li>
	);
}
