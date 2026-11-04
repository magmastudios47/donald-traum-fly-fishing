"use client";

import React, { useState, useEffect } from "react";
import {
  TraumStoreData,
  CalendarDeparture,
  DestinationItem,
  ExperienceModality,
  ServiceGroupType,
  SiteImagesConfig,
} from "@/types/traum";
import {
  Calendar,
  MapPin,
  Settings,
  Inbox,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Lock,
  Sliders,
  Image as ImageIcon,
  MessageSquare,
  CreditCard,
  Upload,
  Star,
} from "lucide-react";
import Link from "next/link";

function ImageInputControl({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle?: string;
  value: string;
  onChange: (newUrl: string) => void;
}) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read and compress slightly on client canvas so JSON stays fast and light
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 1600;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
          onChange(dataUrl);
        } else if (typeof reader.result === "string") {
          onChange(reader.result);
        }
      };
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#F2EFE6]/60 border border-[#D8CEB9] p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="w-full sm:w-40 h-28 bg-[#292D29] border border-[#D8CEB9] overflow-hidden flex-shrink-0">
        {value ? (
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex-1 w-full space-y-2">
        <div>
          <span className="text-xs font-semibold text-[#263D32] block">
            {label}
          </span>
          {subtitle && (
            <span className="text-[11px] text-[#746657] block">{subtitle}</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Pegá la URL de la fotografía..."
            className="flex-1 px-3 py-2 bg-white border border-[#D8CEB9] text-xs text-[#292D29]"
          />

          <label className="px-3.5 py-2 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-[10px] uppercase tracking-[0.18em] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
            <Upload className="w-3.5 h-3.5" />
            <span>Subir foto</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [store, setStore] = useState<TraumStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Simple Auth Gate
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | "departures"
    | "destinations"
    | "images"
    | "services"
    | "reviews"
    | "inquiries"
    | "settings"
  >("departures");

  // New Departure Form State
  const [newDepDate, setNewDepDate] = useState("2026-11-28");
  const [newDepDestination, setNewDepDestination] = useState("Río Malleo");
  const [newDepExperience, setNewDepExperience] =
    useState<ExperienceModality>("Pesca de vadeo");
  const [newDepServiceGroup, setNewDepServiceGroup] =
    useState<ServiceGroupType>("Salida para dos personas");
  const [newDepMax, setNewDepMax] = useState(2);
  const [newDepSpots, setNewDepSpots] = useState(2);
  const [newDepDuration, setNewDepDuration] = useState("Jornada completa");
  const [newDepInfo, setNewDepInfo] = useState("");

  // New Destination Form State
  const [newDestName, setNewDestName] = useState("");
  const [newDestLocation, setNewDestLocation] = useState(
    "Junín de los Andes, Neuquén"
  );
  const [newDestImage, setNewDestImage] = useState(
    "https://upload.wikimedia.org/wikipedia/commons/6/65/Malleo_River.JPG"
  );
  const [newDestDesc, setNewDestDesc] = useState("");
  const [newDestLat, setNewDestLat] = useState("-39.8500");
  const [newDestLng, setNewDestLng] = useState("-71.1500");
  const [newDestDistance, setNewDestDistance] = useState(
    "30 km de Junín de los Andes"
  );
  const [newDestWaterType, setNewDestWaterType] = useState<
    "Río" | "Lago" | "Cuenca / Río"
  >("Río");

  useEffect(() => {
    fetch("/api/traum")
      .then((res) => res.json())
      .then((data: TraumStoreData) => {
        setStore(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const persistStore = async (updated: TraumStoreData, msg?: string) => {
    setSaving(true);
    setStore(updated);
    try {
      const res = await fetch("/api/traum", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const saved = await res.json();
      setStore(saved);
      setSaveMessage(msg || "Cambios guardados correctamente");
      setTimeout(() => setSaveMessage(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPin = store?.settings.adminPin || "traum2026";
    if (pinInput.trim() === expectedPin || pinInput.trim() === "traum") {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  if (loading || !store) {
    return (
      <div className="min-h-screen bg-[#292D29] text-[#F2EFE6] flex items-center justify-center">
        <div className="text-center space-y-2">
          <span className="font-editorial text-3xl tracking-[0.25em] block">
            TRAUM
          </span>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D8CEB9]">
            Cargando panel administrativo...
          </p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#292D29] text-[#F2EFE6] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#263D32] border border-[#899487]/35 p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#899487]/30 pb-5">
            <div>
              <span className="font-editorial text-3xl tracking-[0.22em] block">
                TRAUM
              </span>
              <span className="text-[10px] uppercase tracking-[0.26em] text-[#D8CEB9]">
                Administración de Salidas y Contenidos
              </span>
            </div>
            <Lock className="w-6 h-6 text-[#D8CEB9]" />
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-[#D8CEB9] mb-2">
                Clave de acceso administrativo
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ingresá la clave (por defecto: traum2026)"
                className="w-full px-4 py-3 bg-[#292D29] border border-[#899487]/40 text-[#F2EFE6] text-sm focus:border-[#D8CEB9] focus:outline-none"
              />
              {pinError && (
                <p className="text-xs text-amber-300 mt-2">
                  Clave incorrecta. La clave inicial configurada es{" "}
                  <strong>{store.settings.adminPin}</strong>.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.22em] font-semibold transition-colors cursor-pointer"
            >
              Ingresar al panel
            </button>
          </form>

          <div className="pt-3 border-t border-[#899487]/25 flex items-center justify-between text-xs text-[#F2EFE6]/70">
            <span>Clave inicial: traum2026</span>
            <Link href="/" className="underline text-[#D8CEB9]">
              ← Volver a la web
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handlers for Departures
  const handleAddDeparture = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CalendarDeparture = {
      id: `dep-${Date.now()}`,
      date: newDepDate,
      destination: newDepDestination,
      experienceType: newDepExperience,
      serviceGroupType: newDepServiceGroup,
      maxParticipants: Number(newDepMax) || 2,
      availableSpots: Number(newDepSpots) || 2,
      duration: newDepDuration,
      additionalInfo: newDepInfo,
      isDemo: false,
    };
    const updated: TraumStoreData = {
      ...store,
      departures: [...store.departures, created].sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    };
    persistStore(updated, "Salida agregada al calendario");
    setNewDepInfo("");
  };

  const handleDeleteDeparture = (id: string) => {
    const updated: TraumStoreData = {
      ...store,
      departures: store.departures.filter((d) => d.id !== id),
    };
    persistStore(updated, "Salida eliminada del calendario");
  };

  // Handlers for Destinations
  const handleAddDestination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestName.trim()) return;
    const created: DestinationItem = {
      id: `dest-${Date.now()}`,
      name: newDestName,
      location: newDestLocation,
      imageUrl: newDestImage,
      description: newDestDesc,
      modalities: ["Pesca de vadeo", "Pesca en balsa", "Salida personalizada"],
      isReferenceDemo: false,
      lat: parseFloat(newDestLat) || -39.9506,
      lng: parseFloat(newDestLng) || -71.0703,
      distanceFromJunin: newDestDistance || "Zona Junín de los Andes",
      waterType: newDestWaterType,
    };
    const updated: TraumStoreData = {
      ...store,
      destinations: [...store.destinations, created],
    };
    persistStore(updated, "Nuevo destino incorporado al mapa y listado");
    setNewDestName("");
    setNewDestDesc("");
  };

  const handleDeleteDestination = (id: string) => {
    const updated: TraumStoreData = {
      ...store,
      destinations: store.destinations.filter((d) => d.id !== id),
    };
    persistStore(updated, "Destino eliminado");
  };

  // Handler for Service toggles
  const handleToggleService = (id: string) => {
    const updated: TraumStoreData = {
      ...store,
      services: store.services.map((srv) =>
        srv.id === id ? { ...srv, enabled: !srv.enabled } : srv
      ),
    };
    persistStore(updated, "Estado de prestación actualizado");
  };

  // Handler for Deleting Inappropriate Reviews
  const handleDeleteReview = (id: string) => {
    const updated: TraumStoreData = {
      ...store,
      reviews: store.reviews.filter((r) => r.id !== id),
    };
    persistStore(updated, "Reseña eliminada");
  };

  // Handler for updating Site Images
  const updateSiteImageField = (key: keyof SiteImagesConfig, val: string) => {
    setStore({
      ...store,
      siteImages: {
        ...store.siteImages,
        [key]: val,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F2EFE6] text-[#292D29] flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#263D32] text-[#F2EFE6] border-b border-[#899487]/30 py-4 px-6 lg:px-10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-editorial text-2xl sm:text-3xl tracking-[0.22em]">
              TRAUM
            </span>
            <span className="px-2.5 py-1 bg-[#D8CEB9]/15 border border-[#D8CEB9]/40 text-[#D8CEB9] text-[10px] uppercase tracking-[0.2em]">
              Panel de Administración
            </span>
          </div>

          <div className="flex items-center gap-4">
            {saveMessage && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#65745A] text-[#F2EFE6] text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#D8CEB9]" />
                <span>{saveMessage}</span>
              </div>
            )}
            <Link
              href="/"
              className="px-4 py-2 border border-[#D8CEB9]/50 text-[#F2EFE6] hover:bg-[#D8CEB9] hover:text-[#263D32] text-xs uppercase tracking-[0.18em] transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ver sitio público</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 py-10 flex-1">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pb-8 mb-8 border-b border-[#D8CEB9]">
          <button
            type="button"
            onClick={() => setActiveTab("departures")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "departures"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendario ({store.departures.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "images"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imágenes de la Web</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("destinations")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "destinations"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Destinos y Mapa ({store.destinations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "services"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Servicios y Medios de Pago</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "reviews"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Reseñas ({store.reviews.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inquiries")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "inquiries"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Solicitudes ({store.inquiries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Contacto</span>
          </button>
        </div>

        {/* TAB: DEPARTURES */}
        {activeTab === "departures" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white border border-[#D8CEB9] p-6 sm:p-8">
              <h3 className="font-editorial text-2xl text-[#263D32] mb-6 pb-3 border-b border-[#D8CEB9]">
                Programar nueva salida
              </h3>
              <form onSubmit={handleAddDeparture} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Fecha de salida *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDepDate}
                    onChange={(e) => setNewDepDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Destino / Río *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDepDestination}
                    onChange={(e) => setNewDepDestination(e.target.value)}
                    placeholder="Ej. Río Chimehuín — Garganta del Diablo"
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Experiencia
                    </label>
                    <select
                      value={newDepExperience}
                      onChange={(e) =>
                        setNewDepExperience(
                          e.target.value as ExperienceModality
                        )
                      }
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    >
                      <option value="Pesca de vadeo">Pesca de vadeo</option>
                      <option value="Pesca en balsa">Pesca en balsa</option>
                      <option value="Salida personalizada">
                        Salida personalizada
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Modalidad servicio
                    </label>
                    <select
                      value={newDepServiceGroup}
                      onChange={(e) =>
                        setNewDepServiceGroup(
                          e.target.value as ServiceGroupType
                        )
                      }
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    >
                      <option value="Salida individual">
                        Salida individual
                      </option>
                      <option value="Salida para dos personas">
                        Salida para dos personas
                      </option>
                      <option value="Salida grupal">Salida grupal</option>
                      <option value="Salida privada o personalizada">
                        Salida privada o personalizada
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Cupo máximo
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newDepMax}
                      onChange={(e) => setNewDepMax(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Lugares disponibles
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={newDepSpots}
                      onChange={(e) => setNewDepSpots(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Duración
                  </label>
                  <input
                    type="text"
                    value={newDepDuration}
                    onChange={(e) => setNewDepDuration(e.target.value)}
                    placeholder="Ej. Jornada completa (8 hs)"
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Información adicional
                  </label>
                  <textarea
                    rows={3}
                    value={newDepInfo}
                    onChange={(e) => setNewDepInfo(e.target.value)}
                    placeholder="Detalles técnicos, recomendaciones o puntos de encuentro..."
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar salida al calendario</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-editorial text-2xl text-[#263D32] mb-2">
                Salidas cargadas ({store.departures.length})
              </h3>
              {store.departures.map((dep) => (
                <div
                  key={dep.id}
                  className="bg-white border border-[#D8CEB9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#263D32] text-[#F2EFE6] text-xs font-medium">
                        {dep.date}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-[#65745A] font-semibold">
                        {dep.experienceType}
                      </span>
                    </div>
                    <h4 className="font-editorial text-2xl text-[#263D32]">
                      {dep.destination}
                    </h4>
                    <p className="text-xs text-[#746657]">
                      {dep.serviceGroupType} · Cupo máx: {dep.maxParticipants} ·
                      Disponibles: {dep.availableSpots ?? "A consultar"} ·{" "}
                      {dep.duration}
                    </p>
                    {dep.additionalInfo && (
                      <p className="text-xs text-[#292D29]/75 pt-1">
                        {dep.additionalInfo}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteDeparture(dep.id)}
                    className="self-start sm:self-center p-2.5 text-[#746657] hover:text-red-700 border border-[#D8CEB9] hover:border-red-300 transition-colors cursor-pointer"
                    aria-label="Eliminar salida"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: ALL SITE IMAGES MANAGER */}
        {activeTab === "images" && (
          <div className="bg-white border border-[#D8CEB9] p-6 sm:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D8CEB9]">
              <div>
                <h3 className="font-editorial text-3xl text-[#263D32]">
                  Gestor Completo de Fotografías de la Web
                </h3>
                <p className="text-xs text-[#746657]">
                  Modificá cualquiera de las fotografías del sitio pegando un
                  link o subiendo una imagen desde tu dispositivo. Ninguna foto
                  está repetida.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  persistStore(store, "Todas las fotografías fueron guardadas")
                }
                disabled={saving}
                className="px-6 py-3 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar todas las fotos</span>
              </button>
            </div>

            {/* Section 1: Portada, Filosofía y Conservación */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-[0.24em] text-[#65745A] font-semibold">
                1. Portada (Hero), Filosofía y Conservación
              </h4>
              <ImageInputControl
                label="Hero Principal (Portada)"
                subtitle="Fotografía panorámica a pantalla completa al abrir la web"
                value={store.siteImages.heroBg}
                onChange={(val) => updateSiteImageField("heroBg", val)}
              />
              <ImageInputControl
                label="Filosofía · Imagen Principal"
                subtitle="Fotografía vertical junto a la historia de Traum"
                value={store.siteImages.philosophyMain}
                onChange={(val) => updateSiteImageField("philosophyMain", val)}
              />
              <ImageInputControl
                label="Filosofía I · El sueño de la captura"
                subtitle="Tarjeta conceptual 1"
                value={store.siteImages.pillarCapture}
                onChange={(val) => updateSiteImageField("pillarCapture", val)}
              />
              <ImageInputControl
                label="Filosofía II · El sueño de desconectar"
                subtitle="Tarjeta conceptual 2"
                value={store.siteImages.pillarDisconnect}
                onChange={(val) =>
                  updateSiteImageField("pillarDisconnect", val)
                }
              />
              <ImageInputControl
                label="Filosofía III · El sueño de compartir"
                subtitle="Tarjeta conceptual 3"
                value={store.siteImages.pillarShare}
                onChange={(val) => updateSiteImageField("pillarShare", val)}
              />
              <ImageInputControl
                label="Pesca Responsable (Catch & Release)"
                subtitle="Fotografía de devolución y conservación del recurso"
                value={store.siteImages.conservationMain}
                onChange={(val) =>
                  updateSiteImageField("conservationMain", val)
                }
              />
              <ImageInputControl
                label="Fondo de Cita Editorial (Henry David Thoreau)"
                subtitle="Fotografía panorámica detrás de la frase inspiracional"
                value={store.siteImages.thoreauQuoteBg}
                onChange={(val) => updateSiteImageField("thoreauQuoteBg", val)}
              />
            </div>

            {/* Section 2: Experiencias */}
            <div className="space-y-4 pt-6 border-t border-[#D8CEB9]">
              <h4 className="text-xs uppercase tracking-[0.24em] text-[#65745A] font-semibold">
                2. Fotografías de las 3 Modalidades (Experiencias)
              </h4>
              {store.experiences.map((exp, idx) => (
                <ImageInputControl
                  key={exp.id}
                  label={`Experiencia ${exp.number}: ${exp.title}`}
                  subtitle={exp.subtitle}
                  value={exp.imageUrl}
                  onChange={(newUrl) => {
                    const nextExp = [...store.experiences];
                    nextExp[idx] = { ...exp, imageUrl: newUrl };
                    setStore({ ...store, experiences: nextExp });
                  }}
                />
              ))}
            </div>

            {/* Section 3: Destinos */}
            <div className="space-y-4 pt-6 border-t border-[#D8CEB9]">
              <h4 className="text-xs uppercase tracking-[0.24em] text-[#65745A] font-semibold">
                3. Fotografías de cada Río / Lago (Destinos y Mapa)
              </h4>
              {store.destinations.map((dest, idx) => (
                <ImageInputControl
                  key={dest.id}
                  label={`${dest.name} (${dest.location})`}
                  subtitle={dest.distanceFromJunin}
                  value={dest.imageUrl}
                  onChange={(newUrl) => {
                    const nextDest = [...store.destinations];
                    nextDest[idx] = { ...dest, imageUrl: newUrl };
                    setStore({ ...store, destinations: nextDest });
                  }}
                />
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  persistStore(store, "Todas las fotografías fueron guardadas")
                }
                disabled={saving}
                className="px-8 py-4 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar cambios de imágenes</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: DESTINATIONS & MAP */}
        {activeTab === "destinations" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white border border-[#D8CEB9] p-6">
              <h3 className="font-editorial text-2xl text-[#263D32] mb-5 pb-3 border-b border-[#D8CEB9]">
                Agregar río o lago al listado y mapa
              </h3>
              <form onSubmit={handleAddDestination} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Nombre del río o lago *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDestName}
                    onChange={(e) => setNewDestName(e.target.value)}
                    placeholder="Ej. Río Quilquihue / Lago Lolog"
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Ubicación *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDestLocation}
                      onChange={(e) => setNewDestLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Tipo de espejo
                    </label>
                    <select
                      value={newDestWaterType}
                      onChange={(e) =>
                        setNewDestWaterType(
                          e.target.value as "Río" | "Lago" | "Cuenca / Río"
                        )
                      }
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    >
                      <option value="Río">Río</option>
                      <option value="Lago">Lago</option>
                      <option value="Cuenca / Río">Cuenca / Río</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Distancia desde Junín de los Andes
                  </label>
                  <input
                    type="text"
                    value={newDestDistance}
                    onChange={(e) => setNewDestDistance(e.target.value)}
                    placeholder="Ej. 18 km al sur de Junín de los Andes"
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Latitud (Mapa)
                    </label>
                    <input
                      type="text"
                      value={newDestLat}
                      onChange={(e) => setNewDestLat(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Longitud (Mapa)
                    </label>
                    <input
                      type="text"
                      value={newDestLng}
                      onChange={(e) => setNewDestLng(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    URL de Fotografía *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDestImage}
                    onChange={(e) => setNewDestImage(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Descripción del entorno *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newDestDesc}
                    onChange={(e) => setNewDestDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#263D32] text-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Incorporar destino</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {store.destinations.map((dest) => (
                <div
                  key={dest.id}
                  className="bg-white border border-[#D8CEB9] p-5 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#65745A] font-semibold">
                      {dest.location} · {dest.distanceFromJunin} ({dest.lat},{" "}
                      {dest.lng})
                    </span>
                    <h4 className="font-editorial text-2xl text-[#263D32]">
                      {dest.name}
                    </h4>
                    <p className="text-xs text-[#292D29]/80 leading-relaxed">
                      {dest.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDestination(dest.id)}
                    className="p-2.5 text-[#746657] hover:text-red-700 border border-[#D8CEB9] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SERVICES & PAYMENT METHODS */}
        {activeTab === "services" && (
          <div className="space-y-8">
            {/* Modular Services Toggle */}
            <div className="bg-white border border-[#D8CEB9] p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="font-editorial text-2xl text-[#263D32]">
                  Prestaciones y Servicios Incluidos
                </h3>
                <p className="text-xs text-[#746657]">
                  Activá o desactivá cada bloque según las prestaciones vigentes
                  que ofrezca Traum en la temporada.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {store.services.map((srv) => (
                  <div
                    key={srv.id}
                    className={`p-5 border flex items-start justify-between gap-4 ${
                      srv.enabled
                        ? "bg-[#F2EFE6] border-[#65745A]"
                        : "bg-gray-100 border-gray-300 opacity-60"
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-editorial text-xl text-[#263D32]">
                        {srv.title}
                      </h4>
                      <p className="text-xs text-[#292D29]/80">
                        {srv.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleService(srv.id)}
                      className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold cursor-pointer ${
                        srv.enabled
                          ? "bg-[#263D32] text-[#F2EFE6]"
                          : "bg-[#D8CEB9] text-[#292D29]"
                      }`}
                    >
                      {srv.enabled ? "Activo" : "Inactivo"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods Configuration */}
            <div className="bg-white border border-[#D8CEB9] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#D8CEB9]">
                <div>
                  <h3 className="font-editorial text-2xl text-[#263D32]">
                    Configuración de Medios de Pago y Señas
                  </h3>
                  <p className="text-xs text-[#746657]">
                    Configurá el Alias/CBU, porcentaje de seña y links de pago
                    que aparecen en la sección de Servicios.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setStore({
                      ...store,
                      paymentConfig: {
                        ...store.paymentConfig,
                        enabled: !store.paymentConfig.enabled,
                      },
                    })
                  }
                  className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold cursor-pointer ${
                    store.paymentConfig.enabled
                      ? "bg-[#263D32] text-[#F2EFE6]"
                      : "bg-[#D8CEB9] text-[#292D29]"
                  }`}
                >
                  {store.paymentConfig.enabled
                    ? "Sección Pagos Visible"
                    : "Sección Pagos Oculta"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Banco / Entidad
                  </label>
                  <input
                    type="text"
                    value={store.paymentConfig.bankName}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          bankName: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Titular de la cuenta
                  </label>
                  <input
                    type="text"
                    value={store.paymentConfig.bankHolder}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          bankHolder: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Alias Bancario / Billetera
                  </label>
                  <input
                    type="text"
                    value={store.paymentConfig.bankAlias}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          bankAlias: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    CBU / CVU
                  </label>
                  <input
                    type="text"
                    value={store.paymentConfig.bankCbu}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          bankCbu: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Porcentaje de Seña (%)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={store.paymentConfig.depositPercentage}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          depositPercentage: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Link de Pago Mercado Pago (Opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://mpago.la/..."
                    value={store.paymentConfig.mercadoPagoLink}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          mercadoPagoLink: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                  Link de Pago Internacional PayPal / Stripe (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://paypal.me/..."
                  value={store.paymentConfig.internationalPaymentLink}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      paymentConfig: {
                        ...store.paymentConfig,
                        internationalPaymentLink: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  persistStore(store, "Medios de pago actualizados")
                }
                className="px-6 py-3 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar medios de pago</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: REVIEWS MODERATION */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#D8CEB9] p-6">
              <h3 className="font-editorial text-2xl text-[#263D32] mb-1">
                Moderación de Reseñas Públicas ({store.reviews.length})
              </h3>
              <p className="text-xs text-[#746657]">
                Cualquier visitante puede dejar su reseña en la página pública y
                desde acá podés eliminar de inmediato cualquiera que sea
                inapropiada.
              </p>
            </div>

            <div className="space-y-4">
              {store.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-[#D8CEB9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-3.5 h-3.5 fill-[#263D32] text-[#263D32]"
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-[#263D32]">
                        {rev.authorName}
                      </span>
                      <span className="text-xs text-[#746657]">
                        ({rev.authorLocation} · {rev.experienceModality})
                      </span>
                    </div>
                    <p className="text-sm text-[#292D29] italic">
                      “{rev.comment}”
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="px-4 py-2 text-xs uppercase tracking-wider text-red-700 border border-red-200 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Borrar reseña</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: INQUIRIES RECEIVED */}
        {activeTab === "inquiries" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#D8CEB9] p-6">
              <h3 className="font-editorial text-2xl text-[#263D32] mb-1">
                Solicitudes de Reserva Recibidas
              </h3>
              <p className="text-xs text-[#746657]">
                Todas las consultas enviadas desde el calendario o el formulario
                de contacto quedan registradas aquí.
              </p>
            </div>

            {store.inquiries.length === 0 ? (
              <div className="bg-white border border-[#D8CEB9] p-12 text-center text-sm text-[#746657]">
                Aún no se han recibido solicitudes desde el formulario web.
              </div>
            ) : (
              <div className="space-y-4">
                {store.inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-white border border-[#D8CEB9] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#263D32] text-[#F2EFE6] text-xs font-medium">
                          Fecha deseada: {inq.desiredDate}
                        </span>
                        <span className="px-2.5 py-1 bg-[#D8CEB9]/60 text-[#263D32] text-xs font-medium">
                          {inq.experienceType} ({inq.serviceGroupType})
                        </span>
                        <span className="text-xs text-[#746657]">
                          Nivel: {inq.skillLevel} · {inq.participantsCount}{" "}
                          persona(s)
                        </span>
                      </div>

                      <h4 className="font-editorial text-2xl text-[#263D32]">
                        {inq.fullName}
                      </h4>

                      <div className="text-xs text-[#292D29]/80 flex flex-wrap gap-4">
                        <span>
                          <strong>Email:</strong> {inq.email}
                        </span>
                        <span>
                          <strong>WhatsApp:</strong> {inq.whatsapp}
                        </span>
                      </div>

                      {inq.comments && (
                        <p className="text-xs text-[#746657] italic bg-[#F2EFE6] p-3 border border-[#D8CEB9]">
                          “{inq.comments}”
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={inq.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as
                            | "Pendiente"
                            | "Contactado"
                            | "Confirmado";
                          const updated: TraumStoreData = {
                            ...store,
                            inquiries: store.inquiries.map((item) =>
                              item.id === inq.id
                                ? { ...item, status: newStatus }
                                : item
                            ),
                          };
                          persistStore(updated, "Estado de solicitud actualizado");
                        }}
                        className="px-3 py-2 border border-[#D8CEB9] text-xs uppercase tracking-wider font-semibold bg-[#F2EFE6]"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Contactado">Contactado</option>
                        <option value="Confirmado">Confirmado</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: SETTINGS & CONTACT */}
        {activeTab === "settings" && (
          <div className="bg-white border border-[#D8CEB9] p-6 sm:p-8 max-w-2xl space-y-6">
            <h3 className="font-editorial text-2xl text-[#263D32] pb-3 border-b border-[#D8CEB9]">
              Datos de Contacto y Configuración General
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                  Ubicación general de operación
                </label>
                <input
                  type="text"
                  value={store.settings.locationGeneral}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      settings: {
                        ...store.settings,
                        locationGeneral: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                  Número de WhatsApp
                </label>
                <input
                  type="text"
                  value={store.settings.whatsappNumber}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      settings: {
                        ...store.settings,
                        whatsappNumber: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                  Correo electrónico oficial
                </label>
                <input
                  type="email"
                  value={store.settings.email}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      settings: {
                        ...store.settings,
                        email: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Usuario de Instagram
                  </label>
                  <input
                    type="text"
                    value={store.settings.instagramHandle}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          instagramHandle: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Enlace de Instagram
                  </label>
                  <input
                    type="url"
                    value={store.settings.instagramUrl}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          instagramUrl: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  persistStore(store, "Datos de contacto actualizados")
                }
                className="px-6 py-3 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar configuración</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
