import classNames from "classnames";
import { useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleLowerCase, localeCompare } from "src/ts/helpers/i18n/intlFormats";
import {
	getDeveloperProductById,
	listPendingDeveloperProductTransactions,
	listStorePageDeveloperProducts,
	listUniverseDeveloperProducts,
	type PendingDeveloperProductTransaction,
} from "src/ts/helpers/requests/services/developerProducts";
import { crossSort } from "src/ts/utils/objects";
import CheckboxField from "../../core/CheckboxField";
import Dropdown from "../../core/Dropdown";
import DropdownLabel from "../../core/DropdownLabel";
import Icon from "../../core/Icon";
import Loading from "../../core/Loading";
import Pagination from "../../core/Pagination";
import TextInput from "../../core/TextInput";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePages from "../../hooks/usePages";
import usePromise from "../../hooks/usePromise";
import DeveloperProduct, { type DeveloperProductPropsDetails } from "./DeveloperProduct";

export type DeveloperProductsProps = {
	universeId: number;
	placeId: number;
	offSaleDefault: boolean;
};

type DeveloperProductsFilters = {
	includeOffSale: boolean;
	includeOnSale: boolean;
	pregameSaleDisabled: boolean;
	sortBy: (typeof SORT_BY_OPTIONS)[number];
	keyword?: string;
	sortDirection: (typeof SORT_DIRECTION_OPTIONS)[number];
};

const SORT_BY_OPTIONS = ["created", "updated", "pendingTransactions", "price", "name"] as const;
const SORT_DIRECTION_OPTIONS = ["descending", "ascending"] as const;

export default function DeveloperProducts({
	universeId,
	placeId,
	offSaleDefault,
}: DeveloperProductsProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [filters, setFilters] = useState<DeveloperProductsFilters>({
		includeOffSale: offSaleDefault,
		includeOnSale: true,
		pregameSaleDisabled: offSaleDefault,
		sortBy: "created",
		sortDirection: "descending",
	});

	const [storeFilteringEnabled] = useFeatureValue("experienceStoreFiltering", false);
	const { items, loading, pageNumber, maxPageNumber, hasAnyItems, error, setPageNumber } =
		usePages<DeveloperProductPropsDetails, string>({
			getNextPage: (state) => {
				if (filters.pregameSaleDisabled) {
					return listUniverseDeveloperProducts({
						universeId,
						limit: 400,
						cursor: state.nextCursor,
					}).then((allData) => ({
						...state,
						items: allData.developerProducts,
						nextCursor: allData.nextPageCursor ?? undefined,
						hasNextPage: !!allData.nextPageCursor,
					}));
				}

				return listStorePageDeveloperProducts({
					universeId,
					limit: 400,
					cursor: state.nextCursor,
				}).then((data) =>
					Promise.all(
						data.developerProducts.map((item) =>
							getDeveloperProductById({
								developerProductId: item.developerProductId,
							}).then((data) => ({
								...item,
								...data,
							})),
						),
					).then((allData) => ({
						...state,
						items: allData,
						nextCursor: data.nextPageCursor ?? undefined,
						hasNextPage: !!data.nextPageCursor,
					})),
				);
			},
			paging: {
				method: "pagination",
				immediatelyLoadAllData: true,
				itemsPerPage: 50,
			},
			items: {
				filterItem: (item) => {
					if (!storeFilteringEnabled) {
						return true;
					}

					return (
						(item.isForSale ? filters.includeOnSale : filters.includeOffSale) &&
						(!filters.keyword ||
							asLocaleLowerCase(item.displayName).includes(
								asLocaleLowerCase(filters.keyword),
							))
					);
				},
				sortItems: (items) =>
					crossSort(items, (a, b) => {
						const direction = filters.sortDirection === "descending" ? -1 : 1;
						switch (filters.sortBy) {
							case "created": {
								return (
									(new Date(a.created) > new Date(b.created) ? 1 : -1) * direction
								);
							}
							case "updated": {
								return (
									(new Date(a.updated) > new Date(b.updated) ? 1 : -1) * direction
								);
							}
							case "price": {
								return (
									((a.priceInRobux || 0) > (b.priceInRobux || 0) ? 1 : -1) *
									direction
								);
							}
							case "name": {
								return localeCompare(a.displayName, b.displayName) * direction;
							}
							case "pendingTransactions": {
								if (!pendingTransactions) {
									return 0;
								}
								const aTransactions: PendingDeveloperProductTransaction[] = [];
								const bTransactions: PendingDeveloperProductTransaction[] = [];

								for (const transaction of pendingTransactions) {
									for (const arg of transaction.actionArgs) {
										if (arg.key === "productId") {
											if (arg.value === a.productId?.toString()) {
												aTransactions.push(transaction);
											} else if (arg.value === b.productId?.toString()) {
												bTransactions.push(transaction);
											}

											break;
										}
									}
								}

								return (
									(aTransactions.length > bTransactions.length ? 1 : -1) *
									direction
								);
							}
						}
					}),
			},
			dependencies: {
				refreshPage: [
					filters.includeOffSale,
					filters.includeOnSale,
					filters.keyword,
					filters.sortBy,
					filters.sortDirection,
					storeFilteringEnabled,
				],
				reset: [universeId, filters.pregameSaleDisabled],
			},
		});

	const [pendingTransactions] = usePromise(() => {
		if (!authenticatedUser) {
			return;
		}

		return listPendingDeveloperProductTransactions({
			playerId: authenticatedUser.userId,
			placeId,
			locationType: "ExperienceDetailPage",
			status: "pending",
		});
	}, [authenticatedUser?.userId, placeId]);

	return (
		<div id="roseal-developer-products" className="container-list game-dev-store">
			{storeFilteringEnabled && (hasAnyItems || filters.pregameSaleDisabled === false) && (
				<div className="dev-products-filters store-item-filters">
					<div className="dev-product-filter pregame-sale-filter store-item-filter">
						<div className="filter-title">
							<span className="font-bold">
								{getMessage(
									"experience.developerProducts.filtering.pregameSale.label",
								)}
							</span>
						</div>
						<div className="filters-list">
							<Dropdown
								className="pregame-sale-enabled-dropdown"
								selectionItems={[
									{
										label: getMessage(
											"experience.developerProducts.filtering.pregameSale.disabled",
										),
										value: true,
									},
									{
										label: getMessage(
											"experience.developerProducts.filtering.pregameSale.enabled",
										),
										value: false,
									},
								]}
								selectedItemValue={filters.pregameSaleDisabled}
								onSelect={(value) => {
									setFilters({ ...filters, pregameSaleDisabled: value });
								}}
							/>
						</div>
					</div>
					<div className="dev-product-filter sort-by-filter store-item-filter">
						<div className="filter-title">
							<span className="font-bold">
								{getMessage("experience.developerProducts.filtering.sorting.label")}
							</span>
						</div>
						<div className="filters-list">
							<DropdownLabel
								label={getMessage(
									"experience.developerProducts.filtering.sorting.by.label",
								)}
								containerClassName="sort-by-dropdown"
							>
								<Dropdown
									selectionItems={SORT_BY_OPTIONS.map((item) => ({
										label: getMessage(
											`experience.developerProducts.filtering.sorting.by.${item}`,
										),
										value: item,
									}))}
									selectedItemValue={filters.sortBy}
									onSelect={(value) => {
										setFilters({ ...filters, sortBy: value });
									}}
								/>
							</DropdownLabel>
							<DropdownLabel
								label={getMessage(
									"experience.developerProducts.filtering.sorting.direction.label",
								)}
								containerClassName="sort-direction-dropdown"
							>
								<Dropdown
									selectionItems={SORT_DIRECTION_OPTIONS.map((item) => ({
										label: getMessage(
											`experience.developerProducts.filtering.sorting.direction.${item}`,
										),
										value: item,
									}))}
									selectedItemValue={filters.sortDirection}
									onSelect={(value) => {
										setFilters({ ...filters, sortDirection: value });
									}}
								/>
							</DropdownLabel>
						</div>
					</div>
					<div className="dev-product-filter sale-status-filter store-item-filter">
						<div className="filter-title">
							<span className="font-bold">
								{getMessage(
									"experience.developerProducts.filtering.saleStatus.label",
								)}
							</span>
						</div>
						<div className="filters-list">
							<CheckboxField
								className="onsale-checkbox"
								disabled={loading}
								checked={filters.includeOnSale}
								onChange={(value) => {
									setFilters({ ...filters, includeOnSale: value });
								}}
							>
								<label className="checkbox-label text-label">
									{getMessage(
										"experience.developerProducts.filtering.saleStatus.onSale",
									)}
								</label>
							</CheckboxField>
							<CheckboxField
								className="offsale-checkbox"
								disabled={loading}
								checked={filters.includeOffSale}
								onChange={(value) => {
									setFilters({ ...filters, includeOffSale: value });
								}}
							>
								<label className="checkbox-label text-label">
									{getMessage(
										"experience.developerProducts.filtering.saleStatus.offSale",
									)}
								</label>
							</CheckboxField>
						</div>
					</div>
					<div className="dev-product-filter keyword-filter store-item-filter">
						<label className="filter-title">
							<span className="font-bold">
								{getMessage("experience.developerProducts.filtering.keyword.label")}
							</span>
						</label>
						<div className="filters-list">
							<div className="input-group with-search-bar">
								<TextInput
									placeholder={getMessage(
										"experience.developerProducts.filtering.keyword.placeholder",
									)}
									value={filters.keyword}
									onType={(value) => {
										setFilters({ ...filters, keyword: value });
									}}
								/>
								<div className="input-group-btn">
									<button className="input-addon-btn" type="button">
										<Icon name="search" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
			<ul
				className={classNames("hlist store-cards roseal-store-cards", {
					"roseal-disabled": loading,
				})}
			>
				{!error &&
					items.map((product) => (
						<li className="list-item" key={product.developerProductId}>
							<DeveloperProduct
								{...product}
								pendingTransactions={pendingTransactions?.filter((item) =>
									item.actionArgs.some(
										(item) =>
											item.key === "productId" &&
											item.value === product.productId?.toString(),
									),
								)}
							/>
						</li>
					))}
				{loading && !hasAnyItems && !error && (
					<li className="list-item">
						<Loading />
					</li>
				)}
			</ul>
			{error && (
				<p className="section-content-off">
					{getMessage("experience.developerProducts.error")}
				</p>
			)}
			{!loading && !hasAnyItems && !error && filters.pregameSaleDisabled && (
				<p className="section-content-off">
					{getMessage("experience.developerProducts.noItems")}
				</p>
			)}
			{!loading &&
				((hasAnyItems && items.length === 0) ||
					(!hasAnyItems && !filters.pregameSaleDisabled)) && (
					<p className="section-content-off">
						{getMessage("experience.developerProducts.noFilteredItems")}
					</p>
				)}
			{(maxPageNumber > 1 || pageNumber > 1) && (
				<Pagination
					current={pageNumber}
					hasNext={maxPageNumber > pageNumber}
					onChange={(current) => {
						setPageNumber(current);
					}}
					disabled={loading}
				/>
			)}
		</div>
	);
}
