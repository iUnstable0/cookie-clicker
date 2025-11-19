"use client";

import { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";
import styles from "./Matrix.module.scss";

export type Ripple = { x: number; y: number; radius: number; alpha: number };

interface MatrixProps {
	ripplesRef: React.MutableRefObject<Ripple[]>;
	color?: string; // New prop for dynamic color
}

// Helper to parse Hex to RGB
const hexToRgb = (hex: string) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
		  }
		: { r: 0, g: 0, b: 0 };
};

// Helper to Linear Interpolate between values
const lerp = (start: number, end: number, factor: number) => {
	return start + (end - start) * factor;
};

export default function Matrix({ ripplesRef, color = "#000000" }: MatrixProps) {
	const dotCanvasRef = useRef<HTMLCanvasElement>(null);
	const noise3D = useRef(createNoise3D()).current;

	// Current color state for lerping (stored in ref to avoid re-renders)
	const currentColorRef = useRef(hexToRgb(color));

	// --- CONFIGURATION STATE (Tweaking these changes the look) ---

	// Grid Density: Distance between dots in pixels.
	// Lower value (e.g., 4) = dense, heavy performance cost.
	// Higher value (e.g., 15) = sparse, retro look, fast performance.
	const [dotsSpacing, setDotsSpacing] = useState(4);

	// Dot Size limits: The dots grow/shrink based on sparkle noise.
	const [minSize, setMinSize] = useState(0.75);
	const [maxSize, setMaxSize] = useState(3);

	// Shape: 0 = squares, 0.5 = rounded squares, 1 = circles (if size is large enough).
	// Note: Logic below forces small dots to be circles for performance/look.
	const [cornerRadius, setCornerRadius] = useState(1);

	// Ripple Physics:
	// Speed: Pixels the wave travels per frame.
	const [rippleSpeed, setRippleSpeed] = useState(8);
	// Thickness: How wide the "ring" of the ripple is.
	const [rippleThickness, setRippleThickness] = useState(80);
	// Fade Rate: How fast ripples disappear (0.005 is slow/long-lasting, 0.05 is fast).
	const [rippleFadeRate, setRippleFadeRate] = useState(0.05);

	// Noise "Map" Zoom (Zone):
	// Controls the size of the "continents" or clusters of dots.
	// Low (0.005) = Giant clusters. High (0.05) = Tiny scattered islands.
	const [zoneScale, setZoneScale] = useState(0.025);
	// Threshold: 0 to 1.
	// Higher (0.2) = Fewer dots, more empty space. Lower (-0.2) = Screen nearly full of dots.
	const [zoneThreshold, setZoneThreshold] = useState(0.1);

	// Sparkle Animation (Twinkling):
	// Scale: How "noisy" the twinkling is.
	const [sparkleScale, setSparkleScale] = useState(0.8);
	// Speed: How fast the dots twinkle.
	const [sparkleSpeed, setSparkleSpeed] = useState(0.0005);
	// Threshold: Only the brightest x% of noise becomes a sparkle.
	const [sparkleThreshold, setSparkleThreshold] = useState(0.4);

	// Global Time: Speed of the slow morphing of the entire map structure.
	const [timeSpeed, setTimeSpeed] = useState(0.0005);

	// Vignette (Edge Reveal) Settings:
	// Controls how visible the dots are at the edges of the screen without interaction.
	const [vignetteStart, setVignetteStart] = useState(0.4); // 0 to 1 (Start fading in at 40% distance from center)
	const [vignettePower, setVignettePower] = useState(3); // Higher = steeper curve (only very edges are visible)
	const [vignetteStrength, setVignetteStrength] = useState(0.6); // Max opacity of the edges (0 to 1)

	useEffect(() => {
		const canvas = dotCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let animationFrameId: number;
		let w = (canvas.width = window.innerWidth);
		let h = (canvas.height = window.innerHeight);

		// Center point for vignette calculation
		let cx = w / 2;
		let cy = h / 2;
		let maxDist = Math.hypot(cx, cy); // Max distance from center to corner

		const handleResize = () => {
			w = canvas.width = window.innerWidth;
			h = canvas.height = window.innerHeight;
			cx = w / 2;
			cy = h / 2;
			maxDist = Math.hypot(cx, cy);
		};
		window.addEventListener("resize", handleResize);

		const render = (time: number) => {
			ctx.clearRect(0, 0, w, h);

			// --- 1. COLOR LERPING LOGIC ---
			const targetRgb = hexToRgb(color);
			const cur = currentColorRef.current;

			// Lerp factor (0.05 = smooth transition, 1.0 = instant)
			cur.r = lerp(cur.r, targetRgb.r, 0.05);
			cur.g = lerp(cur.g, targetRgb.g, 0.05);
			cur.b = lerp(cur.b, targetRgb.b, 0.05);

			// Apply the interpolated color
			ctx.fillStyle = `rgb(${Math.round(cur.r)}, ${Math.round(
				cur.g
			)}, ${Math.round(cur.b)})`;

			// --- 2. RIPPLE PHYSICS ---
			ripplesRef.current.forEach((r) => {
				r.radius += rippleSpeed;
				r.alpha -= rippleFadeRate;
			});
			ripplesRef.current = ripplesRef.current.filter((r) => r.alpha > 0);

			// --- 3. DOT RENDERING LOOP ---
			// Even if no ripples, we render for the vignette effect
			for (let x = 0; x < w; x += dotsSpacing) {
				for (let y = 0; y < h; y += dotsSpacing) {
					// Base noise structure (should a dot exist here?)
					const structure = noise3D(
						x * zoneScale,
						y * zoneScale,
						time * timeSpeed
					);

					if (structure > zoneThreshold) {
						// Sparkle calculation
						const twinkle = noise3D(
							x * sparkleScale,
							y * sparkleScale,
							time * sparkleSpeed
						);
						const twinkleNorm = (twinkle + 1) / 2;
						const activation =
							twinkleNorm > sparkleThreshold
								? (twinkleNorm - sparkleThreshold) / (1 - sparkleThreshold)
								: 0;

						// --- VIGNETTE CALCULATION ---
						const distFromCenter = Math.hypot(x - cx, y - cy);
						const normalizedDist = distFromCenter / maxDist; // 0 (center) to 1 (corner)

						// Calculate vignette alpha based on distance
						let vignetteAlpha = 0;
						if (normalizedDist > vignetteStart) {
							// Map range [start, 1] to [0, 1]
							const vFactor =
								(normalizedDist - vignetteStart) / (1 - vignetteStart);
							vignetteAlpha =
								Math.pow(vFactor, vignettePower) * vignetteStrength;
						}

						// --- RIPPLE VISIBILITY CALCULATION ---
						let rippleVisibility = 0;
						for (const r of ripplesRef.current) {
							const dist = Math.hypot(x - r.x, y - r.y);
							const distFromWave = Math.abs(dist - r.radius);

							if (distFromWave < rippleThickness) {
								const intensity = 1 - distFromWave / rippleThickness;
								rippleVisibility = Math.max(
									rippleVisibility,
									intensity * r.alpha
								);
							}
						}

						// Combine Vignette and Ripple (use the brighter of the two)
						const finalVisibility = Math.max(vignetteAlpha, rippleVisibility);

						if (finalVisibility > 0.01) {
							const currentSize = minSize + activation * (maxSize - minSize);
							const dotBrightness = 0.1 + activation * 0.9;
							const finalAlpha = dotBrightness * finalVisibility;

							ctx.globalAlpha = finalAlpha;
							ctx.beginPath();
							if (currentSize < 2) {
								ctx.arc(x, y, currentSize / 2, 0, Math.PI * 2);
							} else {
								ctx.roundRect(
									x - currentSize / 2,
									y - currentSize / 2,
									currentSize,
									currentSize,
									cornerRadius
								);
							}
							ctx.fill();
						}
					}
				}
			}

			animationFrameId = requestAnimationFrame(render);
		};

		render(0);

		return () => {
			window.removeEventListener("resize", handleResize);
			cancelAnimationFrame(animationFrameId);
		};
	}, [
		noise3D,
		ripplesRef,
		color, // Re-run loop setup if these change, but refs handle the heavy lifting
		dotsSpacing,
		zoneScale,
		zoneThreshold,
		sparkleScale,
		sparkleThreshold,
		rippleSpeed,
		rippleFadeRate,
		vignetteStart,
		vignettePower,
		vignetteStrength,
	]);

	return <canvas ref={dotCanvasRef} className={styles.dotsCanvas} />;
}

// Helper function remains the same
export function handleInteraction(
	e: React.MouseEvent | React.TouchEvent,
	ripplesRef: React.MutableRefObject<Ripple[]>
) {
	let clientX, clientY;

	if ("touches" in e) {
		clientX = e.touches[0].clientX;
		clientY = e.touches[0].clientY;
	} else {
		clientX = e.clientX;
		clientY = e.clientY;
	}

	ripplesRef.current.push({
		x: clientX,
		y: clientY,
		radius: 0,
		alpha: 1.0,
	});
}
