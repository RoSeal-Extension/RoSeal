import { getBackendOptions, MultiBackend, Tree } from "@minoru/react-dnd-treeview";
import classNames from "classnames";
import { render } from "preact";
import { useState } from "preact/hooks";
import { DndProvider } from "react-dnd";
import MentionLinkify from "src/ts/components/core/MentionLinkify.tsx";
import { success } from "src/ts/components/core/systemFeedback/helpers/globalSystemFeedback.tsx";
import useProfileData from "src/ts/components/hooks/useProfileData.ts";
import { watchOnce } from "src/ts/helpers/elements.ts";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats.ts";
import type { Page } from "src/ts/helpers/pages/handleMainPages.ts";
import { getSealRainSeals, sealRain } from "src/ts/utils/fun/sealRain.tsx";
import { SEALS_REGEX } from "src/ts/utils/regex.ts";
import Button from "../../../components/core/Button.tsx";

function SealsDND() {
	const [treeData, setTreeData] = useState(() => [
		{
			id: 1,
			parent: 0,
			droppable: true,
			text: "Folder 1",
		},
		{
			id: 2,
			parent: 1,
			text: "Seal 1",
		},
		{
			id: 3,
			parent: 1,
			text: "Seal 2",
		},
		{
			id: 4,
			parent: 0,
			droppable: true,
			text: "Folder 2",
		},
		{
			id: 5,
			parent: 4,
			droppable: true,
			text: "Folder 3",
		},
		{
			id: 6,
			parent: 5,
			text: "Seal 3",
		},
		{
			id: 7,
			parent: 0,
			text: "Seal 4",
		},
	]);

	return (
		<DndProvider backend={MultiBackend} options={getBackendOptions()}>
			<Tree
				tree={treeData}
				rootId={0}
				// @ts-expect-error: Fine
				onDrop={setTreeData}
				render={(node, { depth, isOpen, onToggle }) => (
					<div style={{ marginLeft: depth * 10 }} onClick={onToggle}>
						{node.droppable && <span>{isOpen ? "[-]" : "[+]"}</span>}
						{node.text}
					</div>
				)}
			/>
		</DndProvider>
	);
}

function SealsPage() {
	const [mreowCount, setMreowCount] = useState(0);
	const user = useProfileData({
		userId: 1,
	});

	return (
		<div className="seals-page">
			<SealsDND />
			<MentionLinkify
				content={`Developer of the RoSeal Roblox extension. 🦭🦭🦭 

&#115;&#101;&#97;&#108;&#115; @juliaoverflow 

https://www.roblox.com/seals
https://www.roblox.com/no-seals
https://www.roblox.com/games/universe-redirect/13058
https://www.roblox.com/groups/1/RobloHunks
https://www.roblox.com/users/109176680/profile`}
			/>
			<h1>
				<Button
					onClick={() => {
						const seals = getSealRainSeals();
						success(`🦭 ${asLocaleString(seals)} seals obtained uwu 🦭`);

						sealRain(seals);
					}}
				>
					Click for seals {user?.names.combinedName}
				</Button>
				{"🦭seals🦭".repeat(500)}
				<br />
				<br />
				<div
					className={classNames("secret-mreow-section-container", {
						"has-mreow": mreowCount >= 1,
					})}
				>
					<div className="secret-mreow-section">
						<Button
							onClick={() => {
								setMreowCount(mreowCount + 1);
							}}
						>
							secret mreow butotn.....
						</Button>
						{new Array(mreowCount).fill(<div className="mreow">mreow</div>)}
					</div>
				</div>
			</h1>
		</div>
	);
}

export default {
	id: "seals",
	isCustomPage: true,
	regex: [SEALS_REGEX],
	featureIds: ["sealsPages"],
	css: ["css/seals.css"],
	fn: () => {
		watchOnce(".content").then((container) => render(<SealsPage />, container));
	},
} satisfies Page;
