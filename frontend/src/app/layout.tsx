// MediScan AI — Root layout
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediScan AI — Autonomous Chest X-Ray Triage",
  description: "Upload any chest radiograph. Our 4-model AI ensemble detects Pneumothorax, Edema, Pneumonia, Cardiomegaly, and Pleural Effusion — with urgency scoring and specialist routing in under 2 seconds.",
  keywords: ["chest x-ray", "AI triage", "pneumothorax", "medical imaging", "deep learning"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#030303" />
      </head>
      <body className="overflow-x-hidden antialiased" style={{ background: "#020c18", color: "var(--text)" }}>{children}</body>
    </html>
  );
}
