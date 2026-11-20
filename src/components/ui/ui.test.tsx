import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar, initials } from "./Avatar";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { Input } from "./Input";
import { Progress, Steps, clampPercent } from "./Progress";
import { Segmented } from "./Segmented";
import { ToastProvider, useToast } from "./Toast";

describe("initials", () => {
  it("takes first and last word", () => {
    expect(initials("Studio Força Funcional")).toBe("SF");
  });
  it("handles one word, extra spaces and empty", () => {
    expect(initials("  ana ")).toBe("A");
    expect(initials("")).toBe("?");
  });
  it("renders initials when there is no image", () => {
    render(<Avatar name="Bia Doces" />);
    expect(screen.getByRole("img", { name: "Bia Doces" })).toHaveTextContent(
      "BD",
    );
  });
});

describe("Button", () => {
  it("is disabled and busy while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Publicando…
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Publicando…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
  it("defaults to type=button so it never submits by accident", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});

describe("Input", () => {
  it("links the label and the error message", () => {
    render(
      <Input
        label="Endereço"
        prefix="linkmural.com/"
        error="Esse endereço já tem dono"
      />,
    );
    const input = screen.getByLabelText("Endereço");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Esse endereço já tem dono");
    expect(screen.getByText("linkmural.com/")).toBeInTheDocument();
  });
  it("shows help when there is no error", () => {
    render(<Input label="WhatsApp" help="Com DDD" type="tel" />);
    const input = screen.getByLabelText("WhatsApp");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAccessibleDescription("Com DDD");
  });
});

describe("Chip and Segmented", () => {
  it("chip exposes its pressed state", () => {
    render(<Chip selected>Instagram</Chip>);
    expect(screen.getByRole("button", { name: "Instagram" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
  it("segmented switches the pressed option and reports it", async () => {
    const onChange = vi.fn();
    render(
      <Segmented
        label="Cobrança"
        options={[
          { value: "month", label: "Mensal" },
          { value: "year", label: "Anual" },
        ]}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Anual" }));
    expect(onChange).toHaveBeenCalledWith("year");
    expect(screen.getByRole("button", { name: "Anual" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Mensal" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

describe("Progress", () => {
  it("clamps to 0–100", () => {
    expect(clampPercent(3, 5)).toBe(60);
    expect(clampPercent(9, 5)).toBe(100);
    expect(clampPercent(-1)).toBe(0);
    expect(clampPercent(1, 0)).toBe(0);
  });
  it("exposes progress to assistive tech", () => {
    render(<Progress value={3} max={5} label="Links usados" />);
    expect(
      screen.getByRole("progressbar", { name: "Links usados" }),
    ).toHaveAttribute("aria-valuenow", "3");
  });
  it("steps name the current step", () => {
    render(<Steps total={7} current={3} />);
    expect(
      screen.getByRole("progressbar", { name: "Passo 3 de 7" }),
    ).toBeInTheDocument();
  });
});

describe("Toast", () => {
  afterEach(() => vi.useRealTimers());

  function Trigger() {
    const toast = useToast();
    return <button onClick={() => toast("Link copiado")}>copiar</button>;
  }

  it("shows a message and hides it after 4 seconds", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    act(() => screen.getByRole("button", { name: "copiar" }).click());
    expect(screen.getByRole("status")).toHaveTextContent("Link copiado");
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
