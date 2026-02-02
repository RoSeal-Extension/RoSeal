import { useEffect, useState } from "preact/hooks";
import MarketplaceCartProvider from "../providers/ShoppingCartProvider";
import MarketplaceResultsContainer from "./Results.ts";

export default function MarketplaceLanding() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		let isPrevLanding = false;
		const parseUrl = () => {
			const searchParams = new URLSearchParams(window.location.search);
			if (searchParams.has("Landing")) {
				isPrevLanding = true;
				return;
			}

			const isActuallyOnLanding =
				isPrevLanding &&
				searchParams.size === 2 &&
				searchParams.get("taxonomy") === "tZsUsd2BqGViQrJ9Vs3Wah" &&
				searchParams.get("salesTypeFilter") === "1";

			setShow(isActuallyOnLanding);
			isPrevLanding = false;
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
