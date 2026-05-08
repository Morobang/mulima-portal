import { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to the Mulima Secondary School portal',
}

export default function LoginPage() {
  return <LoginForm />
}