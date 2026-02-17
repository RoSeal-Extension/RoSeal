import { useEffect, useState } from "preact/hooks";
import MarketplaceCartProvider from "../providers/ShoppingCartProvider";
import MarketplaceResultsContainer from "./Results";

export default function MarketplaceLanding() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		let isPrevLanding = false;
		const parseUrl = () => {
			const searchParams = new URLSearchParams(window.location.search);
			const hasLandingParam = searchParams.has("Landing");

			const currentLanding =
				isPrevLanding &&
				searchParams.size === 2 &&
				searchParams.get("taxonomy") === "tZsUsd2BqGViQrJ9Vs3Wah" &&
				searchParams.get("salesTypeFilter") === "1";

			if (!hasLandingParam && currentLanding) {
				const newUrl = new URL(window.location.href);
				searchParams.set("Landing", "true");
				newUrl.search = searchParams.toString();

				window.history.replaceState(null, "", newUrl.toString());
			}

			const isActuallyOnLanding = hasLandingParam || currentLanding;

			setShow(isActuallyOnLanding);
			isPrevLanding = hasLandingParam;
		};
		parseUrl();

		let currentUrl = window.location.href;
		const checkUrl = setInterval(() => {
			if (window.location.href === currentUrl) return;

			currentUrl = window.location.href;
			parseUrl();
		}, 500);

		return () => clearInterval(checkUrl);
	}, []);

	if (!show) return null;

	return (
		<MarketplaceCartProvider>
			<MarketplaceResultsContainer tabs={["catalog-tab:all", "catalog-tab:accessories"]} />
		</MarketplaceCartProvider>
	);
}
