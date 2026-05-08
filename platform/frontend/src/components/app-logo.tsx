"use client";

import { DEFAULT_APP_NAME } from "@shared";
import Image from "next/image";
import { useTheme } from "next-themes";
import config from "@/lib/config/config";
import { DEFAULT_APP_LOGO } from "@/lib/hooks/use-app-name";
import { useOrgTheme } from "@/lib/theme.hook";

interface AppLogoProps {
  /**
   * When true (default), the default logo is centered.
   * When false, it's left-aligned with padding (for sidebar use).
   */
  centered?: boolean;
}

export function AppLogo({ centered = true }: AppLogoProps) {
  const { logo, logoDark, isLoadingAppearance } = useOrgTheme() ?? {};
  const { resolvedTheme } = useTheme();
  const effectiveLogo = resolvedTheme === "dark" && logoDark ? logoDark : logo;

  if (isLoadingAppearance) {
    return <div className="h-[47px]" aria-hidden="true" />;
  }

  if (effectiveLogo) {
    return (
      <div className={`flex ${centered ? "justify-center" : "pl-8"}`}>
        <div className="flex flex-col items-center gap-1">
          {/* FIX for #4432: Wrap logo in a constrained container to handle
              non-standard aspect ratios. The container enforces h-12 (48px) height
              and max-w-full width, while the image uses h-full + w-auto + max-w-full
              to scale proportionally without overflowing. */}
          <div className="relative h-12 w-full max-w-[calc(100vw-6rem)] flex items-center justify-center overflow-hidden">
            <Image
              src={effectiveLogo}
              alt="Organization logo"
              width={200}
              height={60}
              className="h-full w-auto object-contain max-w-full"
            />
          </div>
          {!config.enterpriseFeatures.fullWhiteLabeling && (
            <p className="text-[10px] text-muted-foreground">
              Powered by {DEFAULT_APP_NAME}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${centered ? "justify-center" : ""}`}
    >
      <Image
        src={DEFAULT_APP_LOGO}
        alt="Logo"
        width={28}
        height={28}
        className="h-auto w-auto"
      />
      <span className="text-base font-semibold">{DEFAULT_APP_NAME}</span>
    </div>
  );
}
