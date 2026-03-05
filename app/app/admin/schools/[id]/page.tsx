import SchoolDetailClient from "./client";
import { schools } from "@/lib/mockData";

export function generateStaticParams() {
  return schools.map((school) => ({ id: school.id }));
}

export default function SchoolDetailPage() {
  return <SchoolDetailClient />;
}
