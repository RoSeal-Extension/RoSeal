import { UNIVERSES_SESSION_CACHE_STORAGE_KEY } from "../constants/misc";
import type { Agent } from "../helpers/requests/services/assets";
import { multigetDevelopUniversesByIds } from "../helpers/requests/services/universes";
import { getExtensionSessionStorage, setExtensionSessionStorage } from "../helpers/storage";
import type { StoredUniverseCache } from "../pages/main/www/all";
import { isExperienceBlocked } from "./blockedItems";

export async function checkExperiencesBlocked(universeIds: number[]): Promise<number[]> {
	const cachedData =
		(await getExtensionSessionStorage<StoredUniverseCache>(
			UNIVERSES_SESSION_CACHE_STORAGE_KEY,
		)) || [];

	const universeMap = new Map<number, [string, string | undefined, Agent, number]>(
		cachedData.map((universe) => [
			universe[0],
			universe.slice(1) as [string, string | undefined, Agent, number],
		]),
	);

	const cachedIds = new Set<number>(cachedData.map((universe) => universe[0]));

	const universeIdsToFetch = universeIds.filter((id) => !cachedIds.has(id));

	let universes: StoredUniverseCache = cachedData;
	if (universeIdsToFetch.length > 0) {
		const fetchedData = await multigetDevelopUniversesByIds({ ids: universeIdsToFetch });
		const newEntries = fetchedData.map(
			(item) =>
				[
					item.id,
					item.name,
					item.description ?? undefined,
					item.creatorType,
					item.creatorTargetId,
				] as const,
		) as StoredUniverseCache;

		for (const entry of newEntries) {
			universeMap.set(
				entry[0],
				entry.slice(1) as [string, string | undefined, Agent, number],
			);
		}

		universes = [...cachedData, ...newEntries];

		await setExtensionSessionStorage({
			[UNIVERSES_SESSION_CACHE_STORAGE_KEY]: universes.slice(-5_000),
		});
	}

	const blockedUniverseIds = universeIds.filter((id) => {
		const universeDetails = universeMap.get(id);
		if (!universeDetails) return false;

		const [name, description, creatorType, creatorTargetId] = universeDetails;
		return isExperienceBlocked(id, creatorType, creatorTargetId, name, description);
	});

	return blockedUniverseIds;
}
