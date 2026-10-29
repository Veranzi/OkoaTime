import { NextRequest } from "next/server";
import { patchOffer, removeOffer } from "@/pricing/pricing.controller";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return patchOffer(req, params.id);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return removeOffer(req, params.id);
}
