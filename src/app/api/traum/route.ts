import { NextRequest, NextResponse } from "next/server";
import { getTraumStore, saveTraumStore } from "@/lib/store-server";
import { BookingInquiry, ReviewItem, TraumStoreData } from "@/types/traum";

export async function GET() {
  const data = await getTraumStore();
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TraumStoreData>;
    const current = await getTraumStore();

    const updated: TraumStoreData = {
      ...current,
      ...body,
      settings: {
        ...current.settings,
        ...(body.settings || {}),
      },
      siteImages: {
        ...current.siteImages,
        ...(body.siteImages || {}),
      },
      paymentConfig: {
        ...current.paymentConfig,
        ...(body.paymentConfig || {}),
      },
    };

    await saveTraumStore(updated);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar la configuración", details: String(error) },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const current = await getTraumStore();

    if (payload.type === "INQUIRY") {
      const newInquiry: BookingInquiry = {
        id: `inq-${Date.now()}`,
        createdAt: new Date().toISOString(),
        fullName: payload.fullName || "",
        email: payload.email || "",
        whatsapp: payload.whatsapp || "",
        desiredDate: payload.desiredDate || "A definir",
        experienceType: payload.experienceType || "Pesca de vadeo",
        serviceGroupType: payload.serviceGroupType || "Salida para dos personas",
        participantsCount: Number(payload.participantsCount) || 1,
        skillLevel: payload.skillLevel || "Intermedio",
        comments: payload.comments || "",
        status: "Pendiente",
      };

      const updated: TraumStoreData = {
        ...current,
        inquiries: [newInquiry, ...current.inquiries],
      };

      await saveTraumStore(updated);
      return NextResponse.json({ ok: true, inquiry: newInquiry, store: updated });
    }

    if (payload.type === "REVIEW") {
      const newReview: ReviewItem = {
        id: `rev-${Date.now()}`,
        authorName: (payload.authorName || "Pescador Invitado").slice(0, 80),
        authorLocation: (payload.authorLocation || "Patagonia").slice(0, 80),
        experienceModality: (payload.experienceModality || "Pesca con mosca").slice(
          0,
          80
        ),
        rating: Math.min(5, Math.max(1, Number(payload.rating) || 5)),
        comment: (payload.comment || "").slice(0, 700),
        createdAt: new Date().toISOString(),
      };

      const updated: TraumStoreData = {
        ...current,
        reviews: [newReview, ...current.reviews],
      };

      await saveTraumStore(updated);
      return NextResponse.json({ ok: true, review: newReview, store: updated });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error procesando la solicitud", details: String(error) },
      { status: 400 }
    );
  }
}
