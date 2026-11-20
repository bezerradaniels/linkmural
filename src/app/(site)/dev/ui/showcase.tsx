"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Chip,
  Dialog,
  EmptyState,
  Icon,
  ICON_PATHS,
  Input,
  Progress,
  Radio,
  Segmented,
  Skeleton,
  Steps,
  Switch,
  TextLink,
  ToastProvider,
  useToast,
  type IconName,
} from "@/components/ui";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-5 sm:p-6">
      <h2 className="font-display text-title tracking-[-0.03em]">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

function ToastDemo() {
  const toast = useToast();
  return (
    <Row>
      <Button variant="secondary" onClick={() => toast("Link copiado")}>
        Mostrar toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            message: "Link excluído",
            action: {
              label: "Desfazer",
              onClick: () => toast("Link restaurado"),
            },
          })
        }
      >
        Toast com ação
      </Button>
    </Row>
  );
}

export function Showcase() {
  const [dark, setDark] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [chips, setChips] = useState<string[]>(["Instagram"]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [dark]);

  return (
    <ToastProvider>
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-display-md tracking-[-0.03em]">
              Componentes
            </h1>
            <p className="text-small text-ink-muted">
              Base do MVP · só em desenvolvimento
            </p>
          </div>
          <Switch
            label="Tema escuro"
            checked={dark}
            onChange={(e) => setDark(e.target.checked)}
          />
        </header>

        <Section title="Button">
          <Row>
            <Button>Publicar</Button>
            <Button variant="secondary">
              <Icon name="plus" /> Adicionar link
            </Button>
            <Button variant="outline">Ver planos</Button>
            <Button variant="ghost">Cancelar</Button>
            <Button variant="danger">Excluir</Button>
          </Row>
          <Row>
            <Button size="sm">Pequeno</Button>
            <Button size="lg">Criar minha página</Button>
            <Button loading>Publicando…</Button>
            <Button disabled>Limite atingido</Button>
            <Button iconOnly variant="outline" aria-label="Copiar link">
              <Icon name="copy" />
            </Button>
          </Row>
          <p>
            Link de texto: <TextLink href="/">ver página inicial</TextLink>
          </p>
        </Section>

        <Section title="Input">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Endereço da página"
              prefix="linkmural.com/"
              defaultValue="studioforca"
              success="Endereço livre"
            />
            <Input
              label="Endereço da página"
              prefix="linkmural.com/"
              defaultValue="instagram"
              error="Esse endereço é reservado. Tente outro."
            />
            <Input
              label="WhatsApp"
              type="tel"
              inputMode="tel"
              placeholder="(11) 99999-0000"
              help="Com DDD. Vira o botão de WhatsApp da página."
            />
            <Input
              label="Nome do negócio"
              disabled
              defaultValue="Studio Força"
            />
          </div>
        </Section>

        <Section title="Controles">
          <div className="flex flex-col">
            <Switch label="Mostrar este link" defaultChecked />
            <Switch label="Horário de domingo" />
            <Checkbox label="Aceito os termos de uso" defaultChecked />
            <Checkbox label="Receber dicas por e-mail" />
            <Radio name="billing" label="Mensal" defaultChecked />
            <Radio name="billing" label="Anual (2 meses grátis)" />
            <Switch label="Desativado" disabled />
          </div>
        </Section>

        <Section title="Badge, Chip e Segmented">
          <Row>
            <Badge>Grátis</Badge>
            <Badge variant="pro">Pro</Badge>
            <Badge variant="business">Negócios</Badge>
            <Badge variant="outline" dot="positive" live>
              Publicada
            </Badge>
            <Badge dot="warning">Pagamento pendente</Badge>
            <Badge dot="off">Rascunho</Badge>
          </Row>
          <Row>
            {["Agenda", "WhatsApp", "Instagram", "Loja", "Cardápio"].map(
              (label) => (
                <Chip
                  key={label}
                  selected={chips.includes(label)}
                  onClick={() =>
                    setChips((prev) =>
                      prev.includes(label)
                        ? prev.filter((c) => c !== label)
                        : [...prev, label],
                    )
                  }
                >
                  {label}
                </Chip>
              ),
            )}
          </Row>
          <Segmented
            label="Período"
            options={[
              { value: "7", label: "7 dias" },
              { value: "30", label: "30 dias" },
              { value: "90", label: "90 dias" },
            ]}
          />
        </Section>

        <Section title="Avatar">
          <Row>
            <Avatar name="Daniel Bezerra" size={32} />
            <Avatar name="Studio Força" square />
            <Avatar name="Bia Doces" size={56} />
            <Avatar name="Studio Força" size={64} ring />
          </Row>
        </Section>

        <Section title="Alert">
          <Alert
            title="Você usou 5 de 5 links"
            action={<Button size="sm">Ver planos</Button>}
          >
            No Pro os links são ilimitados.
          </Alert>
          <Alert tone="success" title="Página publicada">
            Seu link já está no ar.
          </Alert>
          <Alert tone="warning" title="Pagamento pendente">
            Atualize o cartão para manter o Pro.
          </Alert>
          <Alert tone="error" title="Não deu para salvar">
            Confira sua conexão e tente de novo.
          </Alert>
        </Section>

        <Section title="Toast">
          <ToastDemo />
        </Section>

        <Section title="Skeleton e Progress">
          <div className="flex items-center gap-4">
            <Skeleton variant="avatar" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton variant="title" className="w-1/2" />
              <Skeleton className="w-3/4" />
            </div>
          </div>
          <Skeleton variant="card" />
          <div className="flex flex-col gap-2">
            <span className="text-small text-ink-muted">3 de 5 links</span>
            <Progress value={3} max={5} label="Links usados" />
            <Progress value={5} max={5} label="Links usados" tone="warning" />
          </div>
          <Steps total={7} current={3} />
        </Section>

        <Section title="EmptyState e Dialog">
          <EmptyState
            title="Nenhum link ainda"
            text="Cole o endereço do seu Instagram, agenda ou loja. A gente reconhece e coloca o ícone."
            action={
              <Button variant="secondary">
                <Icon name="plus" /> Adicionar link
              </Button>
            }
          />
          <Row>
            <Button variant="outline" onClick={() => setDialog(true)}>
              Abrir diálogo
            </Button>
          </Row>
          <Dialog
            open={dialog}
            onClose={() => setDialog(false)}
            title="Excluir este link?"
            description="Ele sai da sua página agora. Os cliques já contados continuam nas métricas."
            actions={
              <>
                <Button variant="ghost" onClick={() => setDialog(false)}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={() => setDialog(false)}>
                  Excluir link
                </Button>
              </>
            }
          />
        </Section>

        <Section title="Ícones">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {(Object.keys(ICON_PATHS) as IconName[]).map((name) => (
              <div
                key={name}
                className="flex flex-col items-center gap-1.5 rounded-md p-2 text-caption text-ink-muted"
              >
                <Icon name={name} size={22} className="text-ink" />
                {name}
              </div>
            ))}
          </div>
        </Section>
      </main>
    </ToastProvider>
  );
}
