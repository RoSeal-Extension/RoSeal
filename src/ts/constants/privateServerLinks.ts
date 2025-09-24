import type z from "zod";
import type { zPrivateServersFile } from "./privateServerLinks_zod";

export type PrivateServerLinksStorageValue = Record<
	string,
	Omit<z.infer<typeof zPrivateServersFile>, "version">
>;

export const PRIVATE_SERVER_LINKS_STORAGE_KEY = "privateServerLinks";

export const MATCH_LINKCODE_V0_REGEX = /\?privateserverlinkcode=([a-z0-9\-]{32})/i;
export const MATCH_LINKCODE_V1_REGEX = /\d{32}/;
export const MATCH_LINKCODE_V2_REGEX = /[a-f0-9]{32}/;

export const LINKCODE_LENGTH = 32;

export const MAX_SERVER_NAME_LENGTH = 25;

export type PrivateServerLinkData = z.infer<typeof zPrivateServersFile>["data"][number];
