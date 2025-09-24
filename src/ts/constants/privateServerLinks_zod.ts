import z from "zod";
import { LINKCODE_LENGTH, MAX_SERVER_NAME_LENGTH } from "./privateServerLinks";

export const zPrivateServersFile = z.object({
	data: z
		.array(
			z.object({
				name: z.string().max(MAX_SERVER_NAME_LENGTH),
				updated: z.number(),
				ownerId: z.number().optional(),
				linkCode: z
					.string()
					.regex(/^\d{32}$/)
					.length(LINKCODE_LENGTH)
					.or(z.string().regex(/^[a-f0-9]{32}$/))
					.or(z.string().regex(/^[a-z0-9\-]{32}$/i)),
				linkCodeVariant: z.union([z.literal(1), z.literal(2)]).optional(),
			}),
		)
		.min(1),
	version: z.literal(1),
});
