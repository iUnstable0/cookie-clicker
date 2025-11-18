"use client";

import React, { useState, useEffect, useRef } from "react";

import { motion, AnimatePresence } from "motion/react";

import { Gradient } from "@/public/Gradient";

import styles from "./page.module.scss";

export default function Home() {
	const [cookieEntered, setCookieEntered] = useState<boolean>(false);
	const gradientRef = useRef<Gradient | null>(null);

	useEffect(() => {
		const gradient = new Gradient();
		gradientRef.current = gradient;

		const time = Date.now().toString().slice(5);
		// gradient.seed = Math.random(1, 10000);
		gradient.seed = 12;
		gradient.t = parseInt(time);

		gradient.initGradient("#gradient-canvas");

		return () => {
			gradient.disconnect();
		};
	}, []);

	const handleCookieEnter = () => {
		const gradient = gradientRef.current;

		if (!gradient) return;

		gradient.targetSpeed = 10;
		// gradientRef.current?.pause();
	};

	return (
		<div className={styles.container}>
			<canvas
				id="gradient-canvas"
				className={styles.gradient}
				data-transition-in
			/>

			<AnimatePresence>
				{!cookieEntered && (
					<motion.div
						className={styles.cookieWelcome}
						initial={{
							opacity: 1,
							transform: "scale(1)",
							filter: "blur(0px)",
						}}
						animate={{
							opacity: 1,
							transform: "scale(1)",
							filter: "blur(0px)",
						}}
						exit={{
							opacity: 0,
							transform: "scale(1.1)",
							filter: "blur(12px)",
						}}
						transition={{
							type: "spring",
							stiffness: 100,
							damping: 20,
							duration: 0.5,
							opacity: { duration: 0.3 },
						}}
						onClick={(e) => {
							setCookieEntered(true);
							handleCookieEnter();
						}}
					>
						<div>
							<p>Welcome to Cookie Clicker</p>
							<p>Press anywhere to enter</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<h1 className={styles.title}>Cookie Clicker</h1>

			<div className={styles.buttonContainer}>
				<button className={styles.button}>Play</button>
				<button className={styles.button}>Play</button>
			</div>
		</div>
	);
}
