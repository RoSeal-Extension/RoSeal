import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { sleep } from "src/ts/utils/misc";
import useCallbackSignal from "./useCallbackSignal";
import useDidMountEffect from "./useDidMountEffect";
import { chunk } from "src/ts/utils/objects";

/*
this wholeeee thing needs to be redone a thousand times.
please....

*/

export type PaginationMethodData = { method: "pagination"; itemsPerPage: number };
export type LoadMoreMethodData = {
	method: "loadMore";
	initialCount: number;
	incrementCount: number;
};
export type FullListMethodData = { method: "fullList" };
export type PagesPaging = (PaginationMethodData | LoadMoreMethodData | FullListMethodData) & {
	immediatelyLoadAllData?: boolean;
};
export type PagesItems<T, U = T> = {
	replacementItems?: T[] | null;
	prefixItems?: T[] | null;
	suffixItems?: T[] | null;
	shouldAlwaysUpdate?: boolean;

	transformItem?: (item: T, index: number, arr: T[]) => MaybePromise<U>;
	transformItems?: (items: T[], arr: T[]) => MaybePromise<U[]>;
	filterItem?: (item: U, index: number, arr: U[]) => MaybePromise<boolean>;
	sortItems?: (items: U[]) => MaybePromise<U[]>;
};
export type PagesDependencies = {
	refreshPage?: unknown[];
	refreshToFirstPage?: unknown[];
	reset?: unknown[];
};

export type PagesRetry = {
	count: number;
	timeout: number;
};

export type UsePagesProps<T extends PageData<U, V, X>, U, V, X = U> = {
	paging: PagesPaging;
	items?: PagesItems<U, X>;
	dependencies?: PagesDependencies;
	disabled?: boolean;

	retry?: PagesRetry;
	getNextPage: (data: T) => MaybePromise<T>;
};

export type PageData<T, U, X = T> = {
	items: T[];
	transformedItems: Map<T, MaybePromise<X>>;
	pageNumber: number;
	prefixItems?: T[] | null;
	suffixItems?: T[] | null;
	nextCursor?: U;
	hasNextPage?: boolean;
};

export default function usePages<T, U, V = unknown, X = T>({
	paging,
	items: itemsConfig,
	dependencies,
	disabled,
	retry,
	getNextPage,
}: UsePagesProps<PageData<T, U, X>, T, U, X>) {
	const [error, setError] = useState<V>();
	const [displayItems, setDisplayItems] = useState<X[]>([]);
	const [hasAnyItems, setHasAnyItems] = useState(false);
	const [maxPageNumber, setMaxPageNumber] = useState<number>(1);

	const [loading, setLoading] = useState(true);
	const requestInProgress = useSignal(false);
	const [shouldBeDisabled, setShouldBeDisabled] = useState(true);

	const pageData = useSignal<PageData<T, U, X>>({
		items: [],
		transformedItems: new Map(),
		pageNumber: 1,
	});

	const updateQueued = useSignal(false);
	const refreshToStartQueued = useSignal(false);
	const resetNowQueued = useSignal(false);
	const loadAll = useSignal(false);
	const loadAllQueued = useSignal(false);

	const getItems = async (
		_items: X[],
		pageNumber?: number,
		prefixItems?: X[],
		suffixItems?: X[],
		includeSuffixItems = false,
	) => {
		let newArr = [..._items];
		if (prefixItems?.length) {
			newArr.unshift(...prefixItems);
		}
		if (suffixItems?.length && (!pageData.value.hasNextPage || includeSuffixItems)) {
			newArr.push(...suffixItems);
		}
		if (itemsConfig?.sortItems) {
			newArr = await itemsConfig.sortItems(newArr);
		}

		setHasAnyItems(newArr.length > 0);

		if (itemsConfig?.filterItem) {
			const results = await Promise.all(
				newArr.map((item, index, arr) => itemsConfig.filterItem!(item, index, arr)),
			);
			newArr = newArr.filter((_, i) => results[i]);
		}

		if (pageNumber) {
			switch (paging.method) {
				case "pagination": {
					const start = (pageNumber - 1) * paging.itemsPerPage;
					const end = pageNumber * paging.itemsPerPage;

					const newSlice = newArr.slice(start, end);
					setMaxPageNumber(
						Math.ceil(newArr.length / paging.itemsPerPage) +
							(pageData.value.hasNextPage && newSlice.length === paging.itemsPerPage
								? 1
								: 0),
					);
					newArr = newSlice;
					break;
				}
				case "loadMore": {
					const end = (pageNumber - 1) * paging.incrementCount + paging.initialCount;

					const newSlice = newArr.slice(0, end);
					setMaxPageNumber(
						Math.ceil(
							(newArr.length - paging.initialCount) / paging.incrementCount +
								(pageData.value.hasNextPage && newSlice.length === end ? 1 : 0),
						) + 1,
					);
					newArr = newSlice;
					break;
				}
			}
		}

		return newArr;
	};

	// Enhanced handleItems: includes transformation
	const handleItems = async (data: PageData<T, U, X>) => {
		if (disabled) return;

		requestInProgress.value = true;
		setLoading(true);
		try {
			const newItems =
				itemsConfig?.replacementItems === null
					? []
					: (itemsConfig?.replacementItems ?? data.items);

			const getTransformedItems = async (items: T[]) => {
				if (!itemsConfig?.transformItem && !itemsConfig?.transformItems) {
					return items as unknown as X[];
				}

				const newItems: MaybePromise<X>[] = [];

				for (const aChunk of chunk(items, 100)) {
					if (itemsConfig?.transformItems) {
						const uncachedItems: T[] = [];
						const uncachedIndices: number[] = [];
						const chunkResults: MaybePromise<X>[] = new Array(aChunk.length);

						// 1. Separate cached items from items that need transforming
						for (let i = 0; i < aChunk.length; i++) {
							const item = aChunk[i];
							const cached = data.transformedItems.get(item);

							if (cached) {
								chunkResults[i] = cached;
							} else {
								uncachedItems.push(item);
								uncachedIndices.push(i); // Track index to preserve order later
							}
						}

						// 2. Transform only the uncached items in bulk
						if (uncachedItems.length > 0) {
							const transformedData = await itemsConfig.transformItems(
								uncachedItems,
								items,
							);

							// 3. Update cache and place back into the chunk's results
							for (let i = 0; i < uncachedItems.length; i++) {
								const item = uncachedItems[i];
								const result = transformedData[i];

								data.transformedItems.set(item, result);
								chunkResults[uncachedIndices[i]] = result;
							}
						}

						newItems.push(...chunkResults);
					} else {
						const promises: Promise<void>[] = [];

						for (let i = 0; i < aChunk.length; i++) {
							const item = aChunk[i];

							const cached = data.transformedItems.get(item);
							if (cached) {
								newItems.push(cached);
								continue;
							}

							// Safe to use non-null assertion here because we verified
							// transformItem exists if transformItems doesn't.
							const promise = itemsConfig.transformItem!(item, i, aChunk);
							newItems.push(promise);

							data.transformedItems.set(item, promise);
							if (promise instanceof Promise) {
								promises.push(
									promise.then((promiseData) => {
										data.transformedItems.set(item, promiseData);
									}),
								);
							}
						}

						await Promise.all(promises);
					}
				}

				return Promise.all(newItems);
			};

			// Transform items here
			const transformedItems = await getTransformedItems(newItems);

			const prefixItemsTransformed = data.prefixItems?.length
				? await getTransformedItems(data.prefixItems)
				: undefined;

			const suffixItemsTransformed = data.suffixItems?.length
				? await getTransformedItems(data.suffixItems)
				: undefined;

			if (
				itemsConfig?.replacementItems === null ||
				data.prefixItems === null ||
				data.suffixItems === null
			) {
				setDisplayItems(
					await getItems(
						transformedItems,
						data.pageNumber,
						prefixItemsTransformed,
						suffixItemsTransformed,
						!data.hasNextPage,
					),
				);
				return;
			}

			if (itemsConfig?.replacementItems) {
				setDisplayItems(
					await getItems(
						transformedItems,
						data.pageNumber,
						prefixItemsTransformed,
						suffixItemsTransformed,
						!data.hasNextPage,
					),
				);
				requestInProgress.value = false;
				setLoading(false);
				return;
			}

			pageData.value = { ...data, items: newItems };
			let currPageData = { ...data, items: newItems };

			const targetLength =
				paging.method === "pagination"
					? paging.itemsPerPage * data.pageNumber
					: paging.method === "loadMore"
						? paging.incrementCount * (data.pageNumber - 1) + paging.initialCount
						: null;

			let retryCount = 0;
			while (
				currPageData.hasNextPage !== false &&
				(loadAll.value ||
					!targetLength ||
					(
						await getItems(
							transformedItems,
							undefined,
							prefixItemsTransformed,
							suffixItemsTransformed,
						)
					).length < targetLength ||
					paging.immediatelyLoadAllData) &&
				!updateQueued.value &&
				!refreshToStartQueued.value &&
				!resetNowQueued.value &&
				(!retry || retry.count >= retryCount)
			) {
				try {
					const nextPageData = await getNextPage(currPageData);

					const nextTransformedItems = await getTransformedItems(nextPageData.items);

					currPageData = {
						...nextPageData,
						items: [...currPageData.items, ...nextPageData.items],
					};
					transformedItems.push(...nextTransformedItems);
					if (itemsConfig?.shouldAlwaysUpdate) {
						pageData.value = currPageData;
						setDisplayItems(
							await getItems(
								transformedItems,
								currPageData.pageNumber,
								prefixItemsTransformed,
								suffixItemsTransformed,
							),
						);
					}

					if (retryCount) retryCount = 0;
				} catch (err) {
					if (!retry || retry.count === retryCount) throw err;

					retryCount++;
					await sleep(retry.timeout);
				}
			}

			pageData.value = currPageData;
			if (!updateQueued.value && !refreshToStartQueued.value && !resetNowQueued.value) {
				setDisplayItems(
					await getItems(
						transformedItems,
						currPageData.pageNumber,
						prefixItemsTransformed,
						suffixItemsTransformed,
					),
				);
			}
		} catch (err) {
			setError(err as V);
		} finally {
			if (
				!updateQueued.value &&
				!refreshToStartQueued.value &&
				!resetNowQueued.value &&
				itemsConfig?.replacementItems !== null &&
				itemsConfig?.prefixItems !== null &&
				itemsConfig?.suffixItems !== null
			) {
				setLoading(false);
			}

			if (!pageData.value.hasNextPage) {
				loadAll.value = false;
			}

			requestInProgress.value = false;
		}
	};

	// Initial load
	useEffect(() => {
		if (!requestInProgress.value) {
			handleItems({
				...pageData.value,
				pageNumber: 1,
				prefixItems: itemsConfig?.prefixItems,
				suffixItems: itemsConfig?.suffixItems,
			});
		} else {
			refreshToStartQueued.value = true;
		}
	}, [
		...(dependencies?.refreshToFirstPage ?? []),
		paging.method,
		paging.method === "pagination" && paging.itemsPerPage,
		paging.method === "loadMore" && paging.incrementCount,
		disabled,
	]);

	// Reset effect
	useDidMountEffect(() => {
		if (!requestInProgress.value) {
			handleItems({
				items: [],
				transformedItems: new Map(),
				pageNumber: 1,
				prefixItems: itemsConfig?.prefixItems,
				suffixItems: itemsConfig?.suffixItems,
			});
		} else {
			resetNowQueued.value = true;
		}
	}, [...(dependencies?.reset ?? [])]);

	// Refresh page effect
	useDidMountEffect(() => {
		if (!requestInProgress.value) {
			handleItems({
				...pageData.value,
				prefixItems: itemsConfig?.prefixItems,
				suffixItems: itemsConfig?.suffixItems,
			});
		} else {
			updateQueued.value = true;
		}
	}, [
		...(dependencies?.refreshPage ?? []),
		paging.method === "loadMore" && paging.initialCount,
		paging.method === "loadMore" && paging.incrementCount,
		paging.immediatelyLoadAllData,
		disabled,
	]);

	// Queue processing
	useEffect(() => {
		if (!requestInProgress.value) {
			const isUpdateQueued = updateQueued.value;
			const isRefreshToFirstPageQueued = refreshToStartQueued.value;

			const isResetQueued = resetNowQueued.value;
			const isLoadAllQueued = loadAllQueued.value;
			updateQueued.value = false;
			refreshToStartQueued.value = false;
			resetNowQueued.value = false;
			loadAllQueued.value = false;

			if (isResetQueued) {
				handleItems({
					items: [],
					transformedItems: new Map(),
					pageNumber: 1,
					prefixItems: itemsConfig?.prefixItems,
					suffixItems: itemsConfig?.suffixItems,
				});
			} else if (isRefreshToFirstPageQueued) {
				handleItems({
					...pageData.value,
					pageNumber: 1,
					prefixItems: itemsConfig?.prefixItems,
					suffixItems: itemsConfig?.suffixItems,
				});
			} else if (isUpdateQueued) {
				handleItems({
					...pageData.value,
					pageNumber: 1,
					prefixItems: itemsConfig?.prefixItems,
					suffixItems: itemsConfig?.suffixItems,
				});
			} else if (isLoadAllQueued) {
				loadAll.value = true;

				handleItems({
					...pageData.value,
				});
			}
		}
	}, [requestInProgress.value]);

	// Update shouldBeDisabled
	useEffect(() => {
		setShouldBeDisabled(loading && pageData.value.items.length === 0);
	}, [loading, pageData.value.pageNumber, pageData.value.items]);

	return {
		items: displayItems,
		pageNumber: pageData.value.pageNumber,
		loading,
		error,
		hasAnyItems,
		maxPageNumber,
		allItems: pageData.value.items,
		shouldBeDisabled,
		fetchedAllPages:
			Array.isArray(itemsConfig?.replacementItems) || pageData.value.hasNextPage === false,
		pageData,
		queueReset: useCallbackSignal(() => {
			if (
				!requestInProgress.value &&
				(pageData.value.pageNumber === 1 || paging.method === "loadMore")
			) {
				return handleItems({
					items: [],
					transformedItems: new Map(),
					pageNumber: 1,
					prefixItems: itemsConfig?.prefixItems,
					suffixItems: itemsConfig?.suffixItems,
				});
			}

			resetNowQueued.value = true;
		}, [requestInProgress.value]),
		removeItem: useCallbackSignal(
			(item: T) => {
				let targetValue = item;
				if (itemsConfig?.transformItem) {
					for (const [key, value] of pageData.value.transformedItems) {
						if (value === item) {
							targetValue = key;
							break;
						}
					}
				}

				handleItems({
					...pageData.value,
					items: pageData.value.items.filter((i) => i !== targetValue),
				});
			},
			[pageData.value],
		),
		reset: () => {
			if (!requestInProgress.value) {
				return handleItems({
					items: [],
					transformedItems: new Map(),
					pageNumber: 1,
					prefixItems: itemsConfig?.prefixItems,
					suffixItems: itemsConfig?.suffixItems,
				});
			}

			resetNowQueued.value = true;
		},
		setPageNumber: useCallbackSignal(
			(pageNumber: number) => {
				handleItems({
					...pageData.value,
					pageNumber,
				});
			},
			[pageData.value],
		),
		loadAllItems: useCallbackSignal(() => {
			if (!pageData.value.hasNextPage) return;

			if (!requestInProgress.value) {
				loadAll.value = true;

				handleItems({
					...pageData.value,
				});
			} else {
				loadAllQueued.value = true;
			}
		}, [requestInProgress.value, pageData.value, itemsConfig]),
	};
}
