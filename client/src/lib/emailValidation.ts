export interface EmailCheckResult {
  exists: boolean;
  source?: "registrations" | "users";
  message?: string;
  data?: any;
}

async function checkEmailViaBackend(email: string, context: "create" | "join"): Promise<EmailCheckResult> {
  const response = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email.trim().toLowerCase(), context }),
  });

  if (!response.ok) {
    throw new Error("Failed to verify email. Please try again.");
  }

  return response.json();
}

export async function checkEmailExists(email: string): Promise<EmailCheckResult> {
  try {
    return await checkEmailViaBackend(email, "create");
  } catch (error) {
    console.error("Error checking email existence:", error);
    throw new Error("Failed to verify email. Please try again.");
  }
}

export async function checkEmailForJoinNow(email: string): Promise<EmailCheckResult> {
  try {
    return await checkEmailViaBackend(email, "join");
  } catch (error) {
    console.error("Error checking email for Join Now:", error);
    throw new Error("Failed to verify email. Please try again.");
  }
}

export async function checkEmailForCreateAccount(email: string): Promise<EmailCheckResult> {
  try {
    return await checkEmailViaBackend(email, "create");
  } catch (error) {
    console.error("Error checking email for Create Account:", error);
    throw new Error("Failed to verify email. Please try again.");
  }
}
