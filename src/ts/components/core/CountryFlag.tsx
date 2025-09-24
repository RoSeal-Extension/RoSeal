import * as flags from "country-flag-icons/react/3x2";
import type { JSX } from "preact";

export type CountryFlagProps = OmitExtend<
	JSX.SVGAttributes<SVGElement>,
	{
		code: string;
	}
>;

export default function CountryFlag({ code, ...props }: CountryFlagProps) {
	// biome-ignore lint/performance/noDynamicNamespaceImportAccess: any country could pop up.... so no i will not consider tree shaking
	const Flag = code in flags ? flags[code as keyof typeof flags] : flags.GB;
	// @ts-expect-error: Fine
	return <Flag {...props} />;
}
