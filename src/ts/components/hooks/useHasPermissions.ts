import { useEffect, useState } from "preact/hooks";
import { currentPermissions, hasPermissions } from "src/ts/helpers/permissions";

export default function useHasPermissions(permissions: chrome.permissions.Permissions) {
	const [state, setState] = useState(false);
	useEffect(() => {
		if (currentPermissions.value instanceof Promise) {
			return;
		}

		hasPermissions(permissions).then(setState);
	}, [currentPermissions.value]);

	return state;
}
