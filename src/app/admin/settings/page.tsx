"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api";
import { isMockApi, resetMockSettings } from "@/lib/mock-settings";
import { PLATFORM_DEFAULTS } from "@/lib/platform-defaults";
import type { PlatformSettings } from "@/types";

// ---------------------------------------------------------------------------
// ImageUploadField — file picker with preview + upload mutation
// ---------------------------------------------------------------------------
function ImageUploadField({
  label,
  hint,
  currentUrl,
  accept = "image/*",
  onUpload,
  onRemove,
  uploading,
}: {
  label: string;
  hint?: string;
  currentUrl: string | null;
  accept?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  uploading?: boolean;
}) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    onUpload(file);
    e.target.value = "";
  }

  const displayUrl = localPreview ?? currentUrl;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-zinc-500">{hint}</span>}
      </label>
      <div className="flex items-center gap-4">
        {displayUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={label}
            className="h-14 w-14 rounded-xl border border-zinc-700 bg-zinc-800 object-contain p-1"
            onError={() => setLocalPreview(null)}
          />
        )}
        <div className="flex flex-col gap-1.5">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-brand hover:text-brand">
            {uploading ? (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            )}
            {uploading ? "Enviando..." : displayUrl ? "Trocar" : "Escolher arquivo"}
            <input type="file" accept={accept} className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
          {displayUrl && (
            <button
              type="button"
              onClick={() => { setLocalPreview(null); onRemove(); }}
              className="text-xs text-zinc-500 transition hover:text-red-400"
            >
              Remover
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColorField — label + native color picker + hex text input
// ---------------------------------------------------------------------------
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex items-center gap-3">
        <label className="relative h-10 w-10 cursor-pointer overflow-hidden rounded-lg border border-zinc-600">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-1 h-12 w-12 cursor-pointer border-none bg-transparent"
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          placeholder="#f97316"
          className="w-32 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 outline-none ring-brand focus:border-transparent focus:ring-2"
        />
        {/* Swatch preview */}
        <span
          className="h-8 w-8 rounded-lg border border-zinc-700"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ThemePreview — live mini preview scoped to unsaved values
// ---------------------------------------------------------------------------
function ThemePreview({
  values,
}: {
  values: PlatformSettings;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-zinc-700"
      style={
        {
          "--color-brand": values.primary_color,
          "--color-accent": values.accent_color,
        } as React.CSSProperties
      }
    >
      {/* Mock navbar */}
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 py-3">
        <div className="flex items-center gap-2">
          {values.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={values.logo_url}
              alt={values.platform_name}
              className="h-6 w-6 rounded object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded bg-brand">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
          )}
          <span className="text-sm font-bold text-zinc-100">{values.platform_name || "Plataforma"}</span>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand">
          AB
        </div>
      </header>

      {/* Mock content */}
      <div className="bg-zinc-950 p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Mock category card */}
          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
            <div className="h-16 bg-gradient-to-br from-zinc-700 to-zinc-800" />
            <div className="p-2">
              <p className="text-xs font-semibold text-brand">Treino A</p>
              <p className="text-[10px] text-zinc-500">6 vídeos</p>
            </div>
          </div>
          {/* Mock button */}
          <div className="flex flex-col justify-center gap-2 p-2">
            <button className="rounded bg-brand px-3 py-1.5 text-xs font-semibold text-white">
              Assistir
            </button>
            <button className="rounded border border-brand px-3 py-1.5 text-xs font-semibold text-brand">
              Ver categoria
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const qc = useQueryClient();
  const mockMode = isMockApi();

  const { data: saved, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get().then((r) => r.data),
  });

  const [form, setForm] = useState<PlatformSettings>(PLATFORM_DEFAULTS);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Sync form when data loads
  useEffect(() => {
    if (saved) setForm(saved);
  }, [saved]);

  const mutation = useMutation({
    mutationFn: (values: Partial<PlatformSettings>) =>
      settingsApi.update(values).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setForm(data);
      showToast("success", "Configurações salvas com sucesso!");
    },
    onError: () => showToast("error", "Erro ao salvar. Tente novamente."),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(["settings"], data);
      setForm((f) => ({ ...f, logo_url: data.logo_url }));
      showToast("success", "Logo atualizado!");
    },
    onError: () => showToast("error", "Erro ao enviar o logo."),
  });

  const faviconMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadFavicon(file).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(["settings"], data);
      setForm((f) => ({ ...f, favicon_url: data.favicon_url }));
      showToast("success", "Favicon atualizado!");
    },
    onError: () => showToast("error", "Erro ao enviar o favicon."),
  });

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function handleReset() {
    if (!confirm("Restaurar os valores padrão?")) return;
    if (mockMode) {
      const defaults = resetMockSettings();
      setForm(defaults);
      showToast("success", "Valores padrão restaurados.");
    } else {
      setForm(PLATFORM_DEFAULTS);
      mutation.mutate(PLATFORM_DEFAULTS);
    }
  }

  function set<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(saved ?? PLATFORM_DEFAULTS);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Configurações da plataforma</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Personalize o nome, logo e cores da sua plataforma.
          </p>
        </div>

        {/* Mock mode badge */}
        {mockMode && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>
              <strong>Modo teste</strong> — dados salvos localmente.{" "}
              Remova <code className="font-mono text-xs">NEXT_PUBLIC_USE_MOCK_API</code> do .env.local para conectar ao backend.
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form column */}
        <div className="flex flex-col gap-6">
          {/* Identity */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Identidade
            </h2>
            <div className="flex flex-col gap-4">
              {/* Platform name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Nome da plataforma
                </label>
                <input
                  value={form.platform_name}
                  onChange={(e) => set("platform_name", e.target.value)}
                  placeholder="Ex: FitZone"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-brand focus:border-transparent focus:ring-2"
                />
              </div>

              {/* Logo */}
              <ImageUploadField
                label="Logotipo"
                hint="PNG/SVG transparente, min. 64×64px"
                currentUrl={form.logo_url}
                onUpload={(file) => logoMutation.mutate(file)}
                onRemove={() => set("logo_url", null)}
                uploading={logoMutation.isPending}
              />

              {/* Favicon */}
              <ImageUploadField
                label="Favicon"
                hint="ICO ou PNG quadrado, min. 32×32px"
                currentUrl={form.favicon_url}
                accept="image/x-icon,image/png,image/svg+xml"
                onUpload={(file) => faviconMutation.mutate(file)}
                onRemove={() => set("favicon_url", null)}
                uploading={faviconMutation.isPending}
              />
            </div>
          </section>

          {/* Colors */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Cores
            </h2>
            <div className="flex flex-col gap-4">
              <ColorField
                label="Cor principal"
                value={form.primary_color}
                onChange={(v) => set("primary_color", v)}
              />
              <ColorField
                label="Cor de destaque (hover)"
                value={form.accent_color}
                onChange={(v) => set("accent_color", v)}
              />
              <p className="text-xs text-zinc-500">
                A cor principal é usada em botões, ícones e destaques. A cor de destaque é usada em estados
                hover e foco.
              </p>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-100"
            >
              Restaurar padrões
            </button>
            <div className="flex items-center gap-3">
              {isDirty && (
                <button
                  type="button"
                  onClick={() => saved && setForm(saved)}
                  className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-100"
                >
                  Descartar alterações
                </button>
              )}
              <button
                disabled={!isDirty || mutation.isPending || isLoading}
                onClick={() => mutation.mutate(form)}
                className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
                    </svg>
                    Salvando...
                  </>
                ) : (
                  "Salvar configurações"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview column */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Pré-visualização em tempo real
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            Alterações são refletidas aqui antes de salvar. A plataforma inteira usará estas cores após salvar.
          </p>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-xl bg-zinc-900" />
          ) : (
            <ThemePreview values={form} />
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl transition-all duration-300 ${
            toast.type === "success"
              ? "border-green-500/30 bg-zinc-900 text-green-400"
              : "border-red-500/30 bg-zinc-900 text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )}
          <span className="text-sm">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
