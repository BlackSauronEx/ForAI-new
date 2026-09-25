import { useState } from "react";
import { ANSWER_MD, ANSWER_TITLE } from "./data/answer";
import { Markdown } from "./components/Markdown";
import {
  BUILDS,
  DOCS,
  FEATURES_04,
  FORBIDDEN,
  HOST,
  NEW_04_FILES,
  OPEN_TASKS,
  PROJECT,
  VERSION_TRUTH,
  fmtBytes,
  type BuildStatus,
} from "./data/project";

const STATUS_META: Record<
  BuildStatus,
  { label: string; chip: string; dot: string }
> = {
  done: {
    label: "готово",
    chip: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
  },
  draft: {
    label: "черновик",
    chip: "border-amber-500/30 bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
  },
  planned: {
    label: "план",
    chip: "border-slate-500/30 bg-slate-500/15 text-slate-400",
    dot: "bg-slate-500",
  },
};

const PRI = {
  p0: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  p1: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  p2: "border-slate-500/30 bg-slate-500/10 text-slate-400",
};

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{label}</div>
      <div className={`mt-1 text-lg font-semibold tracking-tight ${tone ?? "text-white"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

export default function App() {
  const { copied, copy } = useCopy();
  const p0 = OPEN_TASKS.filter((t) => t.priority === "p0").length;

  return (
    <div className="min-h-screen bg-[#080c17] text-slate-300">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-amber-600/10 blur-[120px]" />
      </div>

      <div className="relative">
        <header className="border-b border-white/10 bg-[#080c17]/85 backdrop-blur">
          <div className="mx-auto max-w-[1600px] px-5 py-5 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-medium tracking-wider text-indigo-300/80 uppercase">
                  <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  Рабочая область плагина · {PROJECT.updatedAt}
                </div>
                <h1 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {PROJECT.name}
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  {PROJECT.stage} · проверено {PROJECT.latestProven} · в коде{" "}
                  <span className="font-semibold text-amber-300">
                    {PROJECT.currentCode} {PROJECT.currentLabel}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/downloads/${PROJECT.zipPath}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400/60 hover:text-white"
                  download
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                  Скачать ZIP {PROJECT.currentCode}
                </a>
                <a
                  href={PROJECT.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:text-white"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-5 py-6 lg:flex-row lg:px-8 lg:py-8">
          <main className="min-w-0 flex-1 space-y-6">
            {/* Verdict */}
            <section className="overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-transparent">
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-300 uppercase">
                    Черновик 0.4.0
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-300 uppercase">
                    0.3.1 закрыта
                  </span>
                  <span className="text-[11px] text-slate-500">handoff готов · стенды на месте</span>
                </div>
                <p className="mt-3 text-lg leading-snug font-semibold text-white sm:text-xl">
                  Код итерации 3 уже в дереве плагина. Не хватает прогона check.sh, отчёта и
                  cache-сценария. Документация, ZIP и wp-dev собраны так, чтобы новый чат подхватил
                  работу без потери задач.
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
                  <span className="font-semibold text-indigo-300">Следующий шаг:</span> {PROJECT.nextStep}
                </p>
              </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Проверено" value={PROJECT.latestProven} sub="отчёт пользователя" tone="text-emerald-300" />
              <Stat label="В коде" value={PROJECT.currentCode} sub={PROJECT.currentLabel} tone="text-amber-300" />
              <Stat label="Открыто P0" value={String(p0)} sub={`из ${OPEN_TASKS.length} задач`} tone="text-rose-300" />
              <Stat label="Требования" value="WP 6.4+" sub="PHP 8.1 · WC 8.2" />
            </section>

            {/* Builds timeline */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <h2 className="text-base font-bold tracking-tight text-white">Сборки</h2>
              <p className="mt-1 mb-4 text-[13px] text-slate-500">От каркаса до таблицы. 0.4.0 — draft.</p>
              <ol className="space-y-2">
                {BUILDS.map((b) => {
                  const m = STATUS_META[b.status];
                  return (
                    <li
                      key={b.version}
                      className="flex flex-wrap items-start gap-3 rounded-xl border border-white/[0.07] bg-slate-950/40 px-3 py-2.5"
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.dot}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-mono text-sm font-semibold text-white">{b.version}</span>
                          <span className="text-sm text-slate-300">{b.name}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${m.chip}`}>
                            {m.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">{b.notes}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* Open tasks */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <h2 className="text-base font-bold tracking-tight text-white">Открытые задачи до «0.4.0 готова»</h2>
              <p className="mt-1 mb-4 text-[13px] text-slate-500">
                Definition of Done — в <code className="font-mono text-sky-300">docs/HANDOFF.md</code> §8.
              </p>
              <ul className="space-y-2">
                {OPEN_TASKS.map((t) => (
                  <li
                    key={t.id}
                    className="flex gap-3 rounded-xl border border-white/[0.07] bg-slate-950/40 px-3 py-2.5"
                  >
                    <span
                      className={`mt-0.5 h-fit shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${PRI[t.priority]}`}
                    >
                      {t.priority}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">{t.title}</div>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">{t.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* 0.4 files + features */}
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <h2 className="text-base font-bold tracking-tight text-white">Новые файлы 0.4.0</h2>
                <ul className="mt-3 space-y-1.5">
                  {NEW_04_FILES.map((f) => (
                    <li
                      key={f.path}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-slate-950/40 px-2.5 py-1.5"
                    >
                      <code className="truncate font-mono text-[11.5px] text-slate-300">{f.path}</code>
                      <span className="shrink-0 font-mono text-[11px] text-slate-500">{fmtBytes(f.bytes)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <h2 className="text-base font-bold tracking-tight text-white">Что умеет таблица</h2>
                <ul className="mt-3 space-y-1.5">
                  {FEATURES_04.map((f) => (
                    <li key={f} className="flex gap-2 text-[12.5px] leading-relaxed text-slate-400">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Version truth */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <h2 className="text-base font-bold tracking-tight text-white">Сверка версий</h2>
              <p className="mt-1 mb-4 text-[13px] text-slate-500">
                Три обязательных места + документация. Красное — дыра, которую надо закрыть до релиза.
              </p>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-white/[0.04] text-[11px] tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-3 py-2 font-medium">Место</th>
                      <th className="px-3 py-2 font-medium">Значение</th>
                      <th className="px-3 py-2 font-medium">Ок</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VERSION_TRUTH.map((row) => (
                      <tr key={row.place} className="border-t border-white/[0.06]">
                        <td className="px-3 py-2 font-mono text-[12px] text-slate-300">{row.place}</td>
                        <td className="px-3 py-2 text-slate-400">{row.value}</td>
                        <td className="px-3 py-2">
                          {row.ok ? (
                            <span className="text-emerald-400">yes</span>
                          ) : (
                            <span className="font-semibold text-rose-400">no</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Docs + host + forbidden */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <h2 className="text-base font-bold tracking-tight text-white">Документы для handoff</h2>
              <p className="mt-1 mb-4 text-[13px] text-slate-500">
                Читать по одному. Помеченные «сначала» — обязательный минимум нового чата.
              </p>
              <ul className="space-y-1.5">
                {DOCS.map((d) => (
                  <li
                    key={d.path}
                    className="flex flex-wrap items-baseline gap-2 rounded-lg border border-white/[0.06] bg-slate-950/40 px-3 py-2"
                  >
                    {d.readFirst && (
                      <span className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-300 uppercase">
                        сначала
                      </span>
                    )}
                    <code className="font-mono text-[12.5px] text-sky-300">{d.path}</code>
                    <span className="text-[12.5px] text-slate-500">{d.role}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <h2 className="text-base font-bold tracking-tight text-white">Ваш хостинг</h2>
                <ul className="mt-3 space-y-2 text-[12.5px] text-slate-400">
                  <li>
                    <span className="text-slate-500">Стек: </span>
                    {HOST.stack}
                  </li>
                  <li>
                    <span className="text-slate-500">Тема: </span>
                    {HOST.theme}
                  </li>
                  <li>
                    <span className="text-slate-500">Флаги: </span>
                    {HOST.flags}
                  </li>
                  <li>
                    <span className="text-slate-500">Устройства: </span>
                    {HOST.devices}
                  </li>
                  <li>
                    <span className="text-slate-500">Локально: </span>
                    {HOST.local}
                  </li>
                  <li className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-2 text-amber-200/90">
                    {HOST.lesson}
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
                <h2 className="text-base font-bold tracking-tight text-white">Запреты (ломают чат)</h2>
                <ul className="mt-3 space-y-1.5">
                  {FORBIDDEN.map((f) => (
                    <li key={f} className="flex gap-2 text-[12.5px] leading-relaxed text-slate-400">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Download */}
            <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-5 sm:p-6">
              <h2 className="text-base font-bold tracking-tight text-white">Скачать для ручных тестов</h2>
              <p className="mt-1 text-[13px] text-slate-400">
                Папка плагина или ZIP. 0.4.0 — черновик: на своём Storefront ставьте понимая это. Стабильная
                база — 0.3.1.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`/downloads/${PROJECT.zipPath}`}
                  download
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                >
                  {PROJECT.zipPath}
                </a>
                <code className="inline-flex items-center rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2.5 font-mono text-[12px] text-slate-400">
                  {PROJECT.pluginDir}
                </code>
              </div>
              <p className="mt-3 text-[12.5px] text-slate-500">
                Установка: Плагины → Добавить → Загрузить → ZIP → Активировать. Нужен WooCommerce 8.2+.
                Чек-лист — <code className="font-mono text-sky-300">docs/TESTING.md</code>.
              </p>
            </section>

            <p className="pb-4 text-center text-[11.5px] text-slate-600">
              Handoff · {PROJECT.slug} · {PROJECT.currentCode}-draft · проверено {PROJECT.latestProven}
            </p>
          </main>

          {/* Right panel — full answer */}
          <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[42%] lg:min-w-[420px] lg:shrink-0">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-indigo-500/25 bg-[#0a1020] shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-indigo-300/80 uppercase">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Текущий ответ · целиком
                  </div>
                  <p className="mt-0.5 truncate text-sm font-semibold text-white">{ANSWER_TITLE}</p>
                </div>
                <button
                  onClick={() => copy(ANSWER_MD)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    copied
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-indigo-400/30 bg-indigo-500/15 text-indigo-200 hover:border-indigo-400/60 hover:text-white"
                  }`}
                >
                  {copied ? "Скопировано" : "Скопировать ответ"}
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
                <Markdown source={ANSWER_MD} />
              </div>
              <div className="border-t border-white/10 bg-white/[0.02] px-4 py-2.5 text-[11px] text-slate-500">
                Дубль ответа из чата · {ANSWER_MD.length.toLocaleString("ru-RU")} символов · источник{" "}
                <code className="text-slate-400">src/data/answer.ts</code>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
