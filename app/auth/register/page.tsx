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
  phone_country_code: z.string().min(1, 'Select country code'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  country: z.string().min(1, 'Select your country'),
  city: z.string().min(2, 'Enter your city'),
  street: z.string().min(3, 'Enter your street address'),
  postal_code: z.string().min(2, 'Enter postal/zip code'),
  house_number: z.string().min(1, 'Enter house/apartment number'),
  referral_code: z.string().optional(),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

const countries = [
  { name: 'Afghanistan', code: 'AF' }, { name: 'Åland Islands', code: 'AX' }, { name: 'Albania', code: 'AL' }, { name: 'Algeria', code: 'DZ' },
  { name: 'American Samoa', code: 'AS' }, { name: 'Andorra', code: 'AD' }, { name: 'Angola', code: 'AO' }, { name: 'Anguilla', code: 'AI' },
  { name: 'Antarctica', code: 'AQ' }, { name: 'Antigua and Barbuda', code: 'AG' }, { name: 'Argentina', code: 'AR' }, { name: 'Armenia', code: 'AM' },
  { name: 'Aruba', code: 'AW' }, { name: 'Australia', code: 'AU' }, { name: 'Austria', code: 'AT' }, { name: 'Azerbaijan', code: 'AZ' },
  { name: 'Bahamas', code: 'BS' }, { name: 'Bahrain', code: 'BH' }, { name: 'Bangladesh', code: 'BD' }, { name: 'Barbados', code: 'BB' },
  { name: 'Belarus', code: 'BY' }, { name: 'Belgium', code: 'BE' }, { name: 'Belize', code: 'BZ' }, { name: 'Benin', code: 'BJ' },
  { name: 'Bermuda', code: 'BM' }, { name: 'Bhutan', code: 'BT' }, { name: 'Bolivia', code: 'BO' }, { name: 'Bosnia and Herzegovina', code: 'BA' },
  { name: 'Botswana', code: 'BW' }, { name: 'Bouvet Island', code: 'BV' }, { name: 'Brazil', code: 'BR' }, { name: 'British Indian Ocean Territory', code: 'IO' },
  { name: 'Brunei Darussalam', code: 'BN' }, { name: 'Bulgaria', code: 'BG' }, { name: 'Burkina Faso', code: 'BF' }, { name: 'Burundi', code: 'BI' },
  { name: 'Cambodia', code: 'KH' }, { name: 'Cameroon', code: 'CM' }, { name: 'Canada', code: 'CA' }, { name: 'Cape Verde', code: 'CV' },
  { name: 'Cayman Islands', code: 'KY' }, { name: 'Central African Republic', code: 'CF' }, { name: 'Chad', code: 'TD' }, { name: 'Chile', code: 'CL' },
  { name: 'China', code: 'CN' }, { name: 'Christmas Island', code: 'CX' }, { name: 'Cocos (Keeling) Islands', code: 'CC' }, { name: 'Colombia', code: 'CO' },
  { name: 'Comoros', code: 'KM' }, { name: 'Congo', code: 'CG' }, { name: 'Congo, Democratic Republic of the', code: 'CD' }, { name: 'Cook Islands', code: 'CK' },
  { name: 'Costa Rica', code: 'CR' }, { name: 'Cote D\'Ivoire', code: 'CI' }, { name: 'Croatia', code: 'HR' }, { name: 'Cuba', code: 'CU' },
  { name: 'Cyprus', code: 'CY' }, { name: 'Czech Republic', code: 'CZ' }, { name: 'Denmark', code: 'DK' }, { name: 'Djibouti', code: 'DJ' },
  { name: 'Dominica', code: 'DM' }, { name: 'Dominican Republic', code: 'DO' }, { name: 'Ecuador', code: 'EC' }, { name: 'Egypt', code: 'EG' },
  { name: 'El Salvador', code: 'SV' }, { name: 'Equatorial Guinea', code: 'GQ' }, { name: 'Eritrea', code: 'ER' }, { name: 'Estonia', code: 'EE' },
  { name: 'Ethiopia', code: 'ET' }, { name: 'Falkland Islands (Malvinas)', code: 'FK' }, { name: 'Faroe Islands', code: 'FO' }, { name: 'Fiji', code: 'FJ' },
  { name: 'Finland', code: 'FI' }, { name: 'France', code: 'FR' }, { name: 'French Guiana', code: 'GF' }, { name: 'French Polynesia', code: 'PF' },
  { name: 'French Southern Territories', code: 'TF' }, { name: 'Gabon', code: 'GA' }, { name: 'Gambia', code: 'GM' }, { name: 'Georgia', code: 'GE' },
  { name: 'Germany', code: 'DE' }, { name: 'Ghana', code: 'GH' }, { name: 'Gibraltar', code: 'GI' }, { name: 'Greece', code: 'GR' },
  { name: 'Greenland', code: 'GL' }, { name: 'Grenada', code: 'GD' }, { name: 'Guadeloupe', code: 'GP' }, { name: 'Guam', code: 'GU' },
  { name: 'Guatemala', code: 'GT' }, { name: 'Guernsey', code: 'GG' }, { name: 'Guinea', code: 'GN' }, { name: 'Guinea-Bissau', code: 'GW' },
  { name: 'Guyana', code: 'GY' }, { name: 'Haiti', code: 'HT' }, { name: 'Heard Island and Mcdonald Islands', code: 'HM' }, { name: 'Holy See (Vatican City State)', code: 'VA' },
  { name: 'Honduras', code: 'HN' }, { name: 'Hong Kong', code: 'HK' }, { name: 'Hungary', code: 'HU' }, { name: 'Iceland', code: 'IS' },
  { name: 'India', code: 'IN' }, { name: 'Indonesia', code: 'ID' }, { name: 'Iran, Islamic Republic Of', code: 'IR' }, { name: 'Iraq', code: 'IQ' },
  { name: 'Ireland', code: 'IE' }, { name: 'Isle of Man', code: 'IM' }, { name: 'Israel', code: 'IL' }, { name: 'Italy', code: 'IT' },
  { name: 'Jamaica', code: 'JM' }, { name: 'Japan', code: 'JP' }, { name: 'Jersey', code: 'JE' }, { name: 'Jordan', code: 'JO' },
  { name: 'Kazakhstan', code: 'KZ' }, { name: 'Kenya', code: 'KE' }, { name: 'Kiribati', code: 'KI' }, { name: 'Korea, Democratic People\'S Republic of', code: 'KP' },
  { name: 'Korea, Republic of', code: 'KR' }, { name: 'Kuwait', code: 'KW' }, { name: 'Kyrgyzstan', code: 'KG' }, { name: 'Lao People\'S Democratic Republic', code: 'LA' },
  { name: 'Latvia', code: 'LV' }, { name: 'Lebanon', code: 'LB' }, { name: 'Lesotho', code: 'LS' }, { name: 'Liberia', code: 'LR' },
  { name: 'Libyan Arab Jamahiriya', code: 'LY' }, { name: 'Liechtenstein', code: 'LI' }, { name: 'Lithuania', code: 'LT' }, { name: 'Luxembourg', code: 'LU' },
  { name: 'Macao', code: 'MO' }, { name: 'Macedonia, The Former Yugoslav Republic of', code: 'MK' }, { name: 'Madagascar', code: 'MG' }, { name: 'Malawi', code: 'MW' },
  { name: 'Malaysia', code: 'MY' }, { name: 'Maldives', code: 'MV' }, { name: 'Mali', code: 'ML' }, { name: 'Malta', code: 'MT' },
  { name: 'Marshall Islands', code: 'MH' }, { name: 'Martinique', code: 'MQ' }, { name: 'Mauritania', code: 'MR' }, { name: 'Mauritius', code: 'MU' },
  { name: 'Mayotte', code: 'YT' }, { name: 'Mexico', code: 'MX' }, { name: 'Micronesia, Federated States of', code: 'FM' }, { name: 'Moldova, Republic of', code: 'MD' },
  { name: 'Monaco', code: 'MC' }, { name: 'Mongolia', code: 'MN' }, { name: 'Montenegro', code: 'ME' }, { name: 'Montserrat', code: 'MS' },
  { name: 'Morocco', code: 'MA' }, { name: 'Mozambique', code: 'MZ' }, { name: 'Myanmar', code: 'MM' }, { name: 'Namibia', code: 'NA' },
  { name: 'Nauru', code: 'NR' }, { name: 'Nepal', code: 'NP' }, { name: 'Netherlands', code: 'NL' }, { name: 'Netherlands Antilles', code: 'AN' },
  { name: 'New Caledonia', code: 'NC' }, { name: 'New Zealand', code: 'NZ' }, { name: 'Nicaragua', code: 'NI' }, { name: 'Niger', code: 'NE' },
  { name: 'Nigeria', code: 'NG' }, { name: 'Niue', code: 'NU' }, { name: 'Norfolk Island', code: 'NF' }, { name: 'Northern Mariana Islands', code: 'MP' },
  { name: 'Norway', code: 'NO' }, { name: 'Oman', code: 'OM' }, { name: 'Pakistan', code: 'PK' }, { name: 'Palau', code: 'PW' },
  { name: 'Palestinian Territory, Occupied', code: 'PS' }, { name: 'Panama', code: 'PA' }, { name: 'Papua New Guinea', code: 'PG' }, { name: 'Paraguay', code: 'PY' },
  { name: 'Peru', code: 'PE' }, { name: 'Philippines', code: 'PH' }, { name: 'Pitcairn', code: 'PN' }, { name: 'Poland', code: 'PL' },
  { name: 'Portugal', code: 'PT' }, { name: 'Puerto Rico', code: 'PR' }, { name: 'Qatar', code: 'QA' }, { name: 'Reunion', code: 'RE' },
  { name: 'Romania', code: 'RO' }, { name: 'Russian Federation', code: 'RU' }, { name: 'Rwanda', code: 'RW' }, { name: 'Saint Helena', code: 'SH' },
  { name: 'Saint Kitts and Nevis', code: 'KN' }, { name: 'Saint Lucia', code: 'LC' }, { name: 'Saint Pierre and Miquelon', code: 'PM' }, { name: 'Saint Vincent and the Grenadines', code: 'VC' },
  { name: 'Samoa', code: 'WS' }, { name: 'San Marino', code: 'SM' }, { name: 'Sao Tome and Principe', code: 'ST' }, { name: 'Saudi Arabia', code: 'SA' },
  { name: 'Senegal', code: 'SN' }, { name: 'Serbia', code: 'RS' }, { name: 'Seychelles', code: 'SC' }, { name: 'Sierra Leone', code: 'SL' },
  { name: 'Singapore', code: 'SG' }, { name: 'Slovakia', code: 'SK' }, { name: 'Slovenia', code: 'SI' }, { name: 'Solomon Islands', code: 'SB' },
  { name: 'Somalia', code: 'SO' }, { name: 'South Africa', code: 'ZA' }, { name: 'South Georgia and the South Sandwich Islands', code: 'GS' }, { name: 'Spain', code: 'ES' },
  { name: 'Sri Lanka', code: 'LK' }, { name: 'Sudan', code: 'SD' }, { name: 'Suriname', code: 'SR' }, { name: 'Svalbard and Jan Mayen', code: 'SJ' },
  { name: 'Swaziland', code: 'SZ' }, { name: 'Sweden', code: 'SE' }, { name: 'Switzerland', code: 'CH' }, { name: 'Syrian Arab Republic', code: 'SY' },
  { name: 'Taiwan, Province of China', code: 'TW' }, { name: 'Tajikistan', code: 'TJ' }, { name: 'Tanzania, United Republic of', code: 'TZ' }, { name: 'Thailand', code: 'TH' },
  { name: 'Timor-Leste', code: 'TL' }, { name: 'Togo', code: 'TG' }, { name: 'Tokelau', code: 'TK' }, { name: 'Tonga', code: 'TO' },
  { name: 'Trinidad and Tobago', code: 'TT' }, { name: 'Tunisia', code: 'TN' }, { name: 'Turkey', code: 'TR' }, { name: 'Turkmenistan', code: 'TM' },
  { name: 'Turks and Caicos Islands', code: 'TC' }, { name: 'Tuvalu', code: 'TV' }, { name: 'Uganda', code: 'UG' }, { name: 'Ukraine', code: 'UA' },
  { name: 'United Arab Emirates', code: 'AE' }, { name: 'United Kingdom', code: 'GB' }, { name: 'United States', code: 'US' }, { name: 'United States Minor Outlying Islands', code: 'UM' },
  { name: 'Uruguay', code: 'UY' }, { name: 'Uzbekistan', code: 'UZ' }, { name: 'Vanuatu', code: 'VU' }, { name: 'Venezuela', code: 'VE' },
  { name: 'Viet Nam', code: 'VN' }, { name: 'Virgin Islands, British', code: 'VG' }, { name: 'Virgin Islands, U.S.', code: 'VI' }, { name: 'Wallis and Futuna', code: 'WF' },
  { name: 'Western Sahara', code: 'EH' }, { name: 'Yemen', code: 'YE' }, { name: 'Zambia', code: 'ZM' }, { name: 'Zimbabwe', code: 'ZW' }
];

const countryCodes = [
  { code: '1', country: 'US/CA' }, { code: '44', country: 'GB' }, { code: '234', country: 'NG' }, { code: '27', country: 'ZA' },
  { code: '91', country: 'IN' }, { code: '61', country: 'AU' }, { code: '49', country: 'DE' }, { code: '33', country: 'FR' },
  { code: '81', country: 'JP' }, { code: '65', country: 'SG' }, { code: '971', country: 'AE' }, { code: '966', country: 'SA' },
  { code: '55', country: 'BR' }, { code: '52', country: 'MX' }, { code: '7', country: 'RU' }, { code: '34', country: 'ES' },
  { code: '39', country: 'IT' }, { code: '86', country: 'CN' }, { code: '90', country: 'TR' }, { code: '82', country: 'KR' },
  { code: '41', country: 'CH' }, { code: '31', country: 'NL' }, { code: '46', country: 'SE' }, { code: '60', country: 'MY' },
  { code: '66', country: 'TH' }, { code: '62', country: 'ID' }, { code: '63', country: 'PH' }, { code: '84', country: 'VN' },
  { code: '92', country: 'PK' }, { code: '20', country: 'EG' }, { code: '233', country: 'GH' }, { code: '254', country: 'KE' }
].sort((a, b) => a.country.localeCompare(b.country));

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
      ? ['full_name', 'username', 'email', 'phone_country_code', 'phone', 'password', 'confirm_password'] 
      : ['country', 'city', 'street', 'postal_code', 'house_number', 'terms'];
    
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

      const fullAddress = `${data.house_number}, ${data.street}, ${data.city}, ${data.postal_code}, ${data.country}`;

      await supabase.from('profiles').upsert({ 
        id: authData.user.id,
        full_name: data.full_name,
        username: data.username,
        referred_by: referredById,
        phone_country_code: data.phone_country_code,
        phone: data.phone,
        country: data.country,
        city: data.city,
        street: data.street,
        postal_code: data.postal_code,
        house_number: data.house_number,
        address: fullAddress,
        referral_code: Math.random().toString(36).substring(2, 10).toUpperCase()
      }, { onConflict: 'id' });

      if (referredById) {
        await supabase.from('referrals').upsert({
          referrer_id: referredById,
          referred_id: authData.user.id,
        }, { onConflict: 'referrer_id,referred_id' });
      }

      toast.dismiss(loadingToast);
      setStep(3); // Show verification success state

    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'Google Sign-in failed');
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
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-blue-500' : 'bg-white/10'}`} />
              ))}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {step === 1 ? 'Personal Details' : step === 2 ? 'Location Details' : 'Verify Email'}
            </h1>
            <p className="text-slate-400 text-sm">
              {step === 1 ? 'Step 1 of 2: Let\'s get to know you' : step === 2 ? 'Step 2 of 2: Where are you based?' : 'Final Step: Check your inbox'}
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
                  <div className="flex gap-2">
                    <div className="relative w-32 flex-shrink-0">
                      <select {...register('phone_country_code')} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all appearance-none">
                        <option value="">Code</option>
                        {countryCodes.map((c) => (
                          <option key={c.code} value={c.code}>+{c.code} ({c.country})</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative flex-1">
                      <input {...register('phone')} placeholder="1234567890" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all" />
                    </div>
                  </div>
                  {(errors.phone || errors.phone_country_code) && <p className="mt-1 text-xs text-red-400">{errors.phone?.message || errors.phone_country_code?.message}</p>}
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
                  Next <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#060d1a] px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3 border border-white/10"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Sign up with Google
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">Country</label>
                    <select {...register('country')} className="w-full bg-[#060d1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all appearance-none">
                      <option value="">Select Country</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    {errors.country && <p className="mt-1 text-xs text-red-400">{errors.country.message}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">City</label>
                    <input {...register('city')} placeholder="New York" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all" />
                    {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city.message}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">Postal/Zip Code</label>
                    <input {...register('postal_code')} placeholder="10001" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all" />
                    {errors.postal_code && <p className="mt-1 text-xs text-red-400">{errors.postal_code.message}</p>}
                  </div>

                  <div className="col-span-2 grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-300 mb-1.5 block">Street Address</label>
                      <input {...register('street')} placeholder="Wall Street" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all" />
                      {errors.street && <p className="mt-1 text-xs text-red-400">{errors.street.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-300 mb-1.5 block">House No.</label>
                      <input {...register('house_number')} placeholder="12A" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all" />
                      {errors.house_number && <p className="mt-1 text-xs text-red-400">{errors.house_number.message}</p>}
                    </div>
                  </div>
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

                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
                  <Mail size={40} className="text-blue-500 animate-bounce" />
                </div>
                <h2 className="text-xl font-bold text-white mb-3">Check your email</h2>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  We've sent a verification link to your email. Please click the link to activate your account and start trading.
                </p>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all glow-blue"
                >
                  Return to Login
                </button>
                <p className="mt-6 text-xs text-slate-500">
                  Didn't receive the email? Check your spam folder or contact support.
                </p>
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
