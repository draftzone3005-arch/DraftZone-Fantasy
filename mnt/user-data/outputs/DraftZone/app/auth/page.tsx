"use client";
import { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push("/squad");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0A0A0A]">
      {/* Logo */}
      <Link href="/" className="font-display text-3xl text-[#00C853] tracking-widest mb-12">
        DRAFT<span className="text-white">ZONE</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-8">
          <h1 className="font-display text-3xl text-white mb-2 tracking-wide">JOIN THE GAME</h1>
          <p className="text-gray-400 text-sm mb-8">Sign in to pick your World Cup squad</p>

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#00C853",
                    brandAccent: "#00a844",
                    brandButtonText: "#000000",
                    defaultButtonBackground: "#1a2332",
                    defaultButtonBackgroundHover: "#243040",
                    defaultButtonBorder: "rgba(255,255,255,0.1)",
                    defaultButtonText: "#ffffff",
                    dividerBackground: "rgba(255,255,255,0.1)",
                    inputBackground: "#0A0A0A",
                    inputBorder: "rgba(255,255,255,0.15)",
                    inputBorderHover: "#00C853",
                    inputBorderFocus: "#00C853",
                    inputText: "#ffffff",
                    inputPlaceholder: "#4b5563",
                    messageText: "#9ca3af",
                    anchorTextColor: "#00C853",
                    anchorTextHoverColor: "#00a844",
                  },
                  radii: {
                    borderRadiusButton: "8px",
                    buttonBorderRadius: "8px",
                    inputBorderRadius: "8px",
                  },
                },
              },
            }}
            providers={["google"]}
            onlyThirdPartyProviders={true}
            redirectTo={`${typeof window !== "undefined" ? window.location.origin : ""}/squad`}
          />
        </div>
      </div>
    </div>
  );
}
