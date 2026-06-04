import LoginForm from '@/modules/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="space-y-6">
        <LoginForm />
        <div className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
            Create one now
          </Link>
        </div>
      </div>
    </main>
  );
}
