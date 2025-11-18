"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

import Image from "next/image";

import useSound from "use-sound";

import { motion, AnimatePresence } from "motion/react";
import { nanoid } from "nanoid";

import { Gradient } from "@/components/Gradient";
import Matrix, { handleInteraction, Ripple } from "@/components/Matrix";

import styles from "./page.module.scss";

const MAX_COOKIES = 5;
interface GameCookie {
	id: string;
	x: number;
	y: number;
	size: number;
	rotation: number;
	spawnTime: number;
}

export default function Home() {
	const [cookieEntered, setCookieEntered] = useState<boolean>(false);
	const [gameStarted, setGameStarted] = useState<boolean>(false);

	const [cookiesClicked, setCookiesClicked] = useState<number>(0);
	const [lives, setLives] = useState<number>(3);

	const gradientRef = useRef<Gradient | null>(null);
	const cookieImageRef = useRef<HTMLImageElement | null>(null);
	const activeCookiesRef = useRef<GameCookie[]>([]);
	const requestRef = useRef<number>(0);
	const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const ripplesRef = useRef<Ripple[]>([]);

	const [cookieRate, setCookieRate] = React.useState(2);

	const [playCookie] = useSound("/sounds/cookie.mp3", {
		volume: 0.5,
		interrupt: true,
		playbackRate: cookieRate,
		// loop: true,
	});

	// const [playLore1, { stop: stopLore1 }] = useSound(
	// 	"/sounds/goodnightgoatloreaudio_1.mp3",
	// 	{ interrupt: true, loop: true }
	// );

	useEffect(() => {
		const gradient = new Gradient();
		gradientRef.current = gradient;

		const time = Date.now().toString().slice(3, 11);

		gradient.seed = 24;
		gradient.t = parseInt(time);
		gradient.initGradient("#gradient-canvas");
		return () => gradient.disconnect();
	}, []);

	useEffect(() => {
		const img = new window.Image();

		img.src = "cookie.svg";
		img.onload = () => {
			cookieImageRef.current = img;
		};
	}, []);

	const spawnCookie = useCallback((width: number, height: number) => {
		console.log("spawn cookie called");

		const size = 80;
		const padding = size;

		const newCookie: GameCookie = {
			id: nanoid(),

			x: padding + Math.random() * (width - padding * 2),
			y: padding + Math.random() * (height - padding * 2),
			size: size,
			rotation: Math.random() * 360,
			spawnTime: Date.now(),
		};

		activeCookiesRef.current.push(newCookie);
	}, []);

	const animateGame = useCallback(() => {
		const canvas = gameCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		const img = cookieImageRef.current;

		if (canvas && ctx && img) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			const currentTime = Date.now();

			activeCookiesRef.current.forEach((cookie) => {
				ctx.save();
				ctx.translate(cookie.x, cookie.y);

				const age = currentTime - cookie.spawnTime;
				let scale = Math.min(age / 300, 1);

				ctx.rotate((cookie.rotation + age * 0.001) * (Math.PI / 180));
				ctx.scale(scale, scale);

				ctx.drawImage(
					img,
					-cookie.size / 2,
					-cookie.size / 2,
					cookie.size,
					cookie.size
				);
				ctx.restore();
			});
		}
		requestRef.current = requestAnimationFrame(animateGame);
	}, []);

	useEffect(() => {
		if (!cookieEntered) return;

		console.log("Game started");

		const canvas = gameCanvasRef.current;
		if (!canvas) return;

		console.log("feydaiubdqygahvgh");

		const updateSize = () => {
			const parent = canvas.parentElement;

			if (parent) {
				canvas.width = parent.clientWidth;
				canvas.height = parent.clientHeight;

				activeCookiesRef.current = [];

				for (let i = 0; i < 5; i++) {
					spawnCookie(canvas.width, canvas.height);
				}
			}
		};

		updateSize();
		window.addEventListener("resize", updateSize);

		requestRef.current = requestAnimationFrame(animateGame);

		const spawnerInterval = setInterval(() => {
			if (activeCookiesRef.current.length < MAX_COOKIES) {
				spawnCookie(canvas.width, canvas.height);
			}
		}, 1000);

		return () => {
			window.removeEventListener("resize", updateSize);

			cancelAnimationFrame(requestRef.current);
			clearInterval(spawnerInterval);
		};
	}, [gameStarted, animateGame, spawnCookie]);

	const handleGameClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = gameCanvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();

		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		const mouseX = (e.clientX - rect.left) * scaleX;
		const mouseY = (e.clientY - rect.top) * scaleY;

		for (let i = activeCookiesRef.current.length - 1; i >= 0; i--) {
			const cookie = activeCookiesRef.current[i];

			const distance = Math.hypot(mouseX - cookie.x, mouseY - cookie.y);

			if (distance < cookie.size / 2) {
				activeCookiesRef.current.splice(i, 1);
				setCookiesClicked((prev) => prev + 1);

				playCookie();

				// spawnCookie(canvas.width, canvas.height);

				break;
			}
		}
	};

	const speedGradient = () => {
		if (gradientRef.current) {
			gradientRef.current.targetSpeed = 15;
			setTimeout(() => {
				if (gradientRef.current) {
					gradientRef.current.targetSpeed = 0.5;
				}
			}, 500);
		}
	};

	return (
		<div
			className={styles.container}
			onMouseDown={(e) => {
				handleInteraction(e, ripplesRef);
				speedGradient();
			}}
			onTouchStart={(e) => {
				handleInteraction(e, ripplesRef);
				speedGradient();
			}}
			onClick={() => {
				if (!cookieEntered) {
					setCookieEntered(true);

					setTimeout(() => {
						setGameStarted(true);
					}, 1000);
				}
			}}
		>
			<canvas
				id="gradient-canvas"
				className={styles.gradient}
				data-transition-in
			/>

			<Matrix ripplesRef={ripplesRef} />

			<AnimatePresence mode="wait">
				{!cookieEntered && (
					<motion.div
						key="cookie-welcome"
						className={styles.cookieWelcome}
						initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
						animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
						exit={{ opacity: 0, scale: 1.1, filter: "blur(12px)" }}
						transition={{ type: "spring", stiffness: 100, damping: 20 }}
					>
						<h1 className={styles.welcomeTitle}>Welcome to Cookie Clicker</h1>
						<p className={styles.welcomeMessage}>Press anywhere to enter</p>
					</motion.div>
				)}

				{cookieEntered && (
					<motion.div
						key="cookie-main"
						className={styles.cookieMain}
						initial={{
							opacity: 0,
							transform: "scale(0.9)",
							filter: "blur(12px)",
						}}
						animate={{ opacity: 1, transform: "scale(1)", filter: "blur(0px)" }}
						transition={{
							type: "spring",
							stiffness: 100,
							damping: 20,
							delay: 0.2,
						}}
					>
						<div className={styles.hearts}>
							{Array.from({ length: lives }).map((_, index) => (
								<Image
									key={`life-${index}`}
									src="/heart.svg"
									alt="Heart"
									width={128}
									height={128}
									className={styles.heart}
								/>
							))}
							{Array.from({ length: 3 - lives }).map((_, index) => (
								<Image
									key={`empty-${index}`}
									src="/heart-empty.svg"
									alt="Heart"
									width={128}
									height={128}
									className={styles.heart}
								/>
							))}
						</div>

						<div className={styles.cookies}>
							<h1>{cookiesClicked}</h1>
							<Image src="/cookie.svg" alt="Cookie" width={128} height={128} />
						</div>

						<canvas
							ref={gameCanvasRef}
							className={styles.gameArea}
							onMouseDown={handleGameClick}
						></canvas>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
