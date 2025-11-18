"use client";

import React, { useState, useEffect, useRef } from "react";

import Image from "next/image";

import { motion, AnimatePresence } from "motion/react";

import { Gradient } from "@/components/Gradient";

import Matrix, { handleInteraction, Ripple } from "@/components/Matrix";

import styles from "./page.module.scss";

export default function Home() {
	const [cookieEntered, setCookieEntered] = useState<boolean>(false);
	const [cookiesClicked, setCookiesClicked] = useState<number>(0);
	const gradientRef = useRef<Gradient | null>(null);

	const ripplesRef = useRef<Ripple[]>([]);

	useEffect(() => {
		const gradient = new Gradient();
		gradientRef.current = gradient;

		const time = Date.now().toString().slice(3, 11);

		gradient.seed = 24;
		gradient.t = parseInt(time);

		console.log(time);

		gradient.initGradient("#gradient-canvas");

		return () => gradient.disconnect();
	}, []);

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
			onClick={() => setCookieEntered(true)}
		>
			<canvas
				id="gradient-canvas"
				className={styles.gradient}
				data-transition-in
			/>

			{/* 3. Pass the ref down to the component */}
			<Matrix ripplesRef={ripplesRef} />

			<AnimatePresence mode="wait">
				{!cookieEntered && (
					<motion.div
						key="cookie-welcome"
						className={styles.cookieWelcome}
						initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
						animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
						exit={{ opacity: 0, scale: 1.1, filter: "blur(12px)" }}
						transition={{
							type: "spring",
							stiffness: 100,
							damping: 20,
						}}
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
							opacity: { duration: 0.4, delay: 0.2 },
						}}
					>
						<div className={styles.title}>Cookie Clicker</div>
						<div className={styles.cookies}>
							<h1>{cookiesClicked}</h1>
							<Image src="/cookie.png" alt="Cookie" width={128} height={128} />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
