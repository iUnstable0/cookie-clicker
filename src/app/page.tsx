"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

import Image from "next/image";

import useSound from "use-sound";

import { motion, AnimatePresence } from "motion/react";
import { nanoid } from "nanoid";

import { Gradient } from "@/components/Gradient";
import Matrix, { handleInteraction, Ripple } from "@/components/Matrix";

import { SlidingNumber } from "@/components/motion-primitives/sliding-number";
import { TextMorph } from "@/components/motion-primitives/text-morph";

import styles from "./page.module.scss";

const MAX_COOKIES = 5;

const TITLES = [
	"im cold.",
	"where are you going?",
	"its dark.",
	"dont leave me here.",
	"come back...",
];

const levels = [
	{ target: 20 },
	{ target: 67 },
	{ target: 111 },
	{ target: 167 },
];

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
	const [gameLoaded, setGameLoaded] = useState<boolean>(false);
	const [gameOver, setGameOver] = useState<boolean>(false);

	const [isHaunted, setIsHaunted] = useState<boolean>(false);

	const [cookiesClicked, setCookiesClicked] = useState<number>(0);
	const [lives, setLives] = useState<number>(3);

	const [matrixColor, setMatrixColor] = useState("#000000");

	const gradientRef = useRef<Gradient | null>(null);
	const cookieImageRef = useRef<HTMLImageElement | null>(null);
	const activeCookiesRef = useRef<GameCookie[]>([]);
	const requestRef = useRef<number>(0);
	const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const ripplesRef = useRef<Ripple[]>([]);
	const cookiesClickedRef = useRef(cookiesClicked);

	const [cookieRate, setCookieRate] = React.useState(2);

	const [playCookie] = useSound("/sounds/cookie.mp3", {
		volume: 1,
		interrupt: true,
		playbackRate: cookieRate,
		// loop: true,
	});

	const [playScaryCookie] = useSound("/sounds/COOKIECLICKED.mp3", {
		volume: 1,
		interrupt: true,
		loop: true,
		playbackRate: isHaunted ? 0.7 : 1,
		// loop: true,
	});

	const [playLofi, { stop: stopLofi }] = useSound("/sounds/lofi/lofi1.mp3", {
		volume: 0.5,
		interrupt: true,
		loop: true,
		onload: () => {
			setGameLoaded(true);
		},
	});

	const [playLaugh] = useSound("/sounds/laugh.mp3", {
		volume: 0.7,
		interrupt: true,
		playbackRate: isHaunted ? 0.7 : 1,
	});

	const getMatrixColor = (cookiesClicked: number) => {
		if (cookiesClicked >= 167) {
			return "#8419bd";
		} else if (cookiesClicked >= 111) {
			return "#f95e9a";
		} else if (cookiesClicked >= 67) {
			return "#ac6407";
		} else if (cookiesClicked >= 20) {
			return "#0f7a21";
		} else {
			return "#397fe0";
		}
	};

	// const [playLore1, { stop: stopLore1 }] = useSound(
	// 	"/sounds/goodnightgoatloreaudio_1.mp3",
	// 	{ interrupt: true, loop: true }
	// );

	useEffect(() => {
		const gradient = new Gradient();
		gradientRef.current = gradient;

		const time = Date.now().toString().slice(5);

		// @ts-expect-error definition missing
		gradient.seed = 10;
		// @ts-expect-error definition missing
		gradient.t = parseInt(time);

		// @ts-expect-error definition missing
		gradient.initGradient("#gradient-canvas");

		const deathState = localStorage.getItem("death");

		if (deathState === "true") {
			setTimeout(() => {
				document.title = "i am watching you.";
			}, 1000);

			setIsHaunted(true);
		}

		const img = new window.Image();

		img.src = "cookie.svg";
		img.onload = () => {
			cookieImageRef.current = img;
		};

		const handleVisibilityChange = () => {
			if (document.hidden) {
				const lastHaunt = localStorage.getItem("lastHaunt");
				const now = Date.now();

				if (
					!lastHaunt ||
					now - parseInt(lastHaunt) > 1000 * 60 * 5 /* 5 minutes */
				) {
					const randomTitle = TITLES[Math.floor(Math.random() * TITLES.length)];

					// if (Math.random() < 0.1) {
					document.title = randomTitle;

					localStorage.setItem("lastHaunt", Date.now().toString());
				}
			} else {
				if (isHaunted) {
					document.title = "i am watching you.";
				} else {
					document.title = "Cookie Clicker";

					const tacoDiarrhea = localStorage.getItem("tacoDiarrhea");

					const now = Date.now();

					// set gameover to true then wait for 250 ms then set to false
					// only do this if tacoDiarrhea is more than 5 mins ago

					if (
						!tacoDiarrhea ||
						now - parseInt(tacoDiarrhea) > 1000 * 60 * 5 /* 5 minutes */
					) {
						localStorage.setItem("tacoDiarrhea", Date.now().toString());

						setGameOver(true);

						setTimeout(() => {
							setGameOver(false);
						}, 250);
					}
				}
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			gradient.disconnect();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, []);

	useEffect(() => {
		if (!gradientRef.current) return;

		cookiesClickedRef.current = cookiesClicked;

		if (lives !== 1) {
			setMatrixColor(getMatrixColor(cookiesClicked));
		}

		if (cookiesClicked >= 167) {
			gradientRef.current.updateColor(0, "#ffc3eb", 2000);
			gradientRef.current.updateColor(1, "#c594ed", 4000);
			gradientRef.current.updateColor(2, "#f3e2ff", 6000);
			gradientRef.current.updateColor(3, "#e6b9ff", 8000);
		} else if (cookiesClicked >= 111) {
			gradientRef.current.updateColor(0, "#ffcec3", 2000);
			gradientRef.current.updateColor(1, "#e95752", 4000);
			gradientRef.current.updateColor(2, "#ffece2", 6000);
			gradientRef.current.updateColor(3, "#ffb9b9", 8000);
		} else if (cookiesClicked >= 67) {
			gradientRef.current.updateColor(0, "#ffe5c3", 2000);
			gradientRef.current.updateColor(1, "#e97552", 4000);
			gradientRef.current.updateColor(2, "#faffe2", 6000);
			gradientRef.current.updateColor(3, "#ffc9b9", 8000);
		} else if (cookiesClicked >= 20) {
			gradientRef.current.updateColor(0, "#a7c492", 2000);
			gradientRef.current.updateColor(1, "#bdde99", 4000);
			gradientRef.current.updateColor(2, "#92d47e", 6000);
			gradientRef.current.updateColor(3, "#cbdba2", 8000);
		}
	}, [cookiesClicked]);

	useEffect(() => {
		let interval: NodeJS.Timeout | undefined;

		if (lives <= 0 && !gameOver) {
			setGameOver(true);

			localStorage.setItem("death", "true");

			stopLofi();
			// playScaryCookie();

			setTimeout(() => {
				playLaugh();
			}, 750);
		}

		if (lives == 1) {
			interval = setInterval(() => {
				setMatrixColor("#ff0800");

				setTimeout(() => {
					setMatrixColor(getMatrixColor(cookiesClickedRef.current));

					setTimeout(() => {
						setMatrixColor("#ff0800");

						setTimeout(() => {
							setMatrixColor(getMatrixColor(cookiesClickedRef.current));
						}, 500);
					}, 500);
				}, 500);
			}, 2000);
		}

		// if (lives == 1) {
		// 	setMatrixColor("#ff0000");
		// }
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [lives, gameOver, playLaugh, stopLofi]);

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

	// useEffect(() => {
	// 	if (!gameStarted || gameOver) return;

	// 	const interval = setInterval(() => {
	// 		// 1% chance every second to lose a cookie
	// 		if (Math.random() < 0.05) {
	// 			setCookiesClicked((prev) => Math.max(0, prev - 1));
	// 		}
	// 	}, 1000);

	// 	return () => clearInterval(interval);
	// }, [gameStarted, gameOver]);

	const handleGameClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = gameCanvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();

		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		const mouseX = (e.clientX - rect.left) * scaleX;
		const mouseY = (e.clientY - rect.top) * scaleY;

		let wasHit = false;

		for (let i = activeCookiesRef.current.length - 1; i >= 0; i--) {
			const cookie = activeCookiesRef.current[i];

			const distance = Math.hypot(mouseX - cookie.x, mouseY - cookie.y);

			if (distance < cookie.size / 2) {
				activeCookiesRef.current.splice(i, 1);
				wasHit = true;

				setCookiesClicked((prev) => prev + 1);

				playCookie();

				spawnCookie(canvas.width, canvas.height);

				break;
			}
		}

		if (!wasHit) {
			setLives((prev) => Math.max(prev - 1, 0));
		}
	};

	const speedGradient = () => {
		if (gradientRef.current) {
			// @ts-expect-error definition missing
			gradientRef.current.targetSpeed = 15;
			setTimeout(() => {
				if (gradientRef.current) {
					// @ts-expect-error definition missing
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
				if (!gameLoaded) return;

				if (!cookieEntered && !isHaunted) {
					setCookieEntered(true);

					playLofi();

					setTimeout(() => {
						setGameStarted(true);
					}, 1000);
				}

				if (!gameOver && isHaunted) {
					setGameOver(true);

					playScaryCookie();

					setTimeout(() => {
						playLaugh();
					}, 750);

					localStorage.setItem("death", "false");
				}
			}}
		>
			{gameOver && (
				<div className={styles.gameOver}>
					<div className={styles.overlay} />
					<Image src="/haunt.jpeg" alt="Haunt" width={512} height={512} />
					{isHaunted && (
						<h1 className={styles.gameOverTitle}>
							የመረጃ ጥሰት ማሳሰቢያ በአሜሪካ ውስጥ ላሉ ግለሰቦች
						</h1>
					)}
				</div>
			)}
			<canvas
				id="gradient-canvas"
				className={styles.gradient}
				data-transition-in
			/>

			<Matrix
				ripplesRef={ripplesRef}
				color={matrixColor}
				cookiesClicked={cookiesClicked}
				levels={levels}
			/>

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
						<div className={styles.welcomeMessage}>
							<TextMorph>
								{gameLoaded
									? "Click anywhere to start!"
									: "Loading, please wait..."}
							</TextMorph>
						</div>
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
							<AnimatePresence mode="popLayout">
								{Array.from({ length: lives }).map((_, index) => (
									<motion.div
										key={`life-${index}`}
										initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
										animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
										exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
										transition={{
											type: "spring",
											stiffness: 300,
											damping: 20,
											opacity: { duration: 0.2 },
										}}
										className={styles.heart}
									>
										<Image
											src="/heart.svg"
											alt="Heart"
											width={128}
											height={128}
										/>
									</motion.div>
								))}
								{Array.from({ length: 3 - lives }).map((_, index) => (
									<motion.div
										key={`empty-${lives + index}`}
										initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
										animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
										exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
										transition={{
											type: "spring",
											stiffness: 300,
											damping: 20,
											opacity: { duration: 0.2 },
										}}
										className={styles.heart}
									>
										<Image
											src="/heart-empty.svg"
											alt="Heart"
											width={128}
											height={128}
										/>
									</motion.div>
								))}
							</AnimatePresence>
						</div>

						<div className={styles.cookies}>
							{/* <h1>{cookiesClicked}</h1> */}
							<SlidingNumber value={cookiesClicked} />
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
