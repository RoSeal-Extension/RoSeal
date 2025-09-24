import type { JSX } from "preact";
import classNames from "classnames";
import { matchUrlRegex, formatUrl } from "../../utils/url.ts";
import processString, { type ProcessStringOption } from "src/ts/utils/processString.ts";

export type LinkifyProps = {
	content?: string | JSX.Element[] | null;
	render?: (url: URL, data?: unknown) => JSX.Element | void;
	className?: string;
};

export const linkifyStringFn: ProcessStringOption<LinkifyProps> = {
	fn: (_, result, data) => {
		const url = formatUrl(result[1]);
		if (!url) return result[1];

		if (data?.render) {
			const renderReturn = data.render(url, data);
			if (renderReturn) return renderReturn;
		}

		return (
			<a
				className={classNames("text-link", data?.className)}
				href={url.toString()}
				target="_blank"
				rel="noreferrer"
			>
				{result[1]}
			</a>
		);
	},
	regex: matchUrlRegex,
};

const processLinkifyString = processString<LinkifyProps>([linkifyStringFn]);

export default function Linkify(props: LinkifyProps) {
	if (!props.content) return <></>;

	return processLinkifyString(props.content, props) as JSX.Element;
}
