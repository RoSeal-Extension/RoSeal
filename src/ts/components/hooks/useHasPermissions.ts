import { useEffect, useState } from "preact/hooks";
import { currentPermissions, hasPermissions } from "src/ts/helpers/permissions";

export default function useHasPermissions(
	permissions: chrome.permissions.Permissions,
	defaultValue?: boolean,
) {
	const [state, setState] = useState(defaultValue ?? false);
	useEffect(() => {
		if (currentPermissions.value instanceof Promise) {
			if (defaultValue !== undefined) {
				setState(defaultValue);
			}
			return;
		}

		hasPermissions(permissions).then(setState);
	}, [currentPermissions.value]);

	return state;
}
