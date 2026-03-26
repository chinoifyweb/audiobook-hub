import { createAuthOptions } from "@repo/auth";

export const authOptions = createAuthOptions({
  signInPage: "/login",
  signUpPage: "/signup",
  errorPage: "/login",
});
