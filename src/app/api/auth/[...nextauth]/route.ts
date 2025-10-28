import { authOptions } from '@/app/lib/auth-config';
import NextAuth from 'next-auth';
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
