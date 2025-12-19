import { useEffect, useState } from "preact/hooks";
import { modifyTitle, watch, watchOnce } from "src/ts/helpers/elements";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { httpClient } from "src/ts/helpers/requests/main";
import { REFERENCE_ICONS_REGEX } from "src/ts/utils/regex";
import { renderAppend } from "src/ts/utils/render";

function rulesForCSSText(styleContent: string) {
	const doc = document.implementation.createHTMLDocument("");
	const styleElement = document.createElement("style");

	styleElement.textContent = styleContent;
	// the style will only be parsed once it is added to a document
	doc.body.appendChild(styleElement);

	return styleElement.sheet?.cssRules;
}

function IconsReference() {
	const [icons, setIcons] = useState<string[]>([]);

	useEffect(() => {
		return watch<HTMLLinkElement>('link[rel="stylesheet"]', (style) => {
			if (!style.href) {
				return;
			}
			httpClient
				.httpRequest<string>({
					url: style.href,
					expect: "text",
				})
				.then((res) => {
					const rules = rulesForCSSText(res.body);
					if (rules) {
						const newIcons: string[] = [];
						for (const rule of rules) {
							if (rule instanceof CSSStyleRule) {
								const selectors = rule.selectorText.split(", ");
								for (const selector of selectors) {
									if (
										selector.startsWith(".icon-") &&
										!selector.includes(":") &&
										!selector.startsWith(".icon-text-wrapper")
									) {
										newIcons.push(selector);
									}
								}
							}
						}

						setIcons((icons) => [...new Set([...icons, ...newIcons])]);
					}
				});
		});
	}, []);

	return (
		<div className="icons-content section">
			<div className="container-header">
				<h1>{getMessage("iconsReference.title")}</h1>
			</div>
			<div className="section-content">
				<div className="icons-container">
					{icons.map((icon) => (
						<div className="icon-container border-bottom" key={icon}>
							<span
								className={`${icon.replaceAll(".", " ").trim()}`}
								ref={(ref) => {
									if (ref) {
										if (!ref.offsetHeight) {
											// we can assume that the icon is 100% width and 100% height, so we have to adjust!
											ref.style.setProperty("height", "100px");
											ref.style.setProperty("width", "100px");
										}
									}
								}}
							/>
							<span className="icon-name text">{icon}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default {
	id: "iconsReference",
	css: ["css/iconsReference.css"],
	isCustomPage: true,
	regex: [REFERENCE_ICONS_REGEX],
	featureIds: ["referencePages"],
	fn: () => {
		modifyTitle("Icons Reference");
		watchOnce(".content").then((content) => renderAppend(<IconsReference />, content));
	},
} satisfies Page;
