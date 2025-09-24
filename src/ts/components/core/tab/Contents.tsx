import type { ComponentChildren } from "preact";

export type TabContentsProps = {
	children?: ComponentChildren;
};

export default function TabContents({ children }: TabContentsProps) {
	return <div className="tab-content rbx-tab-content">{children}</div>;
}
