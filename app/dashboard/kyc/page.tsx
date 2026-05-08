'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, MapPin, FileText, Check, ShieldCheck, 
  UploadCloud, Book, CreditCard, Truck, 
  ChevronRight, ArrowLeft, Loader2, XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const countries = [
  {"name": "Afghanistan", "code": "AF"}, {"name": "Albania", "code": "AL"}, {"name": "Algeria", "code": "DZ"},
  {"name": "American Samoa", "code": "AS"}, {"name": "Andorra", "code": "AD"}, {"name": "Angola", "code": "AO"},
  {"name": "Anguilla", "code": "AI"}, {"name": "Antarctica", "code": "AQ"}, {"name": "Antigua and Barbuda", "code": "AG"},
  {"name": "Argentina", "code": "AR"}, {"name": "Armenia", "code": "AM"}, {"name": "Aruba", "code": "AW"},
  {"name": "Australia", "code": "AU"}, {"name": "Austria", "code": "AT"}, {"name": "Azerbaijan", "code": "AZ"},
  {"name": "Bahamas", "code": "BS"}, {"name": "Bahrain", "code": "BH"}, {"name": "Bangladesh", "code": "BD"},
  {"name": "Barbados", "code": "BB"}, {"name": "Belarus", "code": "BY"}, {"name": "Belgium", "code": "BE"},
  {"name": "Belize", "code": "BZ"}, {"name": "Benin", "code": "BJ"}, {"name": "Bermuda", "code": "BM"},
  {"name": "Bhutan", "code": "BT"}, {"name": "Bolivia", "code": "BO"}, {"name": "Bosnia and Herzegovina", "code": "BA"},
  {"name": "Botswana", "code": "BW"}, {"name": "Brazil", "code": "BR"}, {"name": "British Indian Ocean Territory", "code": "IO"},
  {"name": "Brunei Darussalam", "code": "BN"}, {"name": "Bulgaria", "code": "BG"}, {"name": "Burkina Faso", "code": "BF"},
  {"name": "Burundi", "code": "BI"}, {"name": "Cabo Verde", "code": "CV"}, {"name": "Cambodia", "code": "KH"},
  {"name": "Cameroon", "code": "CM"}, {"name": "Canada", "code": "CA"}, {"name": "Cayman Islands", "code": "KY"},
  {"name": "Central African Republic", "code": "CF"}, {"name": "Chad", "code": "TD"}, {"name": "Chile", "code": "CL"},
  {"name": "China", "code": "CN"}, {"name": "Colombia", "code": "CO"}, {"name": "Comoros", "code": "KM"},
  {"name": "Congo", "code": "CG"}, {"name": "Congo, Democratic Republic of the", "code": "CD"}, {"name": "Cook Islands", "code": "CK"},
  {"name": "Costa Rica", "code": "CR"}, {"name": "Côte d'Ivoire", "code": "CI"}, {"name": "Croatia", "code": "HR"},
  {"name": "Cuba", "code": "CU"}, {"name": "Curacao", "code": "CW"}, {"name": "Cyprus", "code": "CY"},
  {"name": "Czech Republic", "code": "CZ"}, {"name": "Denmark", "code": "DK"}, {"name": "Djibouti", "code": "DJ"},
  {"name": "Dominica", "code": "DM"}, {"name": "Dominican Republic", "code": "DO"}, {"name": "Ecuador", "code": "EC"},
  {"name": "Egypt", "code": "EG"}, {"name": "El Salvador", "code": "SV"}, {"name": "Equatorial Guinea", "code": "GQ"},
  {"name": "Eritrea", "code": "ER"}, {"name": "Estonia", "code": "EE"}, {"name": "Eswatini", "code": "SZ"},
  {"name": "Ethiopia", "code": "ET"}, {"name": "Falkland Islands", "code": "FK"}, {"name": "Faroe Islands", "code": "FO"},
  {"name": "Fiji", "code": "FJ"}, {"name": "Finland", "code": "FI"}, {"name": "France", "code": "FR"},
  {"name": "French Guiana", "code": "GF"}, {"name": "French Polynesia", "code": "PF"}, {"name": "Gabon", "code": "GA"},
  {"name": "Gambia", "code": "GM"}, {"name": "Georgia", "code": "GE"}, {"name": "Germany", "code": "DE"},
  {"name": "Ghana", "code": "GH"}, {"name": "Gibraltar", "code": "GI"}, {"name": "Greece", "code": "GR"},
  {"name": "Greenland", "code": "GL"}, {"name": "Grenada", "code": "GD"}, {"name": "Guadeloupe", "code": "GP"},
  {"name": "Guam", "code": "GU"}, {"name": "Guatemala", "code": "GT"}, {"name": "Guernsey", "code": "GG"},
  {"name": "Guinea", "code": "GN"}, {"name": "Guinea-Bissau", "code": "GW"}, {"name": "Guyana", "code": "GY"},
  {"name": "Haiti", "code": "HT"}, {"name": "Holy See", "code": "VA"}, {"name": "Honduras", "code": "HN"},
  {"name": "Hong Kong", "code": "HK"}, {"name": "Hungary", "code": "HU"}, {"name": "Iceland", "code": "IS"},
  {"name": "India", "code": "IN"}, {"name": "Indonesia", "code": "ID"}, {"name": "Iran", "code": "IR"},
  {"name": "Iraq", "code": "IQ"}, {"name": "Ireland", "code": "IE"}, {"name": "Isle of Man", "code": "IM"},
  {"name": "Israel", "code": "IL"}, {"name": "Italy", "code": "IT"}, {"name": "Jamaica", "code": "JM"},
  {"name": "Japan", "code": "JP"}, {"name": "Jersey", "code": "JE"}, {"name": "Jordan", "code": "JO"},
  {"name": "Kazakhstan", "code": "KZ"}, {"name": "Kenya", "code": "KE"}, {"name": "Kiribati", "code": "KI"},
  {"name": "Korea, Democratic People's Republic of", "code": "KP"}, {"name": "Korea, Republic of", "code": "KR"},
  {"name": "Kuwait", "code": "KW"}, {"name": "Kyrgyzstan", "code": "KG"}, {"name": "Lao People's Democratic Republic", "code": "LA"},
  {"name": "Latvia", "code": "LV"}, {"name": "Lebanon", "code": "LB"}, {"name": "Lesotho", "code": "LS"},
  {"name": "Liberia", "code": "LR"}, {"name": "Libya", "code": "LY"}, {"name": "Liechtenstein", "code": "LI"},
  {"name": "Lithuania", "code": "LT"}, {"name": "Luxembourg", "code": "LU"}, {"name": "Macao", "code": "MO"},
  {"name": "Madagascar", "code": "MG"}, {"name": "Malawi", "code": "MW"}, {"name": "Malaysia", "code": "MY"},
  {"name": "Maldives", "code": "MV"}, {"name": "Mali", "code": "ML"}, {"name": "Malta", "code": "MT"},
  {"name": "Marshall Islands", "code": "MH"}, {"name": "Martinique", "code": "MQ"}, {"name": "Mauritania", "code": "MR"},
  {"name": "Mauritius", "code": "MU"}, {"name": "Mayotte", "code": "YT"}, {"name": "Mexico", "code": "MX"},
  {"name": "Micronesia", "code": "FM"}, {"name": "Moldova", "code": "MD"}, {"name": "Monaco", "code": "MC"},
  {"name": "Mongolia", "code": "MN"}, {"name": "Montenegro", "code": "ME"}, {"name": "Montserrat", "code": "MS"},
  {"name": "Morocco", "code": "MA"}, {"name": "Mozambique", "code": "MZ"}, {"name": "Myanmar", "code": "MM"},
  {"name": "Namibia", "code": "NA"}, {"name": "Nauru", "code": "NR"}, {"name": "Nepal", "code": "NP"},
  {"name": "Netherlands", "code": "NL"}, {"name": "New Caledonia", "code": "NC"}, {"name": "New Zealand", "code": "NZ"},
  {"name": "Nicaragua", "code": "NI"}, {"name": "Niger", "code": "NE"}, {"name": "Nigeria", "code": "NG"},
  {"name": "Niue", "code": "NU"}, {"name": "Norfolk Island", "code": "NF"}, {"name": "North Macedonia", "code": "MK"},
  {"name": "Norway", "code": "NO"}, {"name": "Oman", "code": "OM"}, {"name": "Pakistan", "code": "PK"},
  {"name": "Palau", "code": "PW"}, {"name": "Palestine, State of", "code": "PS"}, {"name": "Panama", "code": "PA"},
  {"name": "Papua New Guinea", "code": "PG"}, {"name": "Paraguay", "code": "PY"}, {"name": "Peru", "code": "PE"},
  {"name": "Philippines", "code": "PH"}, {"name": "Poland", "code": "PL"}, {"name": "Portugal", "code": "PT"},
  {"name": "Puerto Rico", "code": "PR"}, {"name": "Qatar", "code": "QA"}, {"name": "Réunion", "code": "RE"},
  {"name": "Romania", "code": "RO"}, {"name": "Russian Federation", "code": "RU"}, {"name": "Rwanda", "code": "RW"},
  {"name": "Saint Kitts and Nevis", "code": "KN"}, {"name": "Saint Lucia", "code": "LC"}, {"name": "Saint Vincent and the Grenadines", "code": "VC"},
  {"name": "Samoa", "code": "WS"}, {"name": "San Marino", "code": "SM"}, {"name": "Sao Tome and Principe", "code": "ST"},
  {"name": "Saudi Arabia", "code": "SA"}, {"name": "Senegal", "code": "SN"}, {"name": "Serbia", "code": "RS"},
  {"name": "Seychelles", "code": "SC"}, {"name": "Sierra Leone", "code": "SL"}, {"name": "Singapore", "code": "SG"},
  {"name": "Slovakia", "code": "SK"}, {"name": "Slovenia", "code": "SI"}, {"name": "Solomon Islands", "code": "SB"},
  {"name": "Somalia", "code": "SO"}, {"name": "South Africa", "code": "ZA"}, {"name": "South Sudan", "code": "SS"},
  {"name": "Spain", "code": "ES"}, {"name": "Sri Lanka", "code": "LK"}, {"name": "Sudan", "code": "SD"},
  {"name": "Suriname", "code": "SR"}, {"name": "Sweden", "code": "SE"}, {"name": "Switzerland", "code": "CH"},
  {"name": "Syrian Arab Republic", "code": "SY"}, {"name": "Taiwan", "code": "TW"}, {"name": "Tajikistan", "code": "TJ"},
  {"name": "Tanzania", "code": "TZ"}, {"name": "Thailand", "code": "TH"}, {"name": "Timor-Leste", "code": "TL"},
  {"name": "Togo", "code": "TG"}, {"name": "Tokelau", "code": "TK"}, {"name": "Tonga", "code": "TO"},
  {"name": "Trinidad and Tobago", "code": "TT"}, {"name": "Tunisia", "code": "TN"}, {"name": "Turkey", "code": "TR"},
  {"name": "Turkmenistan", "code": "TM"}, {"name": "Tuvalu", "code": "TV"}, {"name": "Uganda", "code": "UG"},
  {"name": "Ukraine", "code": "UA"}, {"name": "United Arab Emirates", "code": "AE"}, {"name": "United Kingdom", "code": "GB"},
  {"name": "United States", "code": "US"}, {"name": "Uruguay", "code": "UY"}, {"name": "Uzbekistan", "code": "UZ"},
  {"name": "Vanuatu", "code": "VU"}, {"name": "Venezuela", "code": "VE"}, {"name": "Vietnam", "code": "VN"},
  {"name": "Yemen", "code": "YE"}, {"name": "Zambia", "code": "ZM"}, {"name": "Zimbabwe", "code": "ZW"}
];

export default function KYCPage() {
  const { profile, refreshProfile } = useAuth();
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dob: '',
    email: '',
    gender: '',
    country: '',
    city: '',
    zip: '',
    address: '',
    idType: 'passport',
    idNumber: '',
    issueDate: '',
    expiryDate: ''
  });

  const steps = [
    { id: 1, label: 'Personal', icon: User },
    { id: 2, label: 'Demographic', icon: MapPin },
    { id: 3, label: 'Identification', icon: FileText }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // In a real application, we'd store all this metadata in a kyc_submissions table
      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'pending',
          country: formData.country,
          // Store other data as needed
        })
        .eq('id', profile?.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success('KYC application submitted successfully!');
      setIsStarted(false);
      setCurrentStep(1);
    } catch (error: any) {
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return null;

  // If already verified or pending, show status
  if (profile.kyc_status === 'verified' || (profile.kyc_status === 'pending' && !isStarted)) {
    return (
      <div className="max-w-xl mx-auto mt-12 text-center p-8 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {profile.kyc_status === 'verified' ? 'Account Verified' : 'Verification Pending'}
        </h1>
        <p className="text-slate-400 mb-8">
          {profile.kyc_status === 'verified' 
            ? 'Your identity has been verified. You now have full access to all platform features.' 
            : 'We are currently reviewing your documents. This process usually takes 24-48 hours.'}
        </p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <AnimatePresence mode="wait">
        {!isStarted ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center p-12 bg-white/[0.03] border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl"
          >
            <div className="mb-8 text-blue-500 flex justify-center">
              <ShieldCheck size={80} strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
              Complete Your Verification
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              To ensure the security of your account and comply with financial regulations, please complete your identity verification. It only takes a few minutes.
            </p>
            {profile.kyc_status === 'rejected' && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-left max-w-md mx-auto">
                <XCircle className="text-red-400 shrink-0" size={24} />
                <div>
                  <h4 className="text-sm font-bold text-red-400">Previous Application Rejected</h4>
                  <p className="text-xs text-red-300/70">Please review your information and submit clearer documents.</p>
                </div>
              </div>
            )}
            <button 
              onClick={() => setIsStarted(true)}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
            >
              Proceed with Verification
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="wizard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1e293b] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[600px]"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">KYC Verification</h2>
                <p className="text-xs text-slate-400">Step {currentStep} of 3</p>
              </div>
              <button 
                onClick={() => setIsStarted(false)}
                className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            </div>

            {/* Stepper */}
            <div className="px-12 py-8 bg-black/10 relative">
              <div className="absolute top-[52px] left-[60px] right-[60px] h-[2px] bg-white/5 z-0">
                <motion.div 
                  className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <div className="flex justify-between relative z-10">
                {steps.map((s) => {
                  const Icon = s.icon;
                  const isActive = currentStep === s.id;
                  const isCompleted = currentStep > s.id;
                  return (
                    <div key={s.id} className="flex flex-col items-center gap-3">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isActive ? 'bg-blue-600 border-blue-500 scale-110 shadow-lg shadow-blue-500/30' : 
                          isCompleted ? 'bg-emerald-500 border-emerald-400' : 
                          'bg-[#1e293b] border-white/10'
                        }`}
                      >
                        {isCompleted ? <Check size={20} className="text-white" /> : <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500'} />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-500'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-10 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                        <input type="text" value={profile.full_name || ''} readOnly className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                        <input type="email" value={profile.email || ''} readOnly className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone Number</label>
                        <input type="text" value={profile.phone || 'Not provided'} readOnly className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date of Birth</label>
                        <input 
                          type="date" 
                          name="dob" 
                          value={formData.dob} 
                          onChange={handleInputChange} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gender</label>
                        <select 
                          name="gender" 
                          value={formData.gender} 
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Country of Residence</label>
                        <select 
                          name="country" 
                          value={formData.country} 
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                        >
                          <option value="">Select Country</option>
                          {countries.map(c => (
                            <option key={c.code} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">City</label>
                        <input 
                          type="text" 
                          name="city" 
                          placeholder="e.g. London" 
                          value={formData.city} 
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zip / Postal Code</label>
                        <input 
                          type="text" 
                          name="zip" 
                          placeholder="e.g. SW1A 1AA" 
                          value={formData.zip} 
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Street Address</label>
                        <input 
                          type="text" 
                          name="address" 
                          placeholder="e.g. 10 Downing St" 
                          value={formData.address} 
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'passport', label: 'Passport', icon: Book },
                          { id: 'id-card', label: 'National ID', icon: CreditCard },
                          { id: 'license', label: 'Driver\'s License', icon: Truck },
                        ].map((type) => {
                          const Icon = type.icon;
                          const isSel = formData.idType === type.id;
                          return (
                            <button
                              key={type.id}
                              onClick={() => setFormData(prev => ({ ...prev, idType: type.id }))}
                              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                                isSel ? 'bg-blue-500/10 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                              }`}
                            >
                              <Icon size={24} />
                              <span className="text-xs font-semibold">{type.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {formData.idType === 'passport' ? 'Passport Number' : 
                             formData.idType === 'id-card' ? 'National ID Number' : 
                             "Driver's License Number"}
                          </label>
                          <input 
                            type="text" 
                            name="idNumber" 
                            placeholder="Enter number" 
                            value={formData.idNumber} 
                            onChange={handleInputChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issue Date</label>
                          <input 
                            type="date" 
                            name="issueDate" 
                            value={formData.issueDate} 
                            onChange={handleInputChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expiry Date</label>
                          <input 
                            type="date" 
                            name="expiryDate" 
                            value={formData.expiryDate} 
                            onChange={handleInputChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" 
                          />
                        </div>
                      </div>

                      <div 
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="border-2 border-dashed border-white/10 rounded-3xl p-8 text-center cursor-pointer hover:bg-white/[0.02] transition-all group"
                      >
                        <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        {uploadPreview ? (
                          <div className="relative inline-block">
                            <img src={uploadPreview} alt="ID Preview" className="h-48 rounded-2xl mx-auto shadow-2xl" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                              <p className="text-white text-xs font-bold">Change Image</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-400 group-hover:text-blue-400 transition-colors">
                              <UploadCloud size={32} />
                            </div>
                            <div>
                              <p className="text-white font-semibold">Click to upload or drag and drop</p>
                              <p className="text-xs text-slate-500 mt-1">Valid ID Document (JPG, PNG, max 5MB)</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-white/5 bg-black/20 flex justify-end gap-4">
              {currentStep > 1 && (
                <button 
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all"
                >
                  Back
                </button>
              )}
              {currentStep < 3 ? (
                <button 
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Verification'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
