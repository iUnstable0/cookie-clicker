import styles from "./page.module.scss";

export default function Home() {
	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Cookie Clicker</h1>

			<div className={styles.buttonContainer}>
				<button className={styles.button}>Start</button>
				<button className={styles.button}>Start</button>
			</div>
		</div>
	);
}
