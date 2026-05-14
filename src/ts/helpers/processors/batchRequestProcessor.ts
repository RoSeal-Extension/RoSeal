export type RequestKey = string;

export type BatchRequestProcessorProps<T, U, V extends { fromCache?: boolean }, K> = {
	maxItemAttempts: number;
	maxRequestsPerBatch: number;

	getRequestKey: (item: Partial<T>) => RequestKey;
	transformResponse: (
		res: U,
		req: Record<RequestKey, K>,
	) => Record<RequestKey, ResponseItem<V> | null>;
	getRequestData: (items: RequestQueueItem<T, V>[]) => Record<RequestKey, K>;
	processRequest: (items: K[]) => Promise<U>;
};

export type RequestQueueItem<T, U> = {
	key: RequestKey;
	attempt: number;
	waiting: [resolve: (item: U) => void, reject: () => void][];
	value: T;
	refreshId?: number;
};

export type ResponseItem<T> = {
	retry: boolean;
	value: T;
};

export type RequestCacheItem<T> = {
	data: T;
	refreshId?: number;
};

export class BatchRequestProcessor<
	T extends { refreshId?: number },
	U,
	V extends { fromCache?: boolean },
	K,
> {
	protected cache = new Map<RequestKey, RequestCacheItem<V>>();
	protected queueMap = new Map<RequestKey, RequestQueueItem<T, V>>();
	protected changedListeners = new Map<RequestKey, Set<(value: V) => void>>();
	protected preparingNextRequestListeners = new Map<RequestKey, Set<() => void>>();

	protected started = false;
	protected processing = false;

	private _startRequest() {
		if (this.processing) {
			return;
		}

		this.processing = true;

		const queueItems = Array.from(this.queueMap.values());
		let startIndex = 0;

		const promises: Promise<void>[] = [];
		for (let i = 0; i < this.props.maxRequestsPerBatch; i++) {
			const queueData = queueItems.slice(startIndex);
			if (queueData.length === 0) {
				break;
			}

			const data = this.props.getRequestData(queueData);

			startIndex += Object.keys(data).length;

			promises.push(
				this.props
					.processRequest(Object.values(data))
					.then((res) => this.props.transformResponse(res, data))
					.then((res) => {
						for (const key in res) {
							const item = res[key];

							const queueItem = this.queueMap.get(key);
							if (!queueItem) {
								continue;
							}

							if (
								item &&
								(!item.retry || queueItem.attempt >= this.props.maxItemAttempts)
							) {
								for (const [resolve] of queueItem.waiting) {
									resolve(item.value);
								}

								this.cache.set(key, {
									data: item.value,
									refreshId: queueItem.refreshId,
								});
								this.queueMap.delete(key);

								const listeners = this.changedListeners.get(key);
								if (listeners) {
									for (const callback of listeners) {
										callback(item.value);
									}
								}
							} else {
								queueItem.attempt++;
							}
						}
					})
					.catch(() => {
						for (const key in data) {
							const queueItem = this.queueMap.get(key);
							if (!queueItem) {
								continue;
							}

							if (queueItem.attempt >= this.props.maxItemAttempts) {
								const previousValue = this.cache.get(key);
								for (const [resolve, reject] of queueItem.waiting) {
									if (previousValue !== undefined) {
										resolve(previousValue.data);
									} else {
										reject();
									}
								}

								this.queueMap.delete(key);
							} else {
								queueItem.attempt++;
							}
						}
					}),
			);
		}

		Promise.all(promises).finally(() => {
			this.processing = false;

			if (this.queueMap.size > 0) {
				queueMicrotask(() => this._startRequest());
			} else this.started = false;
		});
	}

	public isCached(item: T): boolean {
		const key = this.props.getRequestKey(item);

		return this.cache.has(key);
	}

	public updateItem(request: T, data: V): void {
		const key = this.props.getRequestKey(request);
		this.cache.set(key, {
			data,
			refreshId: request.refreshId,
		});

		const queueItem = this.queueMap.get(key);
		if (queueItem) {
			this.queueMap.delete(key);
			for (const [resolve] of queueItem.waiting) {
				resolve(data);
			}
		}
	}

	public getIfCached(request: T): V | undefined {
		const key = this.props.getRequestKey(request);
		if (this.cache.has(key)) {
			return {
				...this.cache.get(key)!.data,
				fromCache: true,
			};
		}

		return this.cache.get(key)?.data;
	}

	public invalidate(request: T) {
		const key = this.props.getRequestKey(request);
		this.cache.delete(key);
	}

	public request(request: T, overrideCache?: boolean): Promise<V & { fromCache?: boolean }> {
		return new Promise((resolve, reject) => {
			const key = this.props.getRequestKey(request);

			const previousValue = this.cache.get(key);
			if (
				previousValue &&
				!overrideCache &&
				(!request.refreshId ||
					(previousValue.refreshId && request.refreshId !== previousValue.refreshId))
			) {
				return resolve({
					...previousValue.data,
					fromCache: true,
				});
			}

			const queueItem = this.queueMap.get(key);
			if (queueItem) {
				queueItem.waiting.push([resolve, reject]);
			} else {
				const listeners = this.preparingNextRequestListeners.get(key);
				if (listeners) {
					for (const callback of listeners) {
						callback();
					}
				}

				const newQueueItem: RequestQueueItem<T, V> = {
					key,
					attempt: 1,
					waiting: [[resolve, reject]],
					value: request,
				};
				this.queueMap.set(key, newQueueItem);
			}

			if (!this.started) {
				this.started = true;

				queueMicrotask(() => this._startRequest());
			}
		});
	}

	public onPreparingNextRequest(request: T, callback: () => void) {
		const key = this.props.getRequestKey(request);

		let listeners = this.preparingNextRequestListeners.get(key);
		if (!listeners) {
			listeners = new Set();
			this.preparingNextRequestListeners.set(key, listeners);
		}
		listeners.add(callback);

		return () => {
			listeners?.delete(callback);
		};
	}

	public onChanged(request: T, callback: (value: V) => void) {
		const key = this.props.getRequestKey(request);

		let listeners = this.changedListeners.get(key);
		if (!listeners) {
			listeners = new Set();
			this.changedListeners.set(key, listeners);
		}
		listeners.add(callback);

		return () => {
			listeners?.delete(callback);
		};
	}

	public requestBatch<U extends string | number>(
		requests: (T & { requestId?: U; bypassCache?: boolean })[],
	): Promise<(V & { fromCache?: boolean })[]> {
		return Promise.all(
			requests.map((request) =>
				this.request(
					{
						...request,
						requestId: undefined,
					},
					request.bypassCache,
				).then((data) => ({
					...data,
					requestId: request.requestId,
				})),
			),
		);
	}

	constructor(protected readonly props: BatchRequestProcessorProps<T, U, V, K>) {}
}
