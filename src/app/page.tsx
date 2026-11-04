import React, { Suspense } from "react";
import { connection } from "next/server";
import { getTraumStore } from "@/lib/store-server";
import TraumLandingClient from "@/components/TraumLandingClient";

async function DynamicLanding() {
  await connection();
  const storeData = await getTraumStore();
  return <TraumLandingClient initialData={storeData} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#263D32] text-[#F2EFE6] flex items-center justify-center">
          <span className="font-editorial text-4xl tracking-[0.25em]">
            TRAUM
          </span>
        </div>
      }
    >
      <DynamicLanding />
    </Suspense>
  );
}
