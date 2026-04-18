import { NextResponse } from "next/server";
import rawUsers from "@/app/data/users.json";
import type { AdminUser } from "@/app/types/userTypes";
import { createUsersResponse, normalizeUserRecord, parseUsersQueryOptions } from "@/app/utils/usersApi";

const users = (rawUsers as AdminUser[]).map(normalizeUserRecord);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const response = createUsersResponse(users, {
    ...parseUsersQueryOptions(searchParams),
    basePath: "/api/users",
  });

  return NextResponse.json(response);
}
