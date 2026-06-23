import { formatCountdown, getRemainingMs, intervalMs, resolvePhase, type WalkStretchSettings } from "./timer";

const FONT_FAMILY = "Arial, Helvetica Neue, Helvetica, sans-serif";
const RENDER_WIDTH = 400;
const RENDER_HEIGHT = 200;

const DEFAULT_RING_COLOR = "#30d158";
const TRACK_COLOR = "#2a2a2a";
const BACKGROUND_COLOR = "#000000";
const LABEL_COLOR = "#8e8e93";

const CENTER_X = RENDER_WIDTH / 2;
const CENTER_Y = RENDER_HEIGHT / 2;
const RADIUS = 72;
const STROKE_WIDTH = 14;

export type RingDisplay = {
	key: string;
	image: string;
};

export function buildRingDisplay(settings: WalkStretchSettings): RingDisplay {
	const ringColor = normalizeRingColor(settings.ringColor);
	const phase = resolvePhase(settings);
	const totalMs = totalDurationForDisplay(settings);
	const remainingMs =
		phase === "due" ? 0 : settings.endsAt === undefined ? totalMs : getRemainingMs(settings.endsAt);
	const remainingSeconds = Math.ceil(remainingMs / 1000);
	const progress = totalMs <= 0 ? 0 : Math.min(1, Math.max(0, remainingMs / totalMs));
	const label = phase === "due" ? "GO!" : formatCountdown(remainingMs);
	const sublabel = phase === "due" ? "walk" : "";
	const key = phase === "due" ? `due:${ringColor}` : `${ringColor}:${totalMs}:${remainingSeconds}`;

	const svg = buildRingSvg(ringColor, progress, label, sublabel);

	return {
		key,
		image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
	};
}

function totalDurationForDisplay(settings: WalkStretchSettings): number {
	if (settings.durationMs !== undefined && settings.durationMs > 0) {
		return settings.durationMs;
	}

	return intervalMs(settings);
}

function buildRingSvg(ringColor: string, progress: number, label: string, sublabel: string): string {
	const circumference = 2 * Math.PI * RADIUS;
	const filled = circumference * progress;
	const gap = circumference - filled;

	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${RENDER_WIDTH}" height="${RENDER_HEIGHT}" viewBox="0 0 ${RENDER_WIDTH} ${RENDER_HEIGHT}">`;
	svg += `<rect width="${RENDER_WIDTH}" height="${RENDER_HEIGHT}" fill="${BACKGROUND_COLOR}"/>`;

	svg += ringArc(CENTER_X, CENTER_Y, RADIUS, TRACK_COLOR, circumference, 0);
	if (filled > 0.5) {
		svg += ringArc(CENTER_X, CENTER_Y, RADIUS, ringColor, filled, gap);
	}

	const labelSize = label.length > 4 ? 34 : 40;
	svg += text(CENTER_X, CENTER_Y - (sublabel ? 6 : 0), label, labelSize, "#ffffff", 600);

	if (sublabel) {
		svg += text(CENTER_X, CENTER_Y + 24, sublabel, 18, LABEL_COLOR, 500);
	}

	svg += "</svg>";
	return svg;
}

function ringArc(cx: number, cy: number, radius: number, color: string, dash: number, gap: number): string {
	return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${escapeXml(color)}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-dasharray="${dash} ${gap}" transform="rotate(-90 ${cx} ${cy})"/>`;
}

function text(x: number, y: number, value: string, fontSize: number, fill: string, weight: number): string {
	return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${fill}" font-family="${FONT_FAMILY}" font-size="${fontSize}" font-weight="${weight}">${escapeXml(value)}</text>`;
}

function normalizeRingColor(color: string | undefined): string {
	if (color === undefined || color === "") {
		return DEFAULT_RING_COLOR;
	}

	const normalized = color.trim().toLowerCase();
	if (/^#[0-9a-f]{6}$/.test(normalized)) {
		return normalized;
	}

	return DEFAULT_RING_COLOR;
}

function escapeXml(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
