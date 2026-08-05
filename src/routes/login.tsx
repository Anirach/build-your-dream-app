import { createFileRoute } from "@tanstack/react-router";

import { LoginScreen } from "@/components/app/login-screen";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in - BDMS Intelligence Mockup" },
      {
        name: "description",
        content:
          "Sign in to the BDMS Intelligence concept mockup with a sample admin, programme owner, reviewer, module lead or executive role.",
      },
      { property: "og:title", content: "Sign in - BDMS Intelligence Mockup" },
      {
        property: "og:description",
        content: "Choose a sample governance role to explore the commissioning readiness mockup.",
      },
    ],
  }),
  component: LoginScreen,
});
