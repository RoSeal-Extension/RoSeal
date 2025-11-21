import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { chunk } from "src/ts/utils/objects";

/**
 * Props for useItemPipeline hook
 *
 * Processes items through optional transform, sort, and filter stages
 * with built-in caching and error handling
 */
export type UseItemPipelineProps<T, U> = {
	/** Array of items to process */
	items: readonly T[];
	/** Transform function applied to each item (cached) */
	transform?: (item: T, index: number, all: T[]) => U | Promise<U>;
	/** Sort function for final item ordering */
	sort?: (items: U[]) => U[] | Promise<U[]>;
	/** Filter function to include/exclude items */
	filter?: (item: U, index: number, all: U[]) => boolean | Promise<boolean>;
	/** Disable processing */
	disabled?: boolean;
};

export interface ItemPipelineResult<U> {
	readonly processedItems: U[];
	readonly processing: boolean;
	readonly error: unknown;
	readonly reprocess: () => Promise<void>;
	readonly clearCache: () => void;
}

export default function useItemPipeline<T, U = T>({
	items,
	transform,
	sort,
	filter,
	disabled,
}: UseItemPipelineProps<T, U>): ItemPipelineResult<U> {
	const [processedItems, setProcessedItems] = useState<U[]>([]);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<unknown>();

	// Cache transform results by input item
	const transformCacheRef = useRef(new Map<T, MaybePromise<U>>());

	// Process items through pipeline stages
	const processItems = useCallback(async () => {
		if (disabled) return;

		setProcessing(true);
		setError(undefined);

		try {
			// Transform with per-item caching and chunked processing
			let transformed: U[] = !transform ? (items as unknown as U[]) : await transformItems();

			// Apply sort if provided
			if (sort) transformed = await sort(transformed);

			// Apply filter if provided
			if (filter) {
				const filterResults = await Promise.all(
					transformed.map((item, index, arr) => filter(item, index, arr)),
				);
				transformed = transformed.filter((_, i) => filterResults[i]);
			}

			setProcessedItems(transformed);
		} catch (err) {
			setError(err);
		} finally {
			setProcessing(false);
		}

		// Transform items in chunks with caching
		async function transformItems() {
			if (!transform) return [];

			const promises: MaybePromise<U>[] = [];
			const chunkPromises: Promise<void>[] = [];

			// Process in 100-item chunks to prevent blocking
			for (const itemChunk of chunk(items, 100)) {
				for (let i = 0; i < itemChunk.length; i++) {
					const item = itemChunk[i];
					const cached = transformCacheRef.current.get(item);

					if (cached !== undefined) {
						promises.push(cached);
						continue;
					}

					const promise = transform(item, i, itemChunk);
					promises.push(promise);
					transformCacheRef.current.set(item, promise);

					// Update cache with resolved value
					if (promise instanceof Promise) {
						chunkPromises.push(
							promise.then((resolvedValue) => {
								transformCacheRef.current.set(item, resolvedValue);
							}),
						);
					}
				}

				await Promise.all(chunkPromises);
			}

			return Promise.all(promises);
		}
	}, [items, transform, sort, filter, disabled]);

	const clearCache = useCallback(() => {
		transformCacheRef.current.clear();
	}, []);

	// Re-process when dependencies change
	useEffect(() => {
		processItems();
	}, [processItems]);

	return {
		processedItems,
		processing,
		error,
		reprocess: processItems,
		clearCache,
	};
}
