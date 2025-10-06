import {
	listAssetOwners,
	type ListedAssetOwnerInstance,
} from "src/ts/helpers/requests/services/assets";
import usePages from "../hooks/usePages";
import Loading from "../core/Loading";
import Pagination from "../core/Pagination";
import AssetOwnerItem from "./OwnerItem";
import { useState } from "preact/hooks";
import type { SortOrder } from "src/ts/helpers/requests/services/badges";
import Tooltip from "../core/Tooltip";
import classNames from "classnames";
import MdOutlineArrowDownward from "@material-symbols/svg-400/outlined/arrow_downward-fill.svg";
import MdOutlineArrowUpward from "@material-symbols/svg-400/outlined/arrow_upward-fill.svg";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Icon from "../core/Icon";

export type AssetOwnersListProps = {
	assetId: number;
	totalSerialNumbers: number;
	isLimited: boolean;
	isUGC: boolean;
	showCollapse?: boolean;
};

export default function AssetOwnersList({
	assetId,
	totalSerialNumbers,
	isUGC,
	isLimited,
	showCollapse,
}: AssetOwnersListProps) {
	const [collapsed, setCollapsed] = useState(true);
	const [sortOrder, setSortOrder] = useState<SortOrder>("Asc");

	const { items, loading, pageNumber, maxPageNumber, hasAnyItems, error, setPageNumber } =
		usePages<ListedAssetOwnerInstance, string>({
			getNextPage: (state) =>
				listAssetOwners({
					assetId,
					cursor: state.nextCursor,
					limit: 100,
					sortOrder,
				}).then((data) => ({
					...state,
					items: data.data,
					nextCursor: data.nextPageCursor ?? undefined,
					hasNextPage: !!data.nextPageCursor,
				})),
			paging: {
				method: "pagination",
				itemsPerPage: 10,
			},
			dependencies: {
				reset: [assetId, sortOrder],
			},
		});

	return (
		<div id="asset-owners">
			{showCollapse && (
				<div
					className={classNames("container-header", {
						"cursor-pointer": showCollapse,
					})}
					onClick={() => setCollapsed(!collapsed)}
				>
					<h2>{getMessage("avatarItem.owners.title")}</h2>
					<Icon name={collapsed ? "down" : "up"} size="16x16" />
				</div>
			)}
			{(!collapsed || !showCollapse) && (
				<div className="asset-owners-container section-content remove-panel resellers-container">
					{loading ? (
						<Loading />
					) : (
						<>
							<Tooltip
								includeContainerClassName={false}
								button={
									<button
										type="button"
										className={classNames(
											"btn-generic-more-sm sort-order-btn",
											{
												disabled: loading,
											},
										)}
										onClick={() => {
											setSortOrder(sortOrder === "Desc" ? "Asc" : "Desc");
										}}
									>
										{sortOrder === "Desc" ? (
											<MdOutlineArrowDownward className="roseal-icon" />
										) : (
											<MdOutlineArrowUpward className="roseal-icon" />
										)}
									</button>
								}
							>
								{getMessage(
									`avatarItem.owners.filters.sortOrder.${sortOrder.toLowerCase() as "asc" | "desc"}`,
								)}
							</Tooltip>
							{!hasAnyItems && !error && (
								<p className="section-content-off">
									{getMessage("avatarItem.owners.noItems")}
								</p>
							)}
							{error && (
								<p className="section-content-off">
									{getMessage("avatarItem.owners.error")}
								</p>
							)}
							<ul className="vlist">
								{items.map((item) => (
									<AssetOwnerItem
										key={item.collectibleItemInstanceId}
										{...item}
										totalSerialNumbers={totalSerialNumbers}
										isLimited={isLimited}
										isUGC={isUGC}
									/>
								))}
							</ul>
							{(maxPageNumber > 1 || pageNumber > 1) && (
								<Pagination
									current={pageNumber}
									hasNext={maxPageNumber > pageNumber}
									onChange={setPageNumber}
									disabled={loading}
								/>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
}
