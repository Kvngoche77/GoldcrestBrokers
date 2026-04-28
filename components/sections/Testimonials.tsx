'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  { name: 'James Whitfield', location: 'New York, USA', avatar: 'JW', rating: 5, plan: 'Elite Plan', earnings: '$47,200', text: 'Goldcrest Broker completely transformed my investment strategy. The Elite plan has been delivering consistent 5% daily returns. I have withdrawn over $47K since joining.' },
  { name: 'Sarah Chen', location: 'Singapore', avatar: 'SC', rating: 5, plan: 'Premium Plan', earnings: '$18,900', text: 'The platform is incredibly professional. Customer support is top-tier, payouts are always on time, and the dashboard gives me full visibility into my portfolio.' },
  { name: 'Michael Adeyemi', location: 'Lagos, Nigeria', avatar: 'MA', rating: 5, plan: 'Growth Plan', earnings: '$8,400', text: 'I started with the Growth plan and within 30 days saw 75% returns. Already upgraded to Premium. The referral program alone is earning me an extra $2K/month.' },
  { name: 'Elena Kowalski', location: 'Warsaw, Poland', avatar: 'EK', rating: 5, plan: 'Premium Plan', earnings: '$22,100', text: 'Professional platform with real asset-backed investments. The transparency, daily profit reports, and fast withdrawals make Goldcrest Broker stand out from competitors.' },
  { name: 'David Okonkwo', location: 'London, UK', avatar: 'DO', rating: 5, plan: 'Elite Plan', earnings: '$61,500', text: 'The dedicated account manager assigned to Elite clients is a game changer. They helped me optimize my strategy. My portfolio is up 150% this month.' },
  { name: 'Aisha Patel', location: 'Dubai, UAE', avatar: 'AP', rating: 5, plan: 'Growth Plan', earnings: '$11,200', text: 'Easy deposits, fast withdrawals, excellent ROI. I recommend Goldcrest Broker to all my friends and earn referral bonuses every week. Best investment platform I have used.' },
];

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <div className="flex-shrink-0 w-80 glass rounded-2xl p-6 mx-3 card-hover border border-white/[0.06]">
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} size={14} fill="#f5a623" className="text-amber-400" />
        ))}
      </div>
      <Quote size={20} className="text-blue-400/40 mb-3" />
      <p className="text-slate-300 text-sm leading-relaxed mb-5">{testimonial.text}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-sm font-bold text-white">
            {testimonial.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{testimonial.name}</p>
            <p className="text-xs text-slate-400">{testimonial.location}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">{testimonial.plan}</p>
          <p className="text-sm font-bold text-emerald-400">{testimonial.earnings}</p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="py-24 overflow-hidden bg-[#040c18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-sm text-amber-400 border border-amber-500/20 mb-4">
            <Star size={14} fill="currentColor" />
            <span>Investor Reviews</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Trusted by <span className="gradient-text-gold">180,000+</span> Investors
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Real results from real investors. See how Goldcrest Broker is changing lives worldwide.
          </p>
        </motion.div>
      </div>

      {/* Infinite scroll track */}
      <div
        className="overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex"
          style={{
            animation: `ticker ${isPaused ? 'paused' : 'running'} 60s linear infinite`,
            animationName: 'ticker',
          }}
        >
          {doubled.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
