import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.scss";

const ubuntu = Ubuntu({
	subsets: ["latin"],
	weight: ["400", "500", "700"],
	variable: "--font-ubuntu",
});

export const metadata: Metadata = {
	title: "Cookie Clicker",
	description: "Click all dat cookies",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${ubuntu.variable} antialiased`}>{children}</body>
		</html>
	);
}
