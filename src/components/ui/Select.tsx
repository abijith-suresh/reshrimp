import {
  For,
  Show,
  createSignal,
  createEffect,
  onCleanup,
  createUniqueId,
  type Accessor,
} from "solid-js";
import { Portal } from "solid-js/web";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  class?: string;
}

interface DropdownPos {
  /** Set for downward-opening dropdowns (viewport px from top). */
  top?: number;
  /** Set for upward-opening dropdowns (viewport px from bottom). */
  bottom?: number;
  left: number;
  width: number;
  openUpward: boolean;
}

export default function Select(props: SelectProps) {
  const triggerId = createUniqueId();
  const listboxId = createUniqueId();

  // Callback refs so static analysis can see the assignment
  let triggerRef: HTMLButtonElement | undefined = undefined;
  let listboxRef: HTMLUListElement | undefined = undefined;

  const [open, setOpen] = createSignal(false);
  const [focusedIndex, setFocusedIndex] = createSignal(-1);
  const [pos, setPos] = createSignal<DropdownPos>({
    left: 0,
    width: 0,
    openUpward: false,
  });

  // Derive enabled-option indices for keyboard nav
  const enabledIndices: Accessor<number[]> = () =>
    props.options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i !== -1);

  const selectedLabel = () =>
    props.options.find((o) => o.value === props.value)?.label ?? props.placeholder ?? "";

  // ── Position calculation ────────────────────────────────────────────────
  function calcPos(): DropdownPos {
    if (!triggerRef) return { left: 0, width: 0, openUpward: false };
    const r = triggerRef.getBoundingClientRect();
    const dropdownMaxH = 240;
    const spaceBelow = window.innerHeight - r.bottom;
    const openUpward = spaceBelow < dropdownMaxH && r.top > dropdownMaxH;
    // Use position:fixed viewport coordinates — no scrollY/scrollX needed.
    // For upward openings anchor via `bottom` so the dropdown bottom always
    // sits flush with the trigger top regardless of actual dropdown height.
    return openUpward
      ? { bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width, openUpward: true }
      : { top: r.bottom + 4, left: r.left, width: r.width, openUpward: false };
  }

  // ── Open / close ─────────────────────────────────────────────────────────
  function openDropdown() {
    if (props.disabled) return;
    setPos(calcPos());
    const idx = props.options.findIndex((o) => o.value === props.value);
    setFocusedIndex(idx >= 0 ? idx : (enabledIndices()[0] ?? -1));
    setOpen(true);
    queueMicrotask(() => listboxRef?.focus());
  }

  function closeDropdown() {
    setOpen(false);
    setFocusedIndex(-1);
    triggerRef?.focus();
  }

  function selectOption(value: string) {
    props.onChange(value);
    closeDropdown();
  }

  // ── Scroll focused option into view ──────────────────────────────────────
  createEffect(() => {
    const idx = focusedIndex();
    if (!open() || idx < 0 || !listboxRef) return;
    const el = listboxRef.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  });

  // ── Reposition on scroll / resize while open ─────────────────────────────
  createEffect(() => {
    if (!open()) return;
    const update = () => setPos(calcPos());
    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update, { passive: true });
    onCleanup(() => {
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
    });
  });

  // ── Click outside ────────────────────────────────────────────────────────
  createEffect(() => {
    if (!open()) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (!triggerRef?.contains(t) && !listboxRef?.contains(t)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    }
    // Small delay so the trigger's own click doesn't immediately re-close
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    onCleanup(() => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    });
  });

  // ── Keyboard: trigger ────────────────────────────────────────────────────
  function handleTriggerKeyDown(e: KeyboardEvent) {
    if (props.disabled) return;
    switch (e.key) {
      case "Enter":
      case " ":
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        openDropdown();
        break;
    }
  }

  // ── Keyboard: listbox ─────────────────────────────────────────────────────
  function handleListKeyDown(e: KeyboardEvent) {
    const enabled = enabledIndices();
    if (enabled.length === 0) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const cur = focusedIndex();
        const next = enabled.find((i) => i > cur) ?? enabled[0]!;
        setFocusedIndex(next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const cur = focusedIndex();
        const prev = [...enabled].reverse().find((i) => i < cur) ?? enabled[enabled.length - 1]!;
        setFocusedIndex(prev);
        break;
      }
      case "Home":
        e.preventDefault();
        setFocusedIndex(enabled[0]!);
        break;
      case "End":
        e.preventDefault();
        setFocusedIndex(enabled[enabled.length - 1]!);
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const idx = focusedIndex();
        const opt = props.options[idx];
        if (opt && !opt.disabled) selectOption(opt.value);
        break;
      }
      case "Escape":
      case "Tab":
        closeDropdown();
        break;
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        ref={(el) => (triggerRef = el)}
        type="button"
        id={props.id ?? triggerId}
        aria-haspopup="listbox"
        aria-expanded={open()}
        aria-controls={open() ? listboxId : undefined}
        aria-disabled={props.disabled}
        disabled={props.disabled}
        class={`flex w-full items-center justify-between gap-2 px-3 py-2 border border-sp-border rounded-[12px] font-body text-[0.85rem] text-sp-text bg-sp-bg cursor-pointer text-left transition-[border-color,box-shadow] duration-200 hover:border-sp-lavender hover:bg-sp-lavender-light focus-visible:outline-hidden focus-visible:border-sp-lavender focus-visible:shadow-[0_0_0_3px_rgba(167,139,250,0.15)] disabled:opacity-50 disabled:cursor-not-allowed${props.class ? ` ${props.class}` : ""}`}
        classList={{ "sp-select-trigger-open": open() }}
        onClick={() => (open() ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span class="flex-1 truncate text-sp-text">{selectedLabel()}</span>
        <svg
          class="shrink-0 text-sp-lavender transition-transform duration-200 sp-select-chevron"
          classList={{ "sp-select-chevron-open": open() }}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4.5l3 3 3-3"
          />
        </svg>
      </button>

      {/* Dropdown portal */}
      <Show when={open()}>
        <Portal>
          <ul
            ref={(el) => (listboxRef = el)}
            id={listboxId}
            role="listbox"
            aria-labelledby={props.id ?? triggerId}
            tabIndex={-1}
            class="sp-select-listbox sp-select-listbox-portaled"
            classList={{ "sp-select-listbox-upward": pos().openUpward }}
            style={{
              top: pos().top !== undefined ? `${pos().top}px` : "auto",
              bottom: pos().bottom !== undefined ? `${pos().bottom}px` : "auto",
              left: `${pos().left}px`,
              width: `${pos().width}px`,
            }}
            onKeyDown={handleListKeyDown}
            onMouseLeave={() => setFocusedIndex(-1)}
          >
            <For each={props.options}>
              {(option, index) => (
                <li
                  role="option"
                  aria-selected={option.value === props.value}
                  aria-disabled={option.disabled}
                  class="flex items-center justify-between px-2.5 py-[0.45rem] rounded-[8px] font-body text-[0.85rem] text-sp-text cursor-pointer select-none transition-[background] duration-100 sp-select-option"
                  classList={{
                    "sp-select-option-selected": option.value === props.value,
                    "sp-select-option-focused": index() === focusedIndex(),
                    "sp-select-option-disabled": !!option.disabled,
                  }}
                  onMouseEnter={() => !option.disabled && setFocusedIndex(index())}
                  onMouseDown={(e) => {
                    e.preventDefault(); // keep focus on listbox
                    if (!option.disabled) selectOption(option.value);
                  }}
                >
                  {option.label}
                  <Show when={option.value === props.value}>
                    <svg
                      class="shrink-0 text-sp-lavender-dark sp-select-check"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M2 6l3 3 5-5"
                      />
                    </svg>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </Portal>
      </Show>
    </>
  );
}
