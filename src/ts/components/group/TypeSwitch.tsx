import { useState } from "preact/hooks";
import SimpleTabContainer from "../core/tab/Container.tsx";
import SimpleTabNavs from "../core/tab/Navs.tsx";
import SimpleTabNav from "../core/tab/SimpleNav.tsx";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";

export type GroupsTypeSwitchProps = {
	container: HTMLElement;
};

export default function GroupsTypeSwitch({ container }: GroupsTypeSwitchProps) {
	const [active, setActive] = useState<"joined" | "pending">("joined");

	return (
		<SimpleTabContainer className="groups-type-switch">
			<SimpleTabNavs>
				<SimpleTabNav
					link={false}
					id="joined"
					title={getMessage("group.typesSwitch.joined")}
					active={active === "joined"}
					onClick={() => {
						container.classList.remove("hide-joined-groups");
						container.classList.add("hide-pending-groups");

						setActive("joined");
					}}
				/>
				<SimpleTabNav
					link={false}
					id="pending"
					title={getMessage("group.typesSwitch.pending")}
					active={active === "pending"}
					onClick={() => {
						container.classList.add("hide-joined-groups");
						container.classList.remove("hide-pending-groups");

						setActive("pending");
					}}
				/>
			</SimpleTabNavs>
		</SimpleTabContainer>
	);
}
