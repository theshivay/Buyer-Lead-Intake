import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";

// Configure a demo account for easy access
const demoAccount = {
  id: "demo-user-id-123456",
  name: "Demo User",
  email: "demo@example.com",
  role: "USER",
  image: null,
  emailVerified: new Date(),
};

// Create NextAuth handler
const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    // Email magic link provider
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "localhost",
        port: process.env.EMAIL_SERVER_PORT ? parseInt(process.env.EMAIL_SERVER_PORT) : 1025,
        auth: {
          user: process.env.EMAIL_SERVER_USER || "",
          pass: process.env.EMAIL_SERVER_PASSWORD || "",
        },
      },
      from: process.env.EMAIL_FROM || "noreply@buyer-lead-intake.com",
    }),
    // Demo credentials provider
    CredentialsProvider({
      id: "credentials",
      name: "Demo Login",
      credentials: {},
      authorize: async () => {
        // Check if demo user exists in database
        let user = await prisma.user.findUnique({
          where: { email: demoAccount.email },
        });
        
        // Create demo user if it doesn't exist
        if (!user) {
          try {
            user = await prisma.user.create({
              data: {
                id: demoAccount.id,
                name: demoAccount.name,
                email: demoAccount.email,
                emailVerified: demoAccount.emailVerified,
                image: demoAccount.image,
              },
            });
            console.log("Created demo user:", user);
          } catch (error) {
            console.error("Failed to create demo user:", error);
          }
        } else {
          console.log("Demo user already exists:", user);
        }
        
        return demoAccount;
      },
    }),
  ],
  callbacks: {
    // Add user role to JWT token
    async jwt({ token, user }) {
      if (user) {
        console.log("JWT callback - User data:", { id: user.id, email: user.email });
        token.id = user.id;
        token.role = user.role || "USER";
      } else {
        console.log("JWT callback - No user data, token:", token);
      }
      return token;
    },
    // Add user role to session
    async session({ session, token }) {
      if (session.user) {
        console.log("Session callback - Token data:", { id: token.id, email: token.email });
        session.user.id = token.id || "demo-user"; // Fallback to demo-user if no id
        session.user.role = token.role || "USER";
      } else {
        console.log("Session callback - No user in session");
      }
      console.log("Final session:", session);
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
});

export { handler as GET, handler as POST };
