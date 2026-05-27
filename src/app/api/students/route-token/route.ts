import { NextResponse } from "next/server";
import { encodeStudentRouteId } from "@/app/utils/studentRouteToken";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = Number(searchParams.get("id"));

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return NextResponse.json(
      { message: "A valid student ID is required." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      token: encodeStudentRouteId(studentId),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to generate the student route token.",
      },
      { status: 500 },
    );
  }
}
