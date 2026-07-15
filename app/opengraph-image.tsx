import { ImageResponse } from "next/og";
export const alt = "Ahmed Aziz Mhiri — Data-Driven Marketing & Commercial Analytics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() { return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, color: "white", background: "linear-gradient(135deg, #030014, #2a0e61 65%, #0891b2)", fontFamily: "sans-serif" }}><div style={{ fontSize: 30, color: "#67e8f9" }}>Turning Data into Commercial Growth</div><div style={{ fontSize: 68, fontWeight: 700, marginTop: 28 }}>Ahmed Aziz Mhiri</div><div style={{ fontSize: 38, marginTop: 22, color: "#ddd6fe" }}>Data-Driven Marketing &amp; Commercial Analytics</div></div>, size); }
