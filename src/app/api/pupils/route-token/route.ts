import { NextResponse } from "next/server";
import { encodePupilRouteId } from "@/app/utils/pupilRouteToken";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pupilId = Number(searchParams.get("id"));

  if (!Number.isInteger(pupilId) || pupilId <= 0) {
    return NextResponse.json(
      { message: "A valid pupil ID is required." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      token: encodePupilRouteId(pupilId),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to generate the pupil route token.",
      },
      { status: 500 },
    );
  }
}
