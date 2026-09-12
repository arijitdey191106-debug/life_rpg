import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FocusClient from "./FocusClient";
import { redirect } from "next/navigation";

export default async function FocusPage() {
  const session = await getServerSession(authOptions);
  
  if (!(session?.user as any)?.username) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { username: (session?.user as any)?.username },
    include: {
      inventory: {
        where: { equipped: true },
        include: { item: true }
      }
    }
  });

  if (!user) {
    redirect("/login");
  }

  const equippedEffects = user.inventory
    .filter((inv) => inv.item.type === "EFFECT" || inv.item.type === "BACKGROUND")
    .map((inv) => inv.item.name.toUpperCase());

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <FocusClient equippedEffects={equippedEffects} />
    </div>
  );
}
