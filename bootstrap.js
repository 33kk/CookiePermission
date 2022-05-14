const {
	CustomizableUI
} = Cu.import("resource:///modules/CustomizableUI.jsm", {});
const PermissionManager = Cc['@mozilla.org/permissionmanager;1'].getService(Ci.nsIPermissionManager);
const WindowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
const CookiePermission = Ci.nsICookiePermission;

const ID = "cookie-permission-button";
const LABEL = "Cookie Permission";
const TOOLTIP = "Manage cookie permission for the current site.";

const COOKIE_PERMISSION_VALUES = [
	CookiePermission.ACCESS_DEFAULT,
	CookiePermission.ACCESS_ALLOW,
	CookiePermission.ACCESS_SESSION,
	CookiePermission.ACCESS_DENY,
];

const COOKIE_PERMISSION_VALUE_LABELS = {
	[CookiePermission.ACCESS_DEFAULT]: "Default",
	[CookiePermission.ACCESS_ALLOW]: "Allow",
	[CookiePermission.ACCESS_SESSION]: "Session",
	[CookiePermission.ACCESS_DENY]: "Deny",
};

function createElement(document, tag, attrs) {
	const el = document.createXULElement(tag);
	for (const attr in attrs ?? []) {
		el.setAttribute(attr, attrs[attr]);
	}
	return el;
}

function getPrincipal() {
	const window = WindowMediator.getMostRecentBrowserWindow();
	return window.gBrowser.selectedBrowser.contentPrincipal;
}

function startup() {
	CustomizableUI.createWidget({
		id: ID,
		type: "custom",
		label: LABEL,
		tooltiptext: TOOLTIP,
		defaultArea: CustomizableUI.AREA_NAVBAR,
		onBuild(document) {
			const button = createElement(document, "toolbarbutton", {
				id: ID,
				type: "menu",
				label: LABEL,
				tooltiptext: TOOLTIP,
				class: "toolbarbutton-1 chromeclass-toolbar-additional",
				image: "chrome://browser/skin/controlcenter/3rdpartycookies.svg",
			});

			const popup = createElement(document, "menupopup");

			for (const pVal of COOKIE_PERMISSION_VALUES) {
				popup.appendChild(createElement(document, "menuitem", {
					label: COOKIE_PERMISSION_VALUE_LABELS[pVal],
					type: "radio",
					checked: false,
					value: pVal
				}));
			}

			button.addEventListener("popupshowing", ({
				target
			}) => {
				const current = PermissionManager.getAllForPrincipal(getPrincipal()).find(p => p.type === "cookie")?.capability || 0;

				for (const el of target.children) {
					el.setAttribute("checked", parseInt(el.value) === current);
				}
			});

			popup.addEventListener("command", ({
				target: {
					value
				}
			}) => {
				PermissionManager.addFromPrincipal(getPrincipal(), "cookie", parseInt(value));
			});

			button.addEventListener("click", _ => popup.openPopup())

			button.appendChild(popup);

			return button;
		}
	});
}

function shutdown() {
	CustomizableUI.destroyWidget(ID);
}
