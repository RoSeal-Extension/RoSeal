import { currentAuthenticatedUser } from "src/ts/pages/main-listeners/authenticatedUserUpdated";
import usePromise from "./usePromise";

export default function useAuthenticatedUser() {
	const [authenticatedUser, fetched] = usePromise(
		() => currentAuthenticatedUser.value,
		[currentAuthenticatedUser.value],
	);

	return [authenticatedUser, fetched] as const;
}
