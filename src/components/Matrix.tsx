"use client";

import { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";
import styles from "./Matrix.module.scss";

export type Ripple = {
	x: number;
	y: number;
	radius: number;
	alpha: number;
	element?: HTMLDivElement;
	// Instance-specific physics
	thickness: number;
	fadeRate: number;
	speed: number;
};

interface MatrixProps {
	ripplesRef: React.MutableRefObject<Ripple[]>;
	color?: string;
	cookiesClicked: number;
	levels: Array<{
		target: number;
	}>;
}

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

const lerp = (start: number, end: number, factor: number) => {
	return start + (end - start) * factor;
};

export default function Matrix({
	ripplesRef,
	color = "#000000",
	cookiesClicked,
	levels,
}: MatrixProps) {
	const dotCanvasRef = useRef<HTMLCanvasElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);
	const vignetteRef = useRef<HTMLDivElement>(null);

	const noise3D = useRef(createNoise3D()).current;
	const currentColorRef = useRef(hexToRgb(color));
	const targetColorRef = useRef(hexToRgb(color));

	// Grid Density: Distance between dots in pixels.
	// Lower value (e.g., 4) = dense, heavy performance cost.
	// Higher value (e.g., 15) = sparse, retro look, fast performance.
	const [dotsSpacing, setDotsSpacing] = useState(6);

	// Dot Size limits: The dots grow/shrink based on sparkle noise.
	const [minSize, setMinSize] = useState(1);
	const [maxSize, setMaxSize] = useState(3.5);

	// Shape: 0 = squares, 0.5 = rounded squares, 1 = circles (if size is large enough).
	// Note: Logic below forces small dots to be circles for performance/look.
	const [cornerRadius, setCornerRadius] = useState(1);

	// Ripple Physics:
	// Speed: Pixels the wave travels per frame.
	// const [rippleSpeed, setRippleSpeed] = useState(8);
	// Thickness: How wide the "ring" of the ripple is.
	// const [rippleThickness, setRippleThickness] = useState(80);
	// Fade Rate: How fast ripples disappear (0.005 is slow/long-lasting, 0.05 is fast).
	// const [rippleFadeRate, setRippleFadeRate] = useState(0.023);

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
	const [timeSpeed, setTimeSpeed] = useState(0.00025);

	// Vignette (Edge Reveal) Settings:
	// Controls how visible the dots are at the edges of the screen without interaction.
	const [vignetteStart, setVignetteStart] = useState(0.4); // 0 to 1 (Start fading in at 40% distance from center)
	const [vignettePower, setVignettePower] = useState(3); // Higher = steeper curve (only very edges are visible)
	const [vignetteStrength, setVignetteStrength] = useState(0.6); // Max opacity of the edges (0 to 1)
	useEffect(() => {
		targetColorRef.current = hexToRgb(color);
	}, [color]);

	useEffect(() => {
		const isLevelUp = levels.some((lvl) => lvl.target === cookiesClicked);

		if (isLevelUp && ripplesRef.current.length > 0) {
			const lastRipple = ripplesRef.current[ripplesRef.current.length - 1];

			lastRipple.thickness = 300;
			lastRipple.fadeRate = 0.005;
			lastRipple.speed = 12;
			lastRipple.alpha = 1.5;
		}
	}, [cookiesClicked, levels, ripplesRef]);

	useEffect(() => {
		const canvas = dotCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const createRippleElement = (x: number, y: number) => {
			if (!overlayRef.current) return undefined;

			const el = document.createElement("div");
			el.style.position = "absolute";
			el.style.left = `${x}px`;
			el.style.top = `${y}px`;
			el.style.transform = "translate(-50%, -50%)";
			el.style.borderRadius = "50%";
			el.style.pointerEvents = "none";
			el.style.filter = "blur(12px)";

			overlayRef.current.appendChild(el);
			return el;
		};

		let animationFrameId: number;
		let w = (canvas.width = window.innerWidth);
		let h = (canvas.height = window.innerHeight);
		let cx = w / 2;
		let cy = h / 2;
		let maxDist = Math.hypot(cx, cy);

		const handleResize = () => {
			w = canvas.width = window.innerWidth;
			h = canvas.height = window.innerHeight;
			cx = w / 2;
			cy = h / 2;
			maxDist = Math.hypot(cx, cy);
		};
		window.addEventListener("resize", handleResize);

		const render = (time: number) => {
			const targetRgb = targetColorRef.current;
			const cur = currentColorRef.current;
			cur.r = lerp(cur.r, targetRgb.r, 0.05);
			cur.g = lerp(cur.g, targetRgb.g, 0.05);
			cur.b = lerp(cur.b, targetRgb.b, 0.05);

			const colorString = `${Math.round(cur.r)}, ${Math.round(
				cur.g
			)}, ${Math.round(cur.b)}`;

			if (vignetteRef.current) {
				vignetteRef.current.style.setProperty(
					"--vignette-color",
					`rgba(${colorString}, 0.3)`
				);
			}

			ctx.clearRect(0, 0, w, h);

			ripplesRef.current.forEach((r) => {
				if (!r.element) {
					r.element = createRippleElement(r.x, r.y);
				}

				r.radius += r.speed;
				r.alpha -= r.fadeRate;

				if (r.element) {
					const diameter = r.radius * 2;

					r.element.style.width = `${diameter}px`;
					r.element.style.height = `${diameter}px`;
					r.element.style.opacity = `${r.alpha}`;

					const blur = r.thickness;
					const spread = r.thickness * 0.2; // Slight spread to make it visible

					r.element.style.boxShadow = `
              inset 0 0 ${blur}px ${spread}px rgba(${colorString}, 0.3), 
              0 0 ${blur}px ${spread}px rgba(${colorString}, 0.3)
            `;
				}
			});

			ripplesRef.current.forEach((r) => {
				if (r.alpha <= 0 && r.element) {
					r.element.remove();
				}
			});
			ripplesRef.current = ripplesRef.current.filter((r) => r.alpha > 0);

			ctx.fillStyle = `rgb(${colorString})`;

			for (let x = 0; x < w; x += dotsSpacing) {
				for (let y = 0; y < h; y += dotsSpacing) {
					const structure = noise3D(
						x * zoneScale,
						y * zoneScale,
						time * timeSpeed
					);

					if (structure > zoneThreshold) {
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

						const distFromCenter = Math.hypot(x - cx, y - cy);
						const normalizedDist = distFromCenter / maxDist;

						let vignetteAlpha = 0;
						if (normalizedDist > vignetteStart) {
							const vFactor =
								(normalizedDist - vignetteStart) / (1 - vignetteStart);
							vignetteAlpha =
								Math.pow(vFactor, vignettePower) * vignetteStrength;
						}

						let rippleVisibility = 0;
						for (const r of ripplesRef.current) {
							const dist = Math.hypot(x - r.x, y - r.y);
							const distFromWave = Math.abs(dist - r.radius);

							if (distFromWave < r.thickness) {
								const intensity = 1 - distFromWave / r.thickness;
								rippleVisibility = Math.max(
									rippleVisibility,
									intensity * r.alpha
								);
							}
						}

						const finalVisibility = Math.max(vignetteAlpha, rippleVisibility);

						if (finalVisibility > 0.01) {
							const currentSize = minSize + activation * (maxSize - minSize);
							const finalAlpha = (0.1 + activation * 0.9) * finalVisibility;

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
			ripplesRef.current.forEach((r) => r.element?.remove());
		};
	}, [
		noise3D,
		ripplesRef,
		dotsSpacing,
		zoneScale,
		zoneThreshold,
		sparkleScale,
		sparkleThreshold,
		vignetteStart,
		vignettePower,
		vignetteStrength,
	]);

	return (
		<>
			<canvas ref={dotCanvasRef} className={styles.dotsCanvas} />
			<div
				ref={vignetteRef}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					pointerEvents: "none",
					zIndex: 1,
					background:
						"radial-gradient(circle, transparent 0%, transparent 75%, var(--vignette-color) 100%)",
				}}
			/>
			<div
				ref={overlayRef}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					pointerEvents: "none",
					overflow: "hidden",
					zIndex: 2,
				}}
			/>
		</>
	);
}

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
		// SET DEFAULTS HERE
		thickness: 80,
		fadeRate: 0.023,
		speed: 8,
	});
}
