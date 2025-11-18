"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Gradient } from "@/components/Gradient";

import Matrix, { handleInteraction, Ripple } from "@/components/Matrix";

import styles from "./page.module.scss";

export default function Home() {
	const [cookieEntered, setCookieEntered] = useState<boolean>(false);
	const gradientRef = useRef<Gradient | null>(null);

	const ripplesRef = useRef<Ripple[]>([]);

	useEffect(() => {
		const gradient = new Gradient();

		gradientRef.current = gradient;

		gradient.initGradient("#gradient-canvas");

		return () => gradient.disconnect();
	}, []);

	return (
		<div
			className={styles.container}
			// 2. Pass the local ripplesRef, not Matrix.ripplesRef
			onMouseDown={(e) => handleInteraction(e, ripplesRef)}
			onTouchStart={(e) => handleInteraction(e, ripplesRef)}
			onClick={() => setCookieEntered(true)} // Added trigger to enter
		>
			<canvas
				id="gradient-canvas"
				className={styles.gradient}
				data-transition-in
			/>

			{/* 3. Pass the ref down to the component */}
			<Matrix ripplesRef={ripplesRef} />

			<AnimatePresence>
				{!cookieEntered && (
					<motion.div
						className={styles.cookieWelcome}
						initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
						animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
						exit={{ opacity: 0, scale: 1.1, filter: "blur(12px)" }}
						transition={{
							type: "spring",
							stiffness: 100,
							damping: 20,
							duration: 0.5,
						}}
					>
						<div style={{ pointerEvents: "none" }}>
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
