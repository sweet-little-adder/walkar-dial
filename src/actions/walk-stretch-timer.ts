import streamDeck, {
	action,
	DialAction,
	DialUpEvent,
	DidReceiveSettingsEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent,
} from "@elgato/streamdeck";

import { buildRingDisplay } from "../lib/ring-image";
import {
	ensureEndsAt,
	resetTimer,
	resolvePhase,
	type WalkStretchSettings,
} from "../lib/timer";

@action({ UUID: "com.orionwong.walkar-dial.timer" })
export class WalkStretchTimer extends SingletonAction<WalkStretchSettings> {
	private settingsCache = new Map<string, WalkStretchSettings>();
	private displayKeys = new Map<string, string>();
	private ticking = new Set<string>();
	private timeouts = new Map<string, ReturnType<typeof setTimeout>>();
	private alerted = new Set<string>();

	constructor() {
		super();

		streamDeck.system.onSystemDidWakeUp(() => {
			void this.refreshAllVisibleActions();
		});
	}

	override async onWillAppear(ev: WillAppearEvent<WalkStretchSettings>): Promise<void> {
		if (!ev.action.isDial()) {
			return;
		}

		const settings = ensureEndsAt(ev.payload.settings);
		this.cacheSettings(ev.action.id, settings);

		if (settingsChanged(ev.payload.settings, settings)) {
			await ev.action.setSettings(settings);
		}

		await this.render(ev.action, settings, true);
		this.startTicker(ev.action);
	}

	override onWillDisappear(ev: WillDisappearEvent<WalkStretchSettings>): void {
		this.stopTicker(ev.action.id);
		this.settingsCache.delete(ev.action.id);
		this.displayKeys.delete(ev.action.id);
		this.alerted.delete(ev.action.id);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<WalkStretchSettings>): Promise<void> {
		if (!ev.action.isDial()) {
			return;
		}

		const settings = ensureEndsAt(ev.payload.settings);
		this.cacheSettings(ev.action.id, settings);

		if (settingsChanged(ev.payload.settings, settings)) {
			await ev.action.setSettings(settings);
		}

		this.displayKeys.delete(ev.action.id);
		await this.render(ev.action, settings, true);
	}

	override async onDialUp(ev: DialUpEvent<WalkStretchSettings>): Promise<void> {
		if (!ev.action.isDial()) {
			return;
		}

		const settings = resetTimer(ev.payload.settings);
		this.cacheSettings(ev.action.id, settings);
		this.alerted.delete(ev.action.id);

		await ev.action.setSettings(settings);
		this.displayKeys.delete(ev.action.id);
		await this.render(ev.action, settings, true);
		this.startTicker(ev.action);
	}

	private cacheSettings(actionId: string, settings: WalkStretchSettings): void {
		this.settingsCache.set(actionId, settings);
	}

	private startTicker(action: DialAction<WalkStretchSettings>): void {
		if (this.ticking.has(action.id)) {
			return;
		}

		this.ticking.add(action.id);
		this.scheduleTick(action);
	}

	private scheduleTick(action: DialAction<WalkStretchSettings>): void {
		const timeout = setTimeout(() => {
			void this.tick(action).finally(() => {
				if (!this.ticking.has(action.id)) {
					return;
				}

				const settings = this.settingsCache.get(action.id);
				if (settings === undefined || resolvePhase(settings) === "due") {
					this.stopTicker(action.id);
					return;
				}

				this.scheduleTick(action);
			});
		}, msUntilNextSecond());

		this.timeouts.set(action.id, timeout);
	}

	private stopTicker(actionId: string): void {
		this.ticking.delete(actionId);

		const timeout = this.timeouts.get(actionId);
		if (timeout !== undefined) {
			clearTimeout(timeout);
			this.timeouts.delete(actionId);
		}
	}

	private async tick(action: DialAction<WalkStretchSettings>): Promise<void> {
		const settings = this.settingsCache.get(action.id);
		if (settings === undefined) {
			return;
		}

		const phase = resolvePhase(settings);

		if (phase === "due" && settings.phase !== "due") {
			const dueSettings: WalkStretchSettings = { ...settings, phase: "due" };
			this.cacheSettings(action.id, dueSettings);
			await action.setSettings(dueSettings);

			if (!this.alerted.has(action.id)) {
				this.alerted.add(action.id);
				await action.showAlert();
			}

			await this.render(action, dueSettings, true);
			return;
		}

		await this.render(action, settings);
	}

	private async refreshAllVisibleActions(): Promise<void> {
		for (const action of this.actions) {
			if (!action.isDial()) {
				continue;
			}

			const settings = ensureEndsAt(await action.getSettings<WalkStretchSettings>());
			this.cacheSettings(action.id, settings);
			await action.setSettings(settings);
			this.displayKeys.delete(action.id);
			await this.render(action, settings, true);
			this.startTicker(action);
		}
	}

	private async render(
		action: DialAction<WalkStretchSettings>,
		settings: WalkStretchSettings,
		force = false,
	): Promise<void> {
		const display = buildRingDisplay(settings);

		if (!force && this.displayKeys.get(action.id) === display.key) {
			return;
		}

		this.displayKeys.set(action.id, display.key);
		await action.setFeedback({ display: display.image });
	}
}

function settingsChanged(before: WalkStretchSettings, after: WalkStretchSettings): boolean {
	return before.endsAt !== after.endsAt || before.phase !== after.phase || before.durationMs !== after.durationMs;
}

function msUntilNextSecond(): number {
	return 1000 - (Date.now() % 1000);
}
