// From Mizore, this was used in redux but we no longer use it. keeping for reference.

export type CreatedAction<T extends string, U extends string, V> = {
	type: T;
} & Record<U, V>;

export function makeActionCreator<T extends string, U extends string, V>(
	type: T,
	...argNames: U[]
): (...args: V[]) => CreatedAction<T, U, V> {
	return (...args) =>
		({
			type,
			...argNames.reduce(
				(allArgs, argName, argIdx) =>
					Object.assign(allArgs, {
						[argName]: args[argIdx],
					}),
				{},
			),
		}) as CreatedAction<T, U, V>;
}
