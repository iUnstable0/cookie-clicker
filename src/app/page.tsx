"use client";

import React, { useState, useEffect, useRef } from "react";

import { Gradient } from "@/public/Gradient";

import styles from "./page.module.scss";

export default function Home() {
	const [cookieEntered, setCookieEntered] = useState<boolean>(true);
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

	return (
		<div className={styles.container}>
			{cookieEntered && (
				<div
					className={styles.cookieWelcome}
					onClick={(e) => {
						setCookieEntered(true);
					}}
				>
					<canvas
						id="gradient-canvas"
						className={styles.gradient}
						data-transition-in
					/>

					<div>
						<p>Welcome to Cookie Clicker</p>
						<p>Press anywhere to enter</p>
					</div>
				</div>
			)}

			<h1 className={styles.title}>Cookie Clicker</h1>

			<div className={styles.buttonContainer}>
				<button className={styles.button}>Play</button>
				<button className={styles.button}>Play</button>
			</div>
		</div>
	);
}
