/**
 * Plan mode for pi — Claude Code style.
 *
 * Shift+Tab toggles between Plan (read-only) and Edit (default) mode.
 * Plan mode removes the write tools from the active tool set, so the model
 * cannot modify files, and blocks write-looking bash commands as well.
 *
 * State is intentionally derived from the active tool set, so the footer and
 * any other extension see the same truth: no "edit" tool means Plan mode.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const WRITE_TOOLS = new Set(["edit", "write"]);
const MARKER = "pi-plan-mode";

/** Commands that can write, delete, or move files, or mutate repositories. */
const DANGEROUS_PATTERNS: RegExp[] = [
	/(^|\s)(rm|rmdir|unlink|shred)\s/i,
	/(^|\s)(mv|cp|ln|install)\s/i,
	/(^|\s)(mkdir|touch|chmod|chown|truncate|dd)\s/i,
	/(^|\s)tee(\s|$)/i,
	/(^|[^<])>(?!>)/,
	/>>/,
	/(^|\s)(sudo|doas|kill|pkill|killall)\s/i,
	/(^|\s)(vim?|nano|emacs|code|subl|micro)\s/i,
	/(^|\s)(npm|pnpm|yarn)\s+(install|i|add|remove|rm|uninstall|update|upgrade|publish|link|ci)\b/i,
	/(^|\s)pip[3]?\s+(install|uninstall)\b/i,
	/(^|\s)git\s+(add|commit|push|pull|merge|rebase|reset|checkout|switch|restore|stash|clean|tag|init|clone|rm|mv|apply|am|cherry-pick|revert)\b/i,
	/(^|\s)(brew|apt|apt-get|yum|dnf|pacman)\s+(install|remove|upgrade|update)\b/i,
];

function isReadOnlyCommand(command: string): boolean {
	const normalized = command.replace(/\s+/g, " ").trim();
	if (!normalized) return true;
	return !DANGEROUS_PATTERNS.some((pattern) => pattern.test(normalized));
}

export default function planModeExtension(pi: ExtensionAPI): void {
	let toolsBeforePlan: string[] | undefined;
	// Derive the initial state from the tool set so /reload cannot desync it.
	let planEnabled = !pi.getActiveTools().includes("edit");

	function enablePlanTools(): void {
		if (toolsBeforePlan === undefined) toolsBeforePlan = pi.getActiveTools();
		pi.setActiveTools(toolsBeforePlan.filter((name) => !WRITE_TOOLS.has(name)));
	}

	function restoreEditTools(): void {
		if (toolsBeforePlan) pi.setActiveTools(toolsBeforePlan);
		toolsBeforePlan = undefined;
	}

	function setPlanMode(enabled: boolean, notify?: (message: string) => void): void {
		if (enabled === planEnabled) return;
		planEnabled = enabled;
		if (enabled) enablePlanTools();
		else restoreEditTools();
		pi.appendEntry(MARKER, { enabled });
		notify?.(enabled ? "已进入 Plan 模式：只读，不能修改文件。" : "已退出 Plan 模式：恢复写权限。");
	}

	pi.registerCommand("plan", {
		description: "切换 Plan / Edit 模式（只读探索，适合先做分析再动手）",
		handler: async (args, ctx) => {
			const arg = String(args ?? "").trim().toLowerCase();
			const target = ["on", "enable", "enabled"].includes(arg)
				? true
				: ["off", "disable", "disabled", "normal", "edit"].includes(arg)
					? false
					: !planEnabled;
			setPlanMode(target, (message) => ctx.ui.notify(message, "info"));
			ctx.ui.setWidget("pi-plan-mode", planEnabled ? ["Plan mode · 只读"] : undefined);
		},
	});

	pi.registerShortcut("shift+tab", {
		description: "切换 Plan / Edit 模式",
		handler: async (ctx) => {
			setPlanMode(!planEnabled, (message) => ctx.ui.notify(message, "info"));
			ctx.ui.setWidget("pi-plan-mode", planEnabled ? ["Plan mode · 只读"] : undefined);
		},
	});

	pi.on("tool_call", async (event) => {
		if (!planEnabled || event.toolName !== "bash") return;
		const command = String(event.input.command ?? "");
		if (isReadOnlyCommand(command)) return;
		return {
			block: true,
			reason:
				"Plan 模式只允许只读命令。请说明这是只读操作，或先退出 Plan 模式（Shift+Tab）。\n" +
				`被拦截的命令：${command}`,
		};
	});

	pi.on("session_start", async (_event, ctx) => {
		if (!planEnabled) return;
		ctx.ui.setWidget("pi-plan-mode", ["Plan mode · 只读"]);
	});

	pi.on("session_shutdown", async () => {
		// Leave the tool set as-is: the next session reads its initial state from it.
	});
}
