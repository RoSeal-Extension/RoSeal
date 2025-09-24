import type {
	ListedTestPilotProgram,
	ListedTestPilotProgramPlatform,
} from "src/ts/helpers/requests/services/account";
import { getPlaceLauncherData } from "src/ts/utils/context";

export async function isProgramSupportedOnDevice(program: ListedTestPilotProgram) {
	const placeLauncherData = await getPlaceLauncherData();
	let platform: ListedTestPilotProgramPlatform;

	switch (placeLauncherData?.osName) {
		case "Windows": {
			platform = "PROGRAM_PLATFORM_WINDOWS_PLAYER";
			break;
		}
		case "OSX": {
			platform = "PROGRAM_PLATFORM_MAC_PLAYER";
			break;
		}
		case "iOS": {
			platform = "PROGRAM_PLATFORM_IOS_APP";
			break;
		}
		case "Android":
		// Sober user support
		case "Unknown": {
			platform = "PROGRAM_PLATFORM_GOOGLE_ANDROID_APP";
			break;
		}

		default: {
			return false;
		}
	}

	return program.platforms.includes(platform);
}
