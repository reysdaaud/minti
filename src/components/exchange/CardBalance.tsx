'use client';
import type { FC } from 'react';
import { CreditCard } from 'lucide-react';

const CardBalance: FC = () => {
  return (
    <section className="w-full max-w-md mx-auto text-center space-y-6 mb-6">
      <div className="rounded-xl text-white shadow-xl relative overflow-hidden aspect-[1.586/1] flex flex-col justify-between bg-black border border-green-500/20">
        {/* Top Section: Business, Chip, Contactless */}
        <div className="flex justify-between items-start p-4">
          <div className="flex items-center space-x-2">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
            >
              <path
                d="M14.5 3.5C10.91 3.5 8 6.41 8 10M14.5 3.5C18.09 3.5 21 6.41 21 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12.5 6.5C10.567 6.5 9 8.067 9 10M12.5 6.5C14.433 6.5 16 8.067 16 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M10.5 9.5C10.0335 9.5 9.60669 9.66243 9.29052 9.93438M10.5 9.5C10.9665 9.5 11.3933 9.66243 11.7095 9.93438"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M16.5 3.5C16.5 3.5 19.5 6.41003 19.5 10C19.5 13.59 16.5 16.5 16.5 16.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                transform="rotate(90 16.5 10)"
              />
              <path
                d="M13.5 6.5C13.5 6.5 15.5 8.067 15.5 10C15.5 11.933 13.5 13.5 13.5 13.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                transform="rotate(90 13.5 10)"
              />
              <path
                d="M10.5 9.5C10.5 9.5 11.5 10.1624 11.5 10C11.5 10.8376 10.5 10.5 10.5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                transform="rotate(90 10.5 10)"
              />
            </svg>
          </div>
          <div className="flex flex-col items-end">
            <svg width="50" height="30" viewBox="0 0 70 40" xmlns="http://www.w3.org/2000/svg" className="h-8">
              <circle cx="20" cy="20" r="18" fill="#EA001B"/>
              <circle cx="50" cy="20" r="18" fill="#F79E1B"/>
              <path d="M35 20 C 35 29.941125 27.941125 38 20 38 C 12.058875 38 5 29.941125 5 20 C 5 10.058875 12.058875 2 20 2 C 27.941125 2 35 10.058875 35 20 Z M35 20 C35 29.941125 42.058875 38 50 38 C 57.941125 65 29.941125 65 20 C 65 10.058875 57.941125 2 50 2 C 42.058875 2 35 10.058875 35 20 Z" fill="#FF5F00"/>
            </svg>
          </div>
        </div>

        {/* Middle Section: Card Number */}
        <div className="text-left p-4 my-auto">
          <p className="text-2xl tracking-wider font-mono">
            2121 2388 2921 2182
          </p>
        </div>

        {/* Bottom Section: Valid Thru, Cardholder Name, Mastercard Logo */}
        <div className="flex justify-between items-end p-4">
          <div className="text-left">
            <p className="text-[10px] uppercase opacity-80">VALID THRU</p>
            <p className="text-sm font-medium">12/28</p>
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase opacity-80">Card Holder</p>
            <p className="text-sm font-medium">Jane Doe</p>
          </div>
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardBalance;
