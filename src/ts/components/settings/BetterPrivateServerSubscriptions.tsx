import {
	updatePrivateServer,
	updatePrivateServerSubscription,
} from "src/ts/helpers/requests/services/privateServers";
import {
	type PrivateServerInventoryItem,
	listUserPrivateServers,
} from "src/ts/helpers/requests/services/inventory";
import usePages from "../hooks/usePages";
import Pagination from "../core/Pagination";
import classNames from "classnames";
import PrivateServerSubscriptionCard from "./PrivateServerSubscription";
import { useCallback, useMemo, useState } from "preact/hooks";
import PillToggle from "../core/PillToggle";
import { warning } from "../core/systemFeedback/helpers/globalSystemFeedback";
import Loading from "../core/Loading";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { RESTError } from "src/ts/helpers/requests/main";

export default function BetterPrivateServerSubscriptions() {
	const [activeSubscriptionOverrides, setActiveSubscriptionOverides] = useState<
		Record<number, boolean>
	>({});
	const [isFreeView, setIsFreeView] = useState(false);
	const { items, hasAnyItems, loading, error, pageNumber, maxPageNumber, setPageNumber } =
		usePages<PrivateServerInventoryItem, string>({
			paging: {
				method: "pagination",
				itemsPerPage: 10,
			},
			items: {
				filterItem: (item) => isFreeView === (item.priceInRobux === null),
			},
			getNextPage: (state) =>
				listUserPrivateServers({
					itemsPerPage: 50,
					privateServersTab: "MyPrivateServers",
					cursor: state.nextCursor,
				}).then((data) => ({
					...state,
					items: data.data.filter((item) => item.active),
					nextCursor: data.nextPageCursor ?? undefined,
					hasNextPage: !!data.nextPageCursor,
				})),
			dependencies: {
				refreshToFirstPage: [isFreeView],
			},
		});

	const pillItems = useMemo(
		() => [
			{
				id: "paid",
				label: "Paid",
			},
			{
				id: "free",
				label: "Free",
			},
		],
		[],
	);

	const onPillToggle = useCallback((value: string) => setIsFreeView(value === "free"), []);

	return (
		<div id="private-server-subscriptions">
			<h3 className="subscription-count text-description">Private Server Subscriptions</h3>
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
					{items.map((item) => (
						<PrivateServerSubscriptionCard
							key={item.privateServerId}
							{...item}
							active={
								activeSubscriptionOverrides[item.privateServerId] ??
								(item.priceInRobux === null ? item.active : item.willRenew)
							}
							setActive={(active) => {
								(item.priceInRobux
									? updatePrivateServerSubscription({
											active,
											privateServerId: item.privateServerId,
											price: item.priceInRobux,
										})
									: updatePrivateServer({
											active,
											privateServerId: item.privateServerId,
										})
								)
									.then(() =>
										setActiveSubscriptionOverides((value) => ({
											...value,
											[item.privateServerId]: active,
										})),
									)
									.catch((err) =>
										warning(
											(err instanceof RESTError &&
												err.errors?.[0]?.userFacingMessage) ||
												getMessage(
													"robloxSettings.privateServerSubscriptions.systemFeedback.error",
												),
										),
									);
							}}
						/>
					))}
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
