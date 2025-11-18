"use client";

import { useEffect, useRef } from "react";

import { createNoise3D } from "simplex-noise";

import styles from "./Matrix.module.scss";

const DOT_SPACING = 8;

const MIN_SIZE = 0.5;
const MAX_SIZE = 2.5;

const CORNER_RADIUS = 1;

const RIPPLE_SPEED = 4;
const RIPPLE_THICKNESS = 80;
const RIPPLE_FADE_RATE = 0.02;

const ZONE_SCALE = 0.01;
const ZONE_THRESHOLD = 0.1;

const SPARKLE_SCALE = 0.8;
const SPARKLE_SPEED = 0.0005;
const SPARKLE_THRESHOLD = 0.4;

const TIME_SPEED = 0.0005;

export type Ripple = { x: number; y: number; radius: number; alpha: number };

interface MatrixProps {
	ripplesRef: React.MutableRefObject<Ripple[]>;
}

export default function Matrix({ ripplesRef }: MatrixProps) {
	const dotCanvasRef = useRef<HTMLCanvasElement>(null);
	const noise3D = useRef(createNoise3D()).current;

	useEffect(() => {
		const canvas = dotCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let animationFrameId: number;
		let w = (canvas.width = window.innerWidth);
		let h = (canvas.height = window.innerHeight);

		const handleResize = () => {
			w = canvas.width = window.innerWidth;
			h = canvas.height = window.innerHeight;
		};
		window.addEventListener("resize", handleResize);

		const render = (time: number) => {
			ctx.clearRect(0, 0, w, h);

			ripplesRef.current.forEach((r) => {
				r.radius += RIPPLE_SPEED;
				r.alpha -= RIPPLE_FADE_RATE;
			});
			ripplesRef.current = ripplesRef.current.filter((r) => r.alpha > 0);

			if (ripplesRef.current.length > 0) {
				ctx.fillStyle = "white";

				for (let x = 0; x < w; x += DOT_SPACING) {
					for (let y = 0; y < h; y += DOT_SPACING) {
						const structure = noise3D(
							x * ZONE_SCALE,
							y * ZONE_SCALE,
							time * TIME_SPEED
						);

						if (structure > ZONE_THRESHOLD) {
							const twinkle = noise3D(
								x * SPARKLE_SCALE,
								y * SPARKLE_SCALE,
								time * SPARKLE_SPEED
							);
							const twinkleNorm = (twinkle + 1) / 2;
							const activation =
								twinkleNorm > SPARKLE_THRESHOLD
									? (twinkleNorm - SPARKLE_THRESHOLD) / (1 - SPARKLE_THRESHOLD)
									: 0;

							let rippleVisibility = 0;

							for (const r of ripplesRef.current) {
								const dist = Math.hypot(x - r.x, y - r.y);
								const distFromWave = Math.abs(dist - r.radius);

								if (distFromWave < RIPPLE_THICKNESS) {
									const intensity = 1 - distFromWave / RIPPLE_THICKNESS;
									rippleVisibility = Math.max(
										rippleVisibility,
										intensity * r.alpha
									);
								}
							}

							if (rippleVisibility > 0.01) {
								const currentSize =
									MIN_SIZE + activation * (MAX_SIZE - MIN_SIZE);
								const dotBrightness = 0.1 + activation * 0.9;
								const finalAlpha = dotBrightness * rippleVisibility;

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
										CORNER_RADIUS
									);
								}
								ctx.fill();
							}
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
	}, [noise3D, ripplesRef]); // Add ripplesRef to dependency array

	return <canvas ref={dotCanvasRef} className={styles.dotsCanvas} />;
}

// Helper function remains the same, just ensuring types align
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
