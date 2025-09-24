import type { AnyExpandedItem } from "src/ts/constants/groupOrganization";
import { unitListFormat } from "src/ts/helpers/i18n/intlFormats";

export function getFolderName(name: string | undefined, dndId: string, items: AnyExpandedItem[]) {
	if (name) {
		return name;
	}

	const names: string[] = [];
	for (const item of items) {
		if (item.parent === dndId) {
			names.push(item.group.name);
		}
	}

	return unitListFormat.format(names);
}
