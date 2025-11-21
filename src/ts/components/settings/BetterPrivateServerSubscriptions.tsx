import { RESTError } from "@roseal/http-client/src";
import classNames from "classnames";
import { useCallback, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	listUserPrivateServers,
	type PrivateServerInventoryItem,
} from "src/ts/helpers/requests/services/inventory";
import {
	updatePrivateServer,
	updatePrivateServerSubscription,
} from "src/ts/helpers/requests/services/privateServers";
import Loading from "../core/Loading";
import Pagination from "../core/Pagination";
import PillToggle from "../core/PillToggle";
import { warning } from "../core/systemFeedback/helpers/globalSystemFeedback";
import usePages from "../hooks/usePages";
import PrivateServerSubscriptionCard from "./PrivateServerSubscription";

const pillItems = [
	{
		id: "paid",
		label: "Paid",
	},
	{
		id: "free",
		label: "Free",
	},
];

export default function BetterPrivateServerSubscriptions() {
	const [activeSubscriptionOverrides, setActiveSubscriptionOverrides] = useState<
		Record<number, boolean>
	>({});
	const [isFreeView, setIsFreeView] = useState(false);
	const {
		items,
		hasAnyItems,
		loading,
		error,
		pageNumber,
		maxPageNumber,
		setPage: setPageNumber,
	} = usePages<PrivateServerInventoryItem, PrivateServerInventoryItem, string>({
		paging: {
			method: "pagination",
			itemsPerPage: 10,
		},
		pipeline: {
			filter: (item) => isFreeView === (item.priceInRobux === null),
		},
		fetchPage: (cursor) =>
			listUserPrivateServers({
				itemsPerPage: 50,
				privateServersTab: "MyPrivateServers",
				cursor,
			}).then((data) => ({
				items: data.data.filter((item) => item.active),
				nextCursor: data.nextPageCursor ?? undefined,
				hasMore: !!data.nextPageCursor,
			})),
		dependencies: {
			processingDeps: [isFreeView],
		},
	});

	const onPillToggle = useCallback((value: string) => setIsFreeView(value === "free"), []);
	const onCatch = useCallback((error: unknown) => {
		warning(
			(error instanceof RESTError && error.errors?.[0]?.userFacingMessage) ||
				getMessage("robloxSettings.privateServerSubscriptions.systemFeedback.error"),
		);
	}, []);

	return (
		<div id="private-server-subscriptions">
			<h3 className="subscription-count text-description">
				{getMessage("robloxSettings.privateServerSubscriptions.title")}
			</h3>
			<PillToggle
				className="free-paid-switch"
				items={pillItems}
				onClick={onPillToggle}
				currentId={isFreeView ? "free" : "paid"}
			/>
			{!hasAnyItems && (
				<div className="no-active">
					<span className="text-description">
						{getMessage(
							`robloxSettings.privateServerSubscriptions.${error ? "error" : "noItems"}`,
						)}
					</span>
				</div>
			)}
			{!hasAnyItems && loading && <Loading />}
			{hasAnyItems && (
				<div
					className={classNames("subscription-cards", {
						"roseal-disabled": loading,
					})}
				>
					{items.map((item) => {
						return (
							<PrivateServerSubscriptionCard
								key={item.privateServerId}
								{...item}
								active={
									activeSubscriptionOverrides[item.privateServerId] ??
									(item.priceInRobux === null ? item.active : item.willRenew)
								}
								setActive={(active) => {
									function onThen(): void {
										setActiveSubscriptionOverrides((value) => ({
											...value,
											[item.privateServerId]: active,
										}));
									}

									if (item.priceInRobux) {
										updatePrivateServerSubscription({
											active,
											privateServerId: item.privateServerId,
											price: item.priceInRobux,
										})
											.then(onThen)
											.catch(onCatch);
										return;
									}

									updatePrivateServer({
										active,
										privateServerId: item.privateServerId,
									})
										.then(onThen)
										.catch(onCatch);
								}}
							/>
						);
					})}
				</div>
			)}
			{(maxPageNumber > 1 || pageNumber > 1) && (
				<Pagination
					current={pageNumber}
					hasNext={maxPageNumber > pageNumber}
					onChange={setPageNumber}
					disabled={loading}
				/>
			)}
		</div>
	);
}
