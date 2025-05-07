
import type { FC } from 'react';
import Image from 'next/image';

const PromoBanner: FC = () => {
  return (
    <section className="px-4 py-6 text-center bg-background">
      <div className="relative w-48 h-32 mx-auto mb-4">
        <Image
          src="https://picsum.photos/seed/giftbox/600/300"
          alt="Gift Box Bonus"
          layout="fill"
          objectFit="contain"
          data-ai-hint="gift box coins"
        />
      </div>
      <h2 className="text-2xl font-bold text-foreground">
        Signup to Get <span className="text-primary">$5,050</span> Bonus!
      </h2>
    </section>
  );
};

export default PromoBanner;
