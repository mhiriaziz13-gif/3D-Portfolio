import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };
export default function AdminLayout({ children }: PropsWithChildren) { return children; }
