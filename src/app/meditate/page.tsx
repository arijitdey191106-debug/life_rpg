import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MeditateClient from "./MeditateClient";
import { redirect } from "next/navigation";

export default async function MeditatePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      inventory: {
        where: { equipped: true },
        include: { item: true }
      }
    }
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const equippedEffects = user.inventory
    .filter((inv) => inv.item.type === "EFFECT")
    .map((inv) => inv.item.name.toUpperCase());

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <MeditateClient equippedEffects={equippedEffects} />
    </div>
  );
}
