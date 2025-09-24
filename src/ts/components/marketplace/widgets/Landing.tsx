import { useEffect, useState } from "preact/hooks";
import MarketplaceCartProvider from "../providers/ShoppingCartProvider";
import MarketplaceResultsContainer from "./Results.ts";

export default function MarketplaceLanding() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const parseUrl = () => {
			const searchParams = new URLSearchParams(window.location.search);
			const isLandingParam = searchParams.has("Landing");
			const isActuallyOnLanding =
				isLandingParam &&
				(searchParams.size === 1 ||
					(searchParams.size === 3 &&
						searchParams.get("Category") === "1" &&
						searchParams.get("salesTypeFilter") === "1"));

			setShow(isActuallyOnLanding);
			if (!isActuallyOnLanding && isLandingParam) {
				const newUrl = new URL(window.location.href);
				searchParams.delete("Landing");
				newUrl.search = searchParams.toString();

				window.history.replaceState(null, "", newUrl.toString());
			}
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
