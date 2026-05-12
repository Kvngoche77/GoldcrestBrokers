'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, TrendingUp, Loader as Loader2, Mail, Lock, User, Gift, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  country: z.string().min(1, 'Select your country'),
  address: z.string().min(5, 'Enter your residential address'),
  referral_code: z.string().optional(),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
];

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') ?? '';

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { referral_code: refCode },
  });

  const nextStep = async () => {
    const fields = step === 1 
      ? ['full_name', 'username', 'email', 'phone', 'password', 'confirm_password'] 
      : ['country', 'address', 'terms'];
    
    const isValid = await trigger(fields as any);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const password = watch('password', '');
  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const loadingToast = toast.loading('Creating your account... Please wait.');
    
    try {
      let referredById: string | undefined;
      if (data.referral_code) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', data.referral_code.toUpperCase())
          .maybeSingle();
        if (referrer) referredById = referrer.id;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            username: data.username,
          },
        },
      });

      if (signUpError) {
        toast.dismiss(loadingToast);
        toast.error(signUpError.message || 'Signup failed.');
        return;
      }

      if (!authData.user) {
        toast.dismiss(loadingToast);
        toast.error('Signup successful, please login.');
        return;
      }

      await supabase.from('profiles').upsert({ 
        id: authData.user.id,
        full_name: data.full_name,
        username: data.username,
        referred_by: referredById,
        phone: data.phone,
        country: data.country,
        address: data.address,
        referral_code: Math.random().toString(36).substring(2, 10).toUpperCase()
      }, { onConflict: 'id' });

      if (referredById) {
        await supabase.from('referrals').upsert({
          referrer_id: referredById,
          referred_id: authData.user.id,
        }, { onConflict: 'referrer_id,referred_id' });
      }

      toast.dismiss(loadingToast);
      toast.success('Account created!');
      setTimeout(() => router.push('/auth/kyc-onboarding'), 1000);

    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#040c18] hero-gradient grid-pattern flex items-center justify-center p-4 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #1d6ef5, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #10d982, transparent)' }} />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center glow-blue">
            <TrendingUp size={22} className="text-white" />
          </div>
          <span className="font-bold text-2xl">
            <span className="text-white">Goldcrest</span>
            <span className="gradient-text">Broker</span>
          </span>
        </Link>

        <div className="glass-strong rounded-3xl p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              {[1, 2].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-blue-500' : 'bg-white/10'}`} />
              ))}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {step === 1 ? 'Personal Details' : 'Location Details'}
            </h1>
            <p className="text-slate-400 text-sm">
              {step === 1 ? 'Step 1 of 2: Let\'s get to know you' : 'Step 2 of 2: Where are you based?'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input {...register('full_name')} placeholder="John Doe" className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all" />
                    </div>
                    {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">Username</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                      <input {...register('username')} placeholder="johndoe" className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all" />
                    </div>
                    {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input {...register('email')} type="email" placeholder="you@example.com" className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all" />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">+</span>
                    <input {...register('phone')} placeholder="1234567890" className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all" />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-white/10'}`} />
                      ))}
                    </div>
                  )}
                  {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input {...register('confirm_password')} type="password" placeholder="••••••••" className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all" />
                  </div>
                  {errors.confirm_password && <p className="mt-1 text-xs text-red-400">{errors.confirm_password.message}</p>}
                </div>

                <button type="button" onClick={nextStep} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue group mt-4">
                  Continue to Location <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Country</label>
                  <select {...register('country')} className="w-full bg-[#060d1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all appearance-none">
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  {errors.country && <p className="mt-1 text-xs text-red-400">{errors.country.message}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Residential Address</label>
                  <textarea {...register('address')} placeholder="Full street address, city, state" rows={3} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all resize-none" />
                  {errors.address && <p className="mt-1 text-xs text-red-400">{errors.address.message}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Referral Code (Optional)</label>
                  <div className="relative">
                    <Gift size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input {...register('referral_code')} placeholder="Enter code" className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all uppercase" />
                  </div>
                </div>

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input {...register('terms')} type="checkbox" className="sr-only peer" />
                    <div className="w-4 h-4 rounded border border-white/20 peer-checked:bg-blue-600 flex items-center justify-center mt-0.5">
                      <Check size={10} className="text-white hidden peer-checked:block" />
                    </div>
                    <span className="text-xs text-slate-400">I agree to the Terms and Privacy Policy</span>
                  </label>
                  {errors.terms && <p className="mt-1 text-xs text-red-400">{errors.terms.message}</p>}
                </div>

                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={prevStep} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all">
                    Back
                  </button>
                  <button type="submit" disabled={isLoading} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue">
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Complete Sign Up'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account? <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
