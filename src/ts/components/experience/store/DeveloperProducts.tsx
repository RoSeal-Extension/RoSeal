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
import Icon from "../../core/Icon";
import Loading from "../../core/Loading";
import Pagination from "../../core/Pagination";
import TextInput from "../../core/TextInput";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePages from "../../hooks/usePages";
import usePromise from "../../hooks/usePromise";
import DeveloperProduct, { type DeveloperProductPropsDetails } from "./DeveloperProduct";
import FiltersContainer from "../../core/filters/FiltersContainer";

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
				<div className="store-item-filters">
					<div className="input-group with-search-bar store-search-filter">
						<TextInput
							className="store-search-input"
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
					<FiltersContainer
						filters={[
							{
								id: "pregameSale",
								type: "dropdown",
								options: [
									{
										label: getMessage(
											"experience.developerProducts.filtering.pregameSaleStatus.values.all",
										),
										value: true,
									},
									{
										label: getMessage(
											"experience.developerProducts.filtering.pregameSaleStatus.values.external",
										),
										value: false,
									},
								],
								title: getMessage(
									"experience.developerProducts.filtering.pregameSaleStatus.label",
								),
								previewTitle: filters.pregameSaleDisabled
									? getMessage(
											"experience.developerProducts.filtering.pregameSaleStatus.values.all",
										)
									: getMessage(
											"experience.developerProducts.filtering.pregameSaleStatus.values.external",
										),
								value: filters.pregameSaleDisabled,
								defaultValue: offSaleDefault,
							},
							{
								id: "saleStatus",
								type: "checkbox",
								options: [
									{
										label: getMessage(
											"experience.developerProducts.filtering.saleStatus.values.onSale",
										),
										value: true,
									},
									{
										label: getMessage(
											"experience.developerProducts.filtering.saleStatus.values.offSale",
										),
										value: false,
									},
								],
								title: getMessage(
									"experience.developerProducts.filtering.saleStatus.label",
								),
								previewTitle: filters.includeOnSale
									? filters.includeOffSale
										? getMessage(
												"experience.developerProducts.filtering.saleStatus.previewLabel.all",
											)
										: getMessage(
												"experience.developerProducts.filtering.saleStatus.values.onSale",
											)
									: filters.includeOffSale
										? getMessage(
												"experience.developerProducts.filtering.saleStatus.values.offSale",
											)
										: getMessage(
												"experience.developerProducts.filtering.saleStatus.previewLabel.none",
											),
								defaultValue: [true, false],
								value: filters.includeOnSale
									? filters.includeOffSale
										? [true, false]
										: [true]
									: filters.includeOffSale
										? [false]
										: [],
							},
							{
								id: "sortBy",
								type: "dropdown",
								options: SORT_BY_OPTIONS.map((option) => ({
									label: getMessage(
										`experience.developerProducts.filtering.sortBy.values.${option}`,
									),
									value: option,
								})),
								title: getMessage(
									"experience.developerProducts.filtering.sortBy.label",
								),
								previewTitle: getMessage(
									"experience.developerProducts.filtering.sortBy.previewLabel",
									{
										label: getMessage(
											`experience.developerProducts.filtering.sortBy.values.${filters.sortBy}`,
										),
									},
								),
								value: filters.sortBy,
								defaultValue: "created",
							},
							{
								id: "sortDirection",
								type: "dropdown",
								options: SORT_DIRECTION_OPTIONS.map((option) => ({
									label: getMessage(
										`experience.developerProducts.filtering.sortDirection.values.${option}`,
									),
									value: option,
								})),
								title: getMessage(
									"experience.developerProducts.filtering.sortDirection.label",
								),
								previewTitle: getMessage(
									"experience.developerProducts.filtering.sortDirection.previewLabel",
									{
										label: getMessage(
											`experience.developerProducts.filtering.sortDirection.values.${filters.sortDirection}`,
										),
									},
								),
								value: filters.sortDirection,
								defaultValue: "descending",
							},
						]}
						applyFilterValue={(id, value) => {
							if (id === "pregameSale") {
								setFilters({
									...filters,
									pregameSaleDisabled: value as boolean,
								});
							} else if (id === "sortBy") {
								setFilters({
									...filters,
									sortBy: value as (typeof SORT_BY_OPTIONS)[number],
								});
							} else if (id === "sortDirection") {
								setFilters({
									...filters,
									sortDirection: value as (typeof SORT_DIRECTION_OPTIONS)[number],
								});
							} else if (id === "saleStatus") {
								setFilters({
									...filters,
									includeOnSale: (value as boolean[]).includes(true),
									includeOffSale: (value as boolean[]).includes(false),
								});
							}
						}}
					/>
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
