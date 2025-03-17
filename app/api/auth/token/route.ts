import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
// import { setCookie } from "@/utils/cookies";
export async function POST(request: NextRequest) {
  try {
    const { code, clientId } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    const clientSecret = process.env.SUPABASE_CLIENT_SECRET;
    
    if (!clientSecret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const tokenUrl = `https://api.supabase.com/v1/oauth/token?client_id=${clientId}&client_secret=${clientSecret}`;
    
    const formData = new URLSearchParams();
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("redirect_uri", "http://localhost:3000");

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: "Failed to exchange token", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Set the access token in a cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "supabase_access_token",
      value: data.access_token,
      httpOnly: false,
      path: "/",
      maxAge: data.expires_in,
      secure: process.env.NODE_ENV === "production",
    });

    // Also store the client ID for future API calls
    cookieStore.set({
      name: "supabase_client_id",
      value: clientId,
      httpOnly: true,
      path: "/",
      maxAge: data.expires_in,
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
