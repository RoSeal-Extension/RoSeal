import { useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { sleep } from "src/ts/utils/misc";
import { chunk } from "src/ts/utils/objects";
import useCallbackSignal from "./useCallbackSignal";
import useDidMountEffect from "./useDidMountEffect";

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
	const [allItems, setAllItems] = useState<T[]>([]);
	const [hasAnyItems, setHasAnyItems] = useState(false);
	const [maxPageNumber, setMaxPageNumber] = useState<number>(1);

	const [loading, setLoading] = useState(true);
	const requestInProgress = useSignal(false);
	const [shouldBeDisabled, setShouldBeDisabled] = useState(true);

	// Use a ref to track the current call ID so stale async ops can be aborted
	const currentCallId = useRef(0);

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
		hasNextPage: boolean | undefined,
		pageNumber?: number,
		prefixItems?: X[],
		suffixItems?: X[],
		includeSuffixItems = false,
	) => {
		let newArr = [..._items];
		if (prefixItems?.length) {
			newArr.unshift(...prefixItems);
		}
		if (suffixItems?.length && (!hasNextPage || includeSuffixItems)) {
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
							(hasNextPage && newSlice.length === paging.itemsPerPage ? 1 : 0),
					);
					newArr = newSlice;
					break;
				}
				case "loadMore": {
					const end = (pageNumber - 1) * paging.incrementCount + paging.initialCount;

					const newSlice = newArr.slice(0, end);
					const extraPage = hasNextPage && newSlice.length === end ? 1 : 0;
					setMaxPageNumber(
						Math.ceil((newArr.length - paging.initialCount) / paging.incrementCount) +
							1 +
							extraPage,
					);
					newArr = newSlice;
					break;
				}
			}
		}

		return newArr;
	};

	const getAllItems = (items: T[], prefixItems?: T[] | null, suffixItems?: T[] | null) => {
		const combinedItems = [...items];

		if (prefixItems?.length) {
			combinedItems.unshift(...prefixItems);
		}

		if (suffixItems?.length) {
			combinedItems.push(...suffixItems);
		}

		return combinedItems;
	};

	const setAllItemsStable = (nextItems: T[]) => {
		setAllItems((prevItems) => {
			if (prevItems.length !== nextItems.length) {
				return nextItems;
			}

			for (let i = 0; i < prevItems.length; i++) {
				if (prevItems[i] !== nextItems[i]) {
					return nextItems;
				}
			}

			return prevItems;
		});
	};

	// Enhanced handleItems: includes transformation
	const handleItems = async (data: PageData<T, U, X>) => {
		if (disabled) return;

		// Stamp this call; if a newer call starts, this one will bail out
		const callId = ++currentCallId.current;
		const isStale = () => callId !== currentCallId.current;
		const isLocalRefresh = data.items.length > 0 && !loadAll.value;

		requestInProgress.value = true;
		if (!isLocalRefresh) {
			setLoading(true);
		}

		// Capture a local reference to the transformedItems map for this call
		const transformedItemsCache = data.transformedItems;

		try {
			const rawItems =
				itemsConfig?.replacementItems === null
					? []
					: (itemsConfig?.replacementItems ?? data.items);

			const getTransformedItems = async (items: T[]) => {
				if (!itemsConfig?.transformItem && !itemsConfig?.transformItems) {
					return items as unknown as X[];
				}

				const newItems: MaybePromise<X>[] = [];

				for (const aChunk of chunk(items, 100)) {
					if (isStale()) return [];

					if (itemsConfig?.transformItems) {
						const uncachedItems: T[] = [];
						const uncachedIndices: number[] = [];
						const chunkResults: MaybePromise<X>[] = new Array(aChunk.length);

						// 1. Separate cached items from items that need transforming
						for (let i = 0; i < aChunk.length; i++) {
							const item = aChunk[i];
							const cached = transformedItemsCache.get(item);

							if (cached !== undefined) {
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
							if (isStale()) return [];

							// 3. Update cache and place back into the chunk's results
							for (let i = 0; i < uncachedItems.length; i++) {
								const item = uncachedItems[i];
								const result = transformedData[i];

								transformedItemsCache.set(item, result);
								chunkResults[uncachedIndices[i]] = result;
							}
						}

						newItems.push(...chunkResults);
					} else {
						const promises: Promise<void>[] = [];

						for (let i = 0; i < aChunk.length; i++) {
							const item = aChunk[i];

							const cached = transformedItemsCache.get(item);
							if (cached !== undefined) {
								newItems.push(cached);
								continue;
							}

							// Safe to use non-null assertion here because we verified
							// transformItem exists if transformItems doesn't.
							const promise = itemsConfig.transformItem!(item, i, aChunk);
							newItems.push(promise);

							transformedItemsCache.set(item, promise);
							if (promise instanceof Promise) {
								promises.push(
									promise.then((promiseData) => {
										transformedItemsCache.set(item, promiseData);
									}),
								);
							}
						}

						await Promise.all(promises);
						if (isStale()) return [];
					}
				}

				return Promise.all(newItems);
			};

			// Transform items here
			const transformedItems = await getTransformedItems(rawItems);
			if (isStale()) return;

			const prefixItemsTransformed = data.prefixItems?.length
				? await getTransformedItems(data.prefixItems)
				: undefined;
			if (isStale()) return;

			const suffixItemsTransformed = data.suffixItems?.length
				? await getTransformedItems(data.suffixItems)
				: undefined;
			if (isStale()) return;

			if (
				itemsConfig?.replacementItems === null ||
				data.prefixItems === null ||
				data.suffixItems === null
			) {
				if (!isStale()) {
					pageData.value = {
						...data,
						items: [...rawItems],
						transformedItems: transformedItemsCache,
					};
					setAllItemsStable(getAllItems(rawItems, data.prefixItems, data.suffixItems));

					setDisplayItems(
						await getItems(
							transformedItems,
							data.hasNextPage,
							data.pageNumber,
							prefixItemsTransformed,
							suffixItemsTransformed,
							!data.hasNextPage,
						),
					);
				}
				return;
			}

			if (itemsConfig?.replacementItems) {
				if (!isStale()) {
					pageData.value = {
						...data,
						items: [...rawItems],
						transformedItems: transformedItemsCache,
					};
					setAllItemsStable(getAllItems(rawItems, data.prefixItems, data.suffixItems));

					setDisplayItems(
						await getItems(
							transformedItems,
							data.hasNextPage,
							data.pageNumber,
							prefixItemsTransformed,
							suffixItemsTransformed,
							!data.hasNextPage,
						),
					);
					requestInProgress.value = false;
					setLoading(false);
				}

				return;
			}

			// Build accumulated items, starting fresh from rawItems (not pageData.value.items)
			// to avoid duplicating entries across re-renders
			let currPageData: PageData<T, U, X> = {
				...data,
				items: [...rawItems],
				transformedItems: transformedItemsCache,
			};

			if (currPageData.items.length === 0) {
				currPageData = {
					...currPageData,
					nextCursor: undefined,
					hasNextPage: undefined,
				};
			}
			let accTransformedItems = [...transformedItems];

			pageData.value = currPageData;

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
							accTransformedItems,
							currPageData.hasNextPage,
							undefined,
							prefixItemsTransformed,
							suffixItemsTransformed,
						)
					).length < targetLength ||
					paging.immediatelyLoadAllData) &&
				!isStale() &&
				(!retry || retry.count >= retryCount)
			) {
				if (isStale()) break;

				try {
					const nextPageData = await getNextPage(currPageData);
					if (isStale()) break;

					const nextTransformedItems = await getTransformedItems(nextPageData.items);
					if (isStale()) break;

					// Only append new items — do NOT spread currPageData.items again
					currPageData = {
						...nextPageData,
						items: [...currPageData.items, ...nextPageData.items],
						transformedItems: transformedItemsCache,
					};
					accTransformedItems = [...accTransformedItems, ...nextTransformedItems];

					if (itemsConfig?.shouldAlwaysUpdate && !isStale()) {
						pageData.value = currPageData;
						setAllItemsStable(
							getAllItems(
								currPageData.items,
								currPageData.prefixItems,
								currPageData.suffixItems,
							),
						);
						setDisplayItems(
							await getItems(
								accTransformedItems,
								currPageData.hasNextPage,
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

			if (!isStale()) {
				pageData.value = currPageData;
				setAllItemsStable(
					getAllItems(
						currPageData.items,
						currPageData.prefixItems,
						currPageData.suffixItems,
					),
				);
				setDisplayItems(
					await getItems(
						accTransformedItems,
						currPageData.hasNextPage,
						currPageData.pageNumber,
						prefixItemsTransformed,
						suffixItemsTransformed,
					),
				);
			}
		} catch (err) {
			if (!isStale()) {
				setError(err as V);
			}
		} finally {
			// Only update UI state if this call is still the latest
			if (!isStale()) {
				if (
					itemsConfig?.replacementItems !== null &&
					itemsConfig?.prefixItems !== null &&
					itemsConfig?.suffixItems !== null
				) {
					setLoading(false);
				}

				if (pageData.value.hasNextPage === false) {
					loadAll.value = false;
				}

				requestInProgress.value = false;
			}
		}
	};

	const requestHandleItems = (
		data: PageData<T, U, X>,
		queuedAction: "update" | "refreshFirst" | "reset" = "update",
	) => {
		if (requestInProgress.value) {
			if (queuedAction === "reset") {
				// Interrupt for reset since it's destructive
				return handleItems(data);
			}
			if (queuedAction === "refreshFirst") {
				// Queue dep-change refreshes — shouldAlwaysUpdate handles progressive display
				// so the filter is visible as each batch loads without needing a new fetch.
				// Immediately interrupting here causes two concurrent requests for the same
				// initial cursor (e.g. feature flags resolving on the first render).
				refreshToStartQueued.value = true;
				return;
			}
			// "update" = user-triggered actions (setPageNumber, removeItem).
			// Interrupt current run so UI responds immediately.
			return handleItems(data);
		}

		return handleItems(data);
	};

	// Initial load / refresh to first page
	useEffect(() => {
		requestHandleItems(
			{
				...pageData.value,
				pageNumber: 1,
				prefixItems: itemsConfig?.prefixItems,
				suffixItems: itemsConfig?.suffixItems,
			},
			"refreshFirst",
		);
	}, [
		...(dependencies?.refreshToFirstPage ?? []),
		paging.method,
		paging.method === "pagination" && paging.itemsPerPage,
		paging.method === "loadMore" && paging.incrementCount,
		disabled,
	]);

	// Reset effect
	useDidMountEffect(() => {
		requestHandleItems(
			{
				items: [],
				transformedItems: new Map(),
				pageNumber: 1,
				prefixItems: itemsConfig?.prefixItems,
				suffixItems: itemsConfig?.suffixItems,
			},
			"reset",
		);
	}, [...(dependencies?.reset ?? [])]);

	// Refresh page effect
	useDidMountEffect(() => {
		requestHandleItems({
			...pageData.value,
			prefixItems: itemsConfig?.prefixItems,
			suffixItems: itemsConfig?.suffixItems,
		});
	}, [
		...(dependencies?.refreshPage ?? []),
		paging.method === "loadMore" && paging.initialCount,
		paging.method === "loadMore" && paging.incrementCount,
		paging.immediatelyLoadAllData,
		disabled,
	]);

	// Queue processing — only fires when a request finishes
	useEffect(() => {
		if (requestInProgress.value) return;

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
				prefixItems: itemsConfig?.prefixItems,
				suffixItems: itemsConfig?.suffixItems,
			});
		} else if (isLoadAllQueued) {
			loadAll.value = true;
			handleItems({ ...pageData.value });
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
		allItems,
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
				if (itemsConfig?.transformItem || itemsConfig?.transformItems) {
					for (const [key, value] of pageData.value.transformedItems) {
						if (value === item) {
							targetValue = key;
							break;
						}
					}
				}

				const matchesTarget = (value: T) => value === targetValue || value === item;
				const filterList = (arr?: T[] | null) =>
					arr == null ? arr : arr.filter((value) => !matchesTarget(value));

				const nextItems = pageData.value.items.filter((value) => !matchesTarget(value));
				const nextPrefixItems = filterList(pageData.value.prefixItems);
				const nextSuffixItems = filterList(pageData.value.suffixItems);

				const nextTransformedItems = new Map(pageData.value.transformedItems);
				for (const [key, value] of nextTransformedItems) {
					if (matchesTarget(key) || value === item) {
						nextTransformedItems.delete(key);
					}
				}

				const nextPageData: PageData<T, U, X> = {
					...pageData.value,
					items: nextItems,
					prefixItems: nextPrefixItems,
					suffixItems: nextSuffixItems,
					transformedItems: nextTransformedItems,
				};

				pageData.value = nextPageData;
				setAllItemsStable(getAllItems(nextItems, nextPrefixItems, nextSuffixItems));

				requestHandleItems(nextPageData);
			},
			[pageData.value],
		),
		reset: () => {
			loadAll.value = false;
			requestHandleItems(
				{
					items: [],
					transformedItems: new Map(),
					pageNumber: 1,
					prefixItems: itemsConfig?.prefixItems,
					suffixItems: itemsConfig?.suffixItems,
				},
				"reset",
			);
		},

		setPageNumber: useCallbackSignal(
			(pageNumber: number) => {
				requestHandleItems({
					...pageData.value,
					pageNumber,
				});
			},
			[pageData.value],
		),

		loadAllItems: useCallbackSignal(() => {
			if (pageData.value.hasNextPage === false) return;
			loadAll.value = true;

			if (!requestInProgress.value) {
				handleItems({ ...pageData.value });
			} else {
				loadAllQueued.value = true;
			}
		}, [requestInProgress.value, pageData.value, itemsConfig]),
	};
}
