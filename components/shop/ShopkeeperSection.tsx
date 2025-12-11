'use client';

import Image from 'next/image';

export default function ShopkeeperSection() {
  return (
    <>
      {/* Sign - Hanging off top of screen */}
      <div className="absolute left-[200px] -top-[80px] w-[1000px] h-[620px]">
        <Image
          src="/assets/shop/b31aaf527a14a2fef384b77067a49df3831c6f78.png"
          alt="Sign"
          width={550}
          height={180}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Speech Bubble */}
      <div className="absolute left-[471px] top-[195px] w-[387px] h-[199px]">
        <Image
          src="/assets/shop/9e9547a7b4ac5f79b6950fe99772ede693273db5.svg"
          alt="Speech bubble"
          width={387}
          height={199}
          className="w-full h-full"
        />
      </div>

      {/* Desk - 2x bigger */}
      <div className="absolute left-[50px] top-[500px] w-[1800px] h-[700px]">
        <Image
          src="/assets/shop/44c3a9430ba07172f45710bcd402e83b79b63b37.png"
          alt="Desk"
          width={1800}
          height={700}
          className="w-full h-full object-contain"x
        />
      </div>

      {/* Floopa Shopkeeper - On top of desk */}
      <div className="absolute left-[100px] top-[200px] w-[1000px] h-[750px] z-10">
        <Image
          src="/assets/shop/c0084cbf40b8d2493ca3160e501bd20e1d232e1c.png"
          alt="Floopa Shopkeeper"
          width={1000}
          height={750}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Register - Smaller, on top of desk */}
      <div className="absolute left-[800px] top-[380px] w-[300px] h-[195px] z-10">
        <Image
          src="/assets/shop/ef89d48a96082e16ec56e0c6b97a9d2fd6e1cc32.png"
          alt="Register"
          width={300}
          height={195}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Front Arm - Much bigger, on top */}
      <div className="absolute left-[300px] top-[600px] w-[420px] h-[315px] z-20">
        <Image
          src="/assets/shop/c901517733abb00ff5f2369103b15e97df9c402c.png"
          alt="Front Arm"
          width={420}
          height={315}
          className="w-full h-full object-contain"
        />
      </div>
    </>
  );
}
