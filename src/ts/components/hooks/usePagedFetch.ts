import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { isErrorLike } from "src/ts/utils/errors";
import { sleep } from "src/ts/utils/misc";

/**
 * Result from a paged fetch operation
 */
export type FetchResult<T, Cursor> = {
	/** Items returned in this page */
	items: readonly T[];
	/** Cursor for next page (undefined if no more pages) */
	nextCursor?: Cursor;
	/** Whether more pages are available */
	hasMore: boolean;
};

/**
 * Props for usePagedFetch hook
 *
 * Handles paginated data fetching with retry logic and abort control
 */
export type UsePagedFetchProps<T, Cursor> = {
	/** Function to fetch a page of data */
	fetchPage: (cursor?: Cursor, signal?: AbortSignal) => Promise<FetchResult<T, Cursor>>;
	/** Disable fetching */
	disabled?: boolean;
	/** Retry configuration for failed requests */
	retry?: { count: number; timeout: number };
};
export interface PagedFetchResult<T> {
	readonly allItems: readonly T[];
	readonly hasMore: boolean;
	readonly loading: boolean;
	readonly error: unknown;
	readonly fetchMore: () => Promise<void>;
	readonly refetch: () => Promise<void>;
	readonly reset: () => void;
}

export default function usePagedFetch<T, Cursor = string>({
	fetchPage,
	disabled,
	retry,
}: UsePagedFetchProps<T, Cursor>): PagedFetchResult<T> {
	const [allItems, setAllItems] = useState<readonly T[]>([]);
	const [cursor, setCursor] = useState<Cursor | undefined>();
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<unknown>();

	// Abort controller for canceling requests
	const abortControllerRef = useRef<AbortController>();
	// Prevent concurrent fetches
	const fetchingRef = useRef(false);

	// Execute fetch with retry logic
	const doFetch = useCallback(
		async (resetData: boolean) => {
			if (disabled || fetchingRef.current) return;

			// Cancel any ongoing request
			abortControllerRef.current?.abort();
			abortControllerRef.current = new AbortController();

			fetchingRef.current = true;
			setLoading(true);
			setError(undefined);

			try {
				const currentCursor = resetData ? undefined : cursor;
				let retryCount = 0;

				// Retry loop with exponential backoff
				while (true) {
					try {
						const result = await fetchPage(
							currentCursor,
							abortControllerRef.current.signal,
						);

						// Update state with new data
						setAllItems((prev) =>
							resetData ? result.items : [...prev, ...result.items],
						);
						setCursor(result.nextCursor);
						setHasMore(result.hasMore);
						break;
					} catch (err) {
						// Handle abort explicitly
						if (isErrorLike(error) && error.name === "AbortError") {
							return;
						}

						// Stop retrying if max attempts reached
						if (!retry || retryCount >= retry.count) {
							throw err;
						}

						retryCount++;
						await sleep(retry.timeout);
					}
				}
			} catch (err) {
				setError(err);
			} finally {
				setLoading(false);
				fetchingRef.current = false;
			}
		},
		[disabled, cursor, fetchPage, retry],
	);

	const fetchMore = useCallback(() => doFetch(false), [doFetch]);
	const refetch = useCallback(() => doFetch(true), [doFetch]);
	const reset = useCallback(() => {
		setAllItems([]);
		setCursor(undefined);
		setHasMore(true);
		setError(undefined);
		doFetch(true);
	}, [doFetch]);

	// Initial fetch on mount
	useEffect(() => {
		if (!disabled) {
			doFetch(true);
		}
	}, [disabled]);

	return {
		allItems,
		hasMore,
		loading,
		error,
		fetchMore,
		refetch,
		reset,
	};
}
