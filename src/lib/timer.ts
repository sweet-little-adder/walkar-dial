const DEFAULT_INTERVAL_MINUTES = 30;
const DEFAULT_SNOOZE_MINUTES = 5;

export type TimerPhase = "counting" | "due";

export type WalkStretchSettings = {
	intervalMinutes?: number | string;
	snoozeMinutes?: number | string;
	ringColor?: string;
	endsAt?: number;
	durationMs?: number;
	phase?: TimerPhase;
};

export function normalizeIntervalMinutes(value: number | string | undefined): number {
	const parsed = typeof value === "string" ? Number.parseInt(value, 10) : value;
	if (parsed === undefined || Number.isNaN(parsed) || parsed < 1) {
		return DEFAULT_INTERVAL_MINUTES;
	}

	return parsed;
}

export function normalizeSnoozeMinutes(value: number | string | undefined): number {
	const parsed = typeof value === "string" ? Number.parseInt(value, 10) : value;
	if (parsed === undefined || Number.isNaN(parsed) || parsed < 1) {
		return DEFAULT_SNOOZE_MINUTES;
	}

	return parsed;
}

export function intervalMs(settings: WalkStretchSettings): number {
	return normalizeIntervalMinutes(settings.intervalMinutes) * 60_000;
}

export function snoozeMs(settings: WalkStretchSettings): number {
	return normalizeSnoozeMinutes(settings.snoozeMinutes) * 60_000;
}

export function getRemainingMs(endsAt: number): number {
	return Math.max(0, endsAt - Date.now());
}

export function formatCountdown(ms: number): string {
	const totalSeconds = Math.ceil(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function resolvePhase(settings: WalkStretchSettings): TimerPhase {
	if (settings.phase === "due") {
		return "due";
	}

	if (settings.endsAt !== undefined && getRemainingMs(settings.endsAt) <= 0) {
		return "due";
	}

	return "counting";
}

export function ensureEndsAt(settings: WalkStretchSettings): WalkStretchSettings {
	const phase = resolvePhase(settings);

	if (phase === "due") {
		return { ...settings, phase: "due" };
	}

	if (settings.endsAt === undefined || getRemainingMs(settings.endsAt) <= 0) {
		const duration = intervalMs(settings);
		return {
			...settings,
			phase: "counting",
			endsAt: Date.now() + duration,
			durationMs: duration,
		};
	}

	return { ...settings, phase: "counting" };
}

export function resetTimer(settings: WalkStretchSettings): WalkStretchSettings {
	const duration = intervalMs(settings);
	return {
		...settings,
		phase: "counting",
		endsAt: Date.now() + duration,
		durationMs: duration,
	};
}
