// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                const email = credentials?.email as string;
                const password = credentials?.password as string;

                if (!email || !password) return null;

                const [rows] = await pool.query<RowDataPacket[]>(
                    'SELECT id, username, email, password_hash, avatar_url, role FROM users WHERE email = ?',
                    [email]
                );

                if (rows.length === 0) return null;

                const user = rows[0];
                const passwordMatch = await bcrypt.compare(password, user.password_hash);

                if (!passwordMatch) return null;

                return {
                    id: user.id,
                    name: user.username,
                    email: user.email,
                    image: user.avatar_url,
                    role: user.role,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
});