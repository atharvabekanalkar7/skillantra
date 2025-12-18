export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseClient } from "../../../lib/supabaseClient";

const ALLOWED_DOMAINS = [
  "@iitmandi.ac.in",
  "@students.iitmandi.ac.in",
];

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { email, password, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required and must be a string" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required and must be a string" },
        { status: 400 }
      );
    }

    if (!ALLOWED_DOMAINS.some((d) => email.endsWith(d))) {
      return NextResponse.json(
        { error: "Only IIT Mandi emails allowed" },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name || "",
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Signup successful. Verify your email.",
      user: data.user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
