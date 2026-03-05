import ChildDetailClient from "./client";
import { children } from "@/lib/mockData";

export function generateStaticParams() {
  return children.map((child) => ({ id: child.id }));
}

export default function ChildDetailPage() {
  return <ChildDetailClient />;
}
