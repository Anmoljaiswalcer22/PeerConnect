import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { useAuthStore } from '../stores/authStore';
import { getFieldErrors } from '../lib/axios';
import { cn } from '../utils/cn';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same rules as the server (backend/src/validators/auth.schema.js)
const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'A letter', test: (p) => /[A-Za-z]/.test(p) },
  { label: 'A number', test: (p) => /\d/.test(p) },
];

export default function SignupPage() {
  const signup = useAuthStore((s) => s.signup);
  const isSigningUp = useAuthStore((s) => s.isSigningUp);
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    const name = form.fullName.trim();
    if (name.length < 2) next.fullName = 'Enter your name (at least 2 characters)';
    else if (name.length > 50) next.fullName = 'Name must be at most 50 characters';
    if (!EMAIL.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!PASSWORD_RULES.every((r) => r.test(form.password))) next.password = 'Password doesn’t meet the requirements below';
    else if (form.password.length > 72) next.password = 'Password must be at most 72 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const { ok, error } = await signup({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password });
    if (ok) navigate('/chat', { replace: true });
    else setErrors(getFieldErrors(error));
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          label="Full name"
          icon={UserRound}
          autoComplete="name"
          autoFocus
          placeholder="Asha Verma"
          value={form.fullName}
          onChange={update('fullName')}
          error={errors.fullName}
          maxLength={50}
        />
        <Input
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
        />
        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            autoComplete="new-password"
            placeholder="Create a password"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            maxLength={72}
            trailing={
              <IconButton label={showPassword ? 'Hide password' : 'Show password'} size="sm" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </IconButton>
            }
          />
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1" aria-label="Password requirements">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(form.password);
              return (
                <li key={rule.label} className={cn('inline-flex items-center gap-1 text-meta transition-colors', met ? 'text-success' : 'text-fg-subtle')}>
                  <Check className={cn('size-3', !met && 'opacity-40')} aria-hidden="true" />
                  {rule.label}
                  <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSigningUp}>
          {isSigningUp ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
