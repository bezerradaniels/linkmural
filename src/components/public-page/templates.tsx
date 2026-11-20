import { Icon } from "@/components/ui/Icon";
import { linkHref } from "@/lib/public-actions";
import { QrButton, ShareButton } from "./client";
import {
  Footer,
  LinkCard,
  LinkIcon,
  LinkTile,
  Logo,
  Pin,
  QuickIcon,
  SectionHeader,
  Status,
  type TemplateProps,
} from "./parts";

const roundBtn =
  "grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-0";
const pill =
  "inline-flex h-[34px] items-center gap-2 rounded-full px-3 text-[13px] font-medium";

/* -------------------------------------------------------------------------- */
/* Balcão: the main action first, quick actions, then the list                */
/* -------------------------------------------------------------------------- */

export function Balcao({ page, model, theme, pageUrl }: TemplateProps) {
  const quick = [
    model.whatsapp && {
      label: "WhatsApp",
      href: model.whatsapp.href,
      icon: "chat" as const,
    },
    model.call && {
      label: "Ligar",
      href: model.call.href,
      icon: "phone" as const,
    },
    model.directions && {
      label: "Como chegar",
      href: model.directions.href,
      icon: "pin" as const,
    },
  ].filter(Boolean) as {
    label: string;
    href: string;
    icon: "chat" | "phone" | "pin";
  }[];

  return (
    <>
      <main className="flex flex-col gap-4 px-6 pt-12 pb-4">
        <header className="flex items-center gap-3.5">
          <Logo
            page={page}
            model={model}
            size={64}
            className="bg-(--accent) text-(--on-accent)"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h1 className="m-0 text-[22px] leading-tight font-bold tracking-[-0.01em]">
              {model.name}
            </h1>
            {page.kind && (
              <span className="text-[14px] text-(--muted)">{page.kind}</span>
            )}
          </div>
          <ShareButton
            url={pageUrl}
            title={model.name}
            className={`${roundBtn} bg-(--soft) text-(--ink)`}
          />
        </header>

        {(model.status || model.place) && (
          <div className="flex flex-wrap gap-2">
            <Status
              page={page}
              model={model}
              className={`${pill} bg-(--soft)`}
            />
            {model.place && (
              <span className={`${pill} bg-(--soft)`}>
                <Icon name="pin" size={15} />
                {model.place}
              </span>
            )}
          </div>
        )}

        {page.bio && (
          <p className="m-0 text-[15px] leading-normal text-(--muted)">
            {page.bio}
          </p>
        )}

        {model.featured && (
          <a
            href={linkHref(model.featured)}
            rel="nofollow noopener"
            className="relative flex items-center gap-3.5 rounded-(--r-big) bg-(--accent) p-[18px] text-(--on-accent) no-underline transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <Pin />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[20px] leading-tight font-bold">
                {model.featured.title}
              </span>
              {model.featured.subtitle && (
                <span className="text-[13px] opacity-90">
                  {model.featured.subtitle}
                </span>
              )}
            </span>
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-(--on-accent) text-(--accent)">
              <Icon name="arrow" size={20} strokeWidth={2} />
            </span>
          </a>
        )}

        {quick.length > 0 && (
          <div
            className="grid gap-2.5"
            style={{
              gridTemplateColumns: `repeat(${quick.length}, minmax(0, 1fr))`,
            }}
          >
            {quick.map((q) => (
              <a
                key={q.label}
                href={q.href}
                rel="nofollow noopener"
                className="flex h-[76px] flex-col items-center justify-center gap-1.5 rounded-(--r) border border-(--card-border) bg-(--card-bg) text-(--card-ink) no-underline transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <QuickIcon name={q.icon} />
                <span className="text-[13px] font-semibold">{q.label}</span>
              </a>
            ))}
          </div>
        )}

        {model.links.length > 0 && (
          <>
            <SectionHeader count={model.links.length} />
            <div className="flex flex-col gap-(--card-gap)">
              {model.links.map((link) => (
                <LinkCard key={link.id} link={link} page={page} theme={theme} />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer page={page} extraBottom />

      <div className="fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-10 mx-auto w-full max-w-[460px] px-6">
        <div className="flex gap-1.5 rounded-full bg-(--ink) p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.25)]">
          {model.contactHref ? (
            <a
              href={model.contactHref}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-(--accent) text-[15px] font-bold text-(--on-accent) no-underline"
            >
              <Icon name="contact" size={18} />
              Salvar contato
            </a>
          ) : (
            <ShareButton
              url={pageUrl}
              title={model.name}
              className="flex h-[52px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-(--accent) text-[15px] font-bold text-(--on-accent)"
            />
          )}
          <QrButton
            slug={page.slug}
            pageId={page.id}
            pageUrl={pageUrl}
            className="grid size-[52px] shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-(--bg) text-(--ink)"
          />
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Mosaico: colored top, logo overlapping, bento grid                         */
/* -------------------------------------------------------------------------- */

export function Mosaico({ page, model, theme, pageUrl }: TemplateProps) {
  const subtitle = [page.kind, model.place].filter(Boolean).join(" · ");
  const onAccentBtn = `${roundBtn} bg-(--chip-on-accent) text-(--on-accent)`;

  return (
    <>
      <div className="flex h-44 items-start justify-between bg-(--accent) px-6 pt-12 text-(--on-accent)">
        <Status
          page={page}
          model={model}
          className={`${pill} bg-(--chip-on-accent) font-semibold`}
        />
        <div className="ml-auto flex gap-2">
          <QrButton
            slug={page.slug}
            pageId={page.id}
            pageUrl={pageUrl}
            className={onAccentBtn}
          />
          <ShareButton
            url={pageUrl}
            title={model.name}
            className={onAccentBtn}
          />
        </div>
      </div>

      <main className="flex flex-col pb-4">
        <div className="flex flex-col gap-1 px-6">
          <Logo
            page={page}
            model={model}
            size={92}
            className="-mt-[46px] border-4 border-(--bg) bg-(--surface) text-(--ink)"
          />
          <h1 className="m-0 mt-2.5 text-[26px] leading-tight font-bold tracking-[-0.01em]">
            {model.name}
          </h1>
          {subtitle && (
            <span className="text-[14px] text-(--muted)">{subtitle}</span>
          )}
          {page.bio && (
            <p className="m-0 mt-1 text-[14px] leading-normal text-(--muted)">
              {page.bio}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-(--card-gap) px-6 pt-4">
          {model.featured && (
            <a
              href={linkHref(model.featured)}
              rel="nofollow noopener"
              className="relative col-span-2 flex items-center gap-3.5 rounded-(--r-big) bg-(--ink) p-[18px] text-(--bg) no-underline transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <Pin />
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-(--accent) text-(--on-accent)">
                <LinkIcon
                  link={model.featured}
                  theme={{ ...theme, iconColor: "style" }}
                  size={20}
                />
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[18px] leading-tight font-bold">
                  {model.featured.title}
                </span>
                {model.featured.subtitle && (
                  <span className="text-[13px] opacity-80">
                    {model.featured.subtitle}
                  </span>
                )}
              </span>
              <Icon name="arrow" size={18} strokeWidth={2} />
            </a>
          )}
          {model.links.map((link) => (
            <LinkTile key={link.id} link={link} page={page} theme={theme} />
          ))}
        </div>
      </main>

      <Footer
        page={page}
        extraBottom={Boolean(model.whatsapp || model.call || model.directions)}
      />

      {(model.whatsapp || model.call || model.directions) && (
        <div className="fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-10 mx-auto w-full max-w-[460px] px-6">
          <div className="flex gap-1.5 rounded-full border border-(--line) bg-(--surface) p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
            {model.whatsapp ? (
              <a
                href={model.whatsapp.href}
                rel="nofollow noopener"
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-(--accent) text-[15px] font-bold text-(--on-accent) no-underline"
              >
                <Icon name="chat" size={18} />
                Falar no WhatsApp
              </a>
            ) : model.contactHref ? (
              <a
                href={model.contactHref}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-(--accent) text-[15px] font-bold text-(--on-accent) no-underline"
              >
                <Icon name="contact" size={18} />
                Salvar contato
              </a>
            ) : null}
            {model.call && (
              <a
                href={model.call.href}
                aria-label="Ligar"
                className="grid size-[52px] shrink-0 place-items-center rounded-full bg-(--soft) text-(--ink)"
              >
                <Icon name="phone" size={20} />
              </a>
            )}
            {model.directions && (
              <a
                href={model.directions.href}
                rel="nofollow noopener"
                aria-label="Como chegar"
                className="grid size-[52px] shrink-0 place-items-center rounded-full bg-(--soft) text-(--ink)"
              >
                <Icon name="pin" size={20} />
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Cartão: a digital business card, then compact links                        */
/* -------------------------------------------------------------------------- */

export function Cartao({ page, model, theme, pageUrl }: TemplateProps) {
  const softBtn = `${roundBtn} bg-(--soft) text-(--ink)`;
  const contactRows = [
    model.call && { icon: "phone" as const, ...model.call },
    model.email && { icon: "mail" as const, ...model.email },
    model.directions && { icon: "pin" as const, ...model.directions },
  ].filter(Boolean) as {
    icon: "phone" | "mail" | "pin";
    href: string;
    label: string;
  }[];

  return (
    <>
      <main className="flex flex-col gap-4 px-6 pt-12 pb-4">
        <div className="flex items-center justify-between gap-3">
          <Status page={page} model={model} className={`${pill} bg-(--soft)`} />
          <div className="ml-auto flex gap-2">
            <QrButton
              slug={page.slug}
              pageId={page.id}
              pageUrl={pageUrl}
              className={softBtn}
            />
            <ShareButton url={pageUrl} title={model.name} className={softBtn} />
          </div>
        </div>

        <section className="flex flex-col gap-3.5 rounded-(--r-big) border border-(--line) bg-(--surface) p-5">
          <div className="flex items-center gap-3.5">
            <Logo
              page={page}
              model={model}
              size={56}
              className="bg-(--accent) text-(--on-accent)"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="m-0 text-[22px] leading-tight font-bold tracking-[-0.01em]">
                {model.name}
              </h1>
              {page.kind && (
                <span className="text-[14px] text-(--muted)">{page.kind}</span>
              )}
            </div>
          </div>
          {page.bio && (
            <p className="m-0 text-[14px] leading-normal text-(--muted)">
              {page.bio}
            </p>
          )}

          {contactRows.length > 0 && (
            <>
              <div aria-hidden className="h-px bg-(--line)" />
              <div className="flex flex-col">
                {contactRows.map((row) => (
                  <a
                    key={row.icon}
                    href={row.href}
                    rel="nofollow noopener"
                    className="flex min-h-11 items-center gap-3 text-[15px] break-all text-(--ink) no-underline"
                  >
                    <Icon
                      name={row.icon}
                      size={18}
                      className="shrink-0 text-(--muted)"
                    />
                    {row.label}
                  </a>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            {(model.featured || model.whatsapp) && (
              <a
                href={
                  model.featured
                    ? linkHref(model.featured)
                    : model.whatsapp!.href
                }
                rel="nofollow noopener"
                className="relative flex h-12 min-w-0 flex-[1_1_180px] items-center justify-center rounded-full bg-(--accent) px-3 text-center text-[15px] font-bold text-(--on-accent) no-underline"
              >
                {model.featured && <Pin />}
                <span className="truncate">
                  {model.featured ? model.featured.title : "WhatsApp"}
                </span>
              </a>
            )}
            {model.contactHref && (
              <a
                href={model.contactHref}
                className="flex h-12 flex-[1_1_150px] items-center justify-center gap-2 rounded-full border border-(--line) px-4 text-[15px] font-semibold whitespace-nowrap text-(--ink) no-underline"
              >
                <Icon name="contact" size={18} />
                Salvar contato
              </a>
            )}
          </div>
        </section>

        {model.links.length > 0 && (
          <>
            <SectionHeader count={model.links.length} />
            <div className="flex flex-col gap-(--card-gap)">
              {model.links.map((link) => (
                <LinkCard key={link.id} link={link} page={page} theme={theme} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer page={page} />
    </>
  );
}
