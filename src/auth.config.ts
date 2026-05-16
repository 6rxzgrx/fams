export const authConfig = {
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  callbacks: {
    authorized({ auth }: { auth: { user?: unknown } | null }) {
      return !!auth?.user
    },
    session({ session, token }: { session: { user?: { id?: string } }; token: { sub?: string } }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    },
  },
  providers: [] as [],
}
