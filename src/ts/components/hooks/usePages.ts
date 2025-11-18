import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import useDidMountEffect from "./useDidMountEffect";
import useItemPipeline from "./useItemPipeline";
import usePagedFetch, { type FetchResult } from "./usePagedFetch";

/**
 * Configuration for paging behavior
 */
export type PagingConfig =
	| { method: "pagination"; itemsPerPage: number }
	| { method: "loadMore"; initialCount: number; incrementCount: number }
	| { method: "infinite" };

/**
 * Dependency arrays for different reset behaviors
 */
export type ProcessingDependencies = {
	/** Dependencies that trigger reprocessing only */
	processingDeps?: readonly unknown[];
	/** Dependencies that trigger refetch from page 1 */
	fetchDeps?: readonly unknown[];
	/** Dependencies that trigger full reset (clear cache, reset pagination) */
	resetDeps?: readonly unknown[];
};

export interface UsePagesResult<T, U> {
	readonly items: U[];
	readonly loading: boolean;
	readonly fetchingMore: boolean;
	readonly processing: boolean;
	readonly error: unknown;
	readonly page: number;
	readonly totalPages: number;
	readonly hasMore: boolean;
	readonly setPage: (newPage: number) => void;
	readonly loadMore: () => void;
	readonly loadAll: () => Promise<void>;
	readonly reset: () => void;
	readonly refetch: () => void;
	readonly reprocess: () => void;
	readonly allItems: readonly T[];
	readonly processedItems: readonly U[];
	readonly filtersEnabled: boolean;
	readonly shouldBeDisabled: boolean;

	// Backward compatibility
	readonly pageNumber: number;
	readonly maxPageNumber: number;
	readonly hasAnyItems: boolean;
	readonly fetchedAllPages: boolean;
}

/**
 * Props for usePages hook
 *
 * Combines paged fetching with item processing pipeline and pagination controls
 */
export type UsePagesProps<T, U, Cursor> = {
	/** Function to fetch a page of data */
	fetchPage: (cursor?: Cursor, signal?: AbortSignal) => Promise<FetchResult<T, Cursor>>;
	/** Processing pipeline (transform, sort, filter) */
	pipeline?: {
		/** Transform function applied to each item */
		transform?: (item: T, index: number, all: T[]) => U | Promise<U>;
		/** Sort function for final ordering */
		sort?: (items: U[]) => U[] | Promise<U[]>;
		/** Filter function to include/exclude items */
		filter?: (item: U, index: number, all: U[]) => boolean | Promise<boolean>;
	};
	/** Paging configuration */
	paging: PagingConfig;
	/** Dependency arrays for different reset behaviors */
	dependencies?: ProcessingDependencies;
	/** Automatically fetch more when filtered results are insufficient */
	autoFetchMore?: boolean;
	/** Stream results (show all items during pagination) */
	streamResults?: boolean;
	/** Disable all functionality */
	disabled?: boolean;
	/** Retry configuration for failed requests */
	retry?: { count: number; timeout: number };
};

export default function usePages<T, U = T, Cursor = string>({
	fetchPage,
	pipeline,
	paging,
	dependencies,
	autoFetchMore = true,
	streamResults = false,
	disabled,
	retry,
}: UsePagesProps<T, U, Cursor>): UsePagesResult<T, U> {
	const [page, setPage] = useState(1);

	// Fetch data from API
	const {
		allItems,
		hasMore,
		loading: fetchLoading,
		error: fetchError,
		fetchMore,
		refetch,
		reset: resetFetch,
	} = usePagedFetch({ fetchPage, disabled, retry });

	// Process items through transform/sort/filter pipeline
	const {
		processedItems,
		processing,
		error: processError,
		reprocess,
		clearCache,
	} = useItemPipeline({
		items: allItems,
		transform: pipeline?.transform,
		sort: pipeline?.sort,
		filter: pipeline?.filter,
		disabled,
	});

	// Track when additional pages are being fetched
	const [fetchingMore, setFetchingMore] = useState(false);
	// Track when initial load is complete
	const initialLoadCompleteRef = useRef(false);

	// Mark initial load as complete when first items arrive
	useEffect(() => {
		if (!fetchLoading && allItems.length > 0) {
			initialLoadCompleteRef.current = true;
		}
	}, [fetchLoading, allItems.length]);

	// Calculate visible items and total pages based on paging method
	const { items, totalPages } = useMemo(() => {
		let displayItems = processedItems;
		let total = 1;

		switch (paging.method) {
			case "pagination": {
				const start = (page - 1) * paging.itemsPerPage;
				const end = page * paging.itemsPerPage;
				displayItems = processedItems.slice(start, end);
				total = Math.ceil(processedItems.length / paging.itemsPerPage);
				// Account for potential next page
				if (hasMore && displayItems.length === paging.itemsPerPage) {
					total += 1;
				}
				break;
			}
			case "loadMore": {
				const end = (page - 1) * paging.incrementCount + paging.initialCount;
				displayItems = processedItems.slice(0, end);
				total =
					Math.ceil(
						(processedItems.length - paging.initialCount) / paging.incrementCount,
					) + 1;
				// Account for potential next page
				if (hasMore && displayItems.length === end) {
					total += 1;
				}
				break;
			}
			case "infinite":
				// Infinite mode always has at least one page, two if more available
				total = hasMore ? 2 : 1;
				break;
		}

		return { items: displayItems, totalPages: total };
	}, [processedItems, page, paging, hasMore]);

	// Automatically fetch more data when filtered results are insufficient
	useEffect(() => {
		if (!autoFetchMore || disabled || fetchLoading || fetchingMore || !hasMore) return;

		// Calculate target length based on current page and paging method
		const targetLength =
			paging.method === "pagination"
				? paging.itemsPerPage * page
				: paging.method === "loadMore"
					? paging.incrementCount * (page - 1) + paging.initialCount
					: null;

		// Fetch more if we don't have enough items to fill current page
		if (targetLength && processedItems.length < targetLength) {
			setFetchingMore(true);
			fetchMore().finally(() => setFetchingMore(false));
		}
	}, [
		processedItems.length,
		page,
		paging,
		hasMore,
		disabled,
		fetchLoading,
		fetchingMore,
		autoFetchMore,
		fetchMore,
	]);

	// Reprocess items when processing dependencies change
	useDidMountEffect(() => {
		reprocess();
	}, dependencies?.processingDeps ?? []);

	// Refetch from first page when fetch dependencies change
	useDidMountEffect(() => {
		setPage(1);
		refetch();
	}, dependencies?.fetchDeps ?? []);

	// Reset pagination, cache, and fetch from first page when reset dependencies change
	useDidMountEffect(() => {
		setPage(1);
		clearCache();
		resetFetch();
	}, dependencies?.resetDeps ?? []);

	const handleLoadMore = useCallback(() => {
		if (page < totalPages) setPage(page + 1);
	}, [page, totalPages]);

	// Load all available pages
	const handleLoadAll = useCallback(async () => {
		while (hasMore && !disabled) {
			await fetchMore();
		}
	}, [hasMore, disabled, fetchMore]);

	// Reset to initial state
	const handleReset = useCallback(() => {
		setPage(1);
		clearCache();
		resetFetch();
	}, [clearCache, resetFetch]);

	// Refetch from first page
	const handleRefetch = useCallback(() => {
		setPage(1);
		refetch();
	}, [refetch]);

	// Reprocess current items
	const handleReprocess = useCallback(() => {
		reprocess();
	}, [reprocess]);

	return {
		// Visible items (streamed or paginated)
		items: streamResults ? processedItems : items,

		// Loading states
		loading: fetchLoading && !initialLoadCompleteRef.current,
		fetchingMore,
		processing,
		// Combined error from fetch or processing
		error: fetchError || processError,

		// Pagination state
		page,
		totalPages,
		hasMore,

		// Action handlers
		setPage,
		loadMore: handleLoadMore,
		loadAll: handleLoadAll,
		reset: handleReset,
		refetch: handleRefetch,
		reprocess: handleReprocess,

		// Raw data access
		allItems,
		processedItems,

		// Utility flags
		filtersEnabled: initialLoadCompleteRef.current,
		shouldBeDisabled: fetchLoading && allItems.length === 0,

		// Backward compatibility
		pageNumber: page,
		maxPageNumber: totalPages,
		hasAnyItems: processedItems.length > 0,
		fetchedAllPages: !hasMore,
	};
}
