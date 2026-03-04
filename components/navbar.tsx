"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSchools } from "@/lib/mockApi";
import { School } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const role = useAppStore((state) => state.role);
  const activeSchoolId = useAppStore((state) => state.activeSchoolId);
  const supervisorSchoolId = useAppStore((state) => state.supervisorSchoolId);
  const setRole = useAppStore((state) => state.setRole);
  const setActiveSchoolId = useAppStore((state) => state.setActiveSchoolId);
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    getSchools().then(setSchools);
  }, []);

  const supervisorSchool = schools.find((school) => school.id === supervisorSchoolId);

  return (
    <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
            FC
          </div>
          <div>
            <Link href="/app" className="text-lg font-semibold text-slate-900">
              FeedClass
            </Link>
            <p className="text-xs text-slate-500">School Meal Management Software</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {role === "ADMIN" && (
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-xs uppercase text-slate-400">School Context</span>
              <Select value={activeSchoolId} onValueChange={setActiveSchoolId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {role === "SUPERVISOR" && supervisorSchool && (
            <Badge variant="secondary">My School: {supervisorSchool.name}</Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Role: {role.replace("_", " ")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRole("ADMIN")}>ADMIN</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole("SUPERVISOR")}>SUPERVISOR</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole("DONOR_READONLY")}>
                DONOR_READONLY
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
