'use client';
import type { FC } from 'react';

const CardBalance: FC = () => {
  return (
    <section className="w-full max-w-md mx-auto text-center space-y-6">
      {/* Mastercard Style Card */}
      <div className="bg-slate-700 rounded-xl p-5 text-white shadow-xl relative overflow-hidden aspect-[1.586/1] flex flex-col justify-between">
        {/* Top Section: Business, Chip, Contactless */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            {/* Chip SVG */}
            <svg
              width="40"
              height="30"
              viewBox="0 0 40 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-10"
            >
              <rect width="40" height="30" rx="4" fill="#C4C4C4" />
              <rect x="5" y="13" width="15" height="4" rx="1" fill="#A0A0A0" />
              <rect x="25" y="7" width="10" height="4" rx="1" fill="#A0A0A0" />
              <rect x="25" y="19" width="10" height="4" rx="1" fill="#A0A0A0" />
              <rect x="5" y="5" width="8" height="6" rx="1" fill="#B0B0B0" />
              <rect x="15" y="5" width="8" height="6" rx="1" fill="#B0B0B0" />
              <rect x="5" y="20" width="8" height="6" rx="1" fill="#B0B0B0" />
              <rect x="15" y="20" width="8" height="6" rx="1" fill="#B0B0B0" />
            </svg>
            <span className="text-xl font-semibold tracking-wide">business</span>
          </div>
          <div className="flex flex-col items-end">
            {/* Contactless SVG */}
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
            >
              <path
                d="M14.5 3.5C10.91 3.5 8 6.41 8 10M14.5 3.5C18.09 3.5 21 6.41 21 10"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12.5 6.5C10.567 6.5 9 8.067 9 10M12.5 6.5C14.433 6.5 16 8.067 16 10"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M10.5 9.5C10.0335 9.5 9.60669 9.66243 9.29052 9.93438M10.5 9.5C10.9665 9.5 11.3933 9.66243 11.7095 9.93438"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
                <path
                d="M16.5 3.5C16.5 3.5 19.5 6.41003 19.5 10C19.5 13.59 16.5 16.5 16.5 16.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                transform="rotate(90 16.5 10)"
              />
               <path
                d="M13.5 6.5C13.5 6.5 15.5 8.067 15.5 10C15.5 11.933 13.5 13.5 13.5 13.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                transform="rotate(90 13.5 10)"
              />
              <path
                d="M10.5 9.5C10.5 9.5 11.5 10.1624 11.5 10C11.5 10.8376 10.5 10.5 10.5 10.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                 transform="rotate(90 10.5 10)"
              />
            </svg>
            <span className="text-xs mt-1">world</span>
          </div>
        </div>

        {/* Middle Section: Card Number */}
        <div className="text-left my-auto">
          <p className="text-2xl tracking-wider font-mono">
            2221 0012 3412 3456
          </p>
        </div>
        
        {/* Bottom Section: Valid Thru, Cardholder Name, Mastercard Logo */}
        <div className="flex justify-between items-end">
          <div className="text-left">
            <p className="text-[10px] uppercase opacity-80">VALID THRU</p>
            <p className="text-sm font-medium">12/28</p>
            <p className="text-base font-medium mt-1">Jane Doe</p>
          </div>
          {/* Mastercard Logo SVG */}
          <div className="flex items-center">
            <svg width="50" height="30" viewBox="0 0 70 40" xmlns="http://www.w3.org/2000/svg" className="h-10">
              <circle cx="20" cy="20" r="18" fill="#EA001B"/>
              <circle cx="50" cy="20" r="18" fill="#F79E1B"/>
              <path d="M35 20 C 35 29.941125 27.941125 38 20 38 C 12.058875 38 5 29.941125 5 20 C 5 10.058875 12.058875 2 20 2 C 27.941125 2 35 10.058875 35 20 Z M35 20 C35 29.941125 42.058875 38 50 38 C 57.941125 38 65 29.941125 65 20 C 65 10.058875 57.941125 2 50 2 C 42.058875 2 35 10.058875 35 20 Z" fill="#FF5F00"/>
            </svg>
          </div>
        </div>

        {/* Subtle arc design - adjust path and gradient as needed */}
        <svg viewBox="0 0 350 220" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          <path d="M0 220 Q 175 -50 350 220 L 350 0 L 0 0 Z" fill="url(#arcGrad)" />
          <defs>
            <radialGradient id="arcGrad" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
              <stop offset="0%" style={{stopColor: 'rgba(255,255,255,0.3)', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: 'rgba(255,255,255,0)', stopOpacity: 1}} />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
};

export default CardBalance;
