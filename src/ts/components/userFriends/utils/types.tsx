import MdOutlineNewLabelFilled from "@material-symbols/svg-400/outlined/new_label-fill.svg";
import MdOutlineNewLabel from "@material-symbols/svg-400/outlined/new_label.svg";
import { DEFAULT_NONE_CONNECTION_TYPE, type ConnectionType } from "src/ts/constants/friends";
import { getMessage, hasMessage } from "src/ts/helpers/i18n/getMessage";
import { CONNECTION_TYPE_ICONS } from "../../icons";

export function getConnectionTypeDisplayName(connectionType: ConnectionType) {
	if (connectionType.type === "custom") {
		return connectionType.name;
	}

	const message = `friends.types.defaultTypes.${connectionType.name}.label`;
	if (hasMessage(message)) return getMessage(message);

	return connectionType.name;
}

export function getConnectionTypeDisplayDescription(connectionType: ConnectionType) {
	if (connectionType.type === "custom") {
		return connectionType.description;
	}

	const message = `friends.types.defaultTypes.${connectionType.name}.description`;
	if (hasMessage(message)) return getMessage(message);

	return connectionType.description;
}

export function getConnectionTypeIcon(connectionType: ConnectionType, includeHover = false) {
	const Icon = connectionType.iconName && CONNECTION_TYPE_ICONS[connectionType.iconName];

	if (Icon) {
		if (includeHover)
			return (
				<>
					<Icon.regular className="roseal-icon regular-icon" />
					<Icon.filled className="roseal-icon hover-icon" />
				</>
			);

		return <Icon.regular className="roseal-icon regular-icon" />;
	}

	if (connectionType.id === DEFAULT_NONE_CONNECTION_TYPE.id) {
		if (includeHover)
			return (
				<>
					<MdOutlineNewLabel className="roseal-icon regular-icon" />
					<MdOutlineNewLabelFilled className="roseal-icon hover-icon" />
				</>
			);

		return <MdOutlineNewLabel className="roseal-icon regular-icon" />;
	}

	if (connectionType.emojiText) {
		return connectionType.emojiText;
	}
}
