import { describe, expect, it } from "vitest";
import { handleFaqKeyboard } from "./faqKeyboard";

function createFaqDom() {
  document.body.innerHTML = `
    <div class="faq-item">
      <button class="faq-question" id="faq-1">Question 1</button>
      <div class="faq-body" role="region" id="faq-1-panel"></div>
    </div>
    <div class="faq-item">
      <button class="faq-question" id="faq-2">Question 2</button>
      <div class="faq-body" role="region" id="faq-2-panel"></div>
    </div>
    <div class="faq-item">
      <button class="faq-question" id="faq-3">Question 3</button>
      <div class="faq-body" role="region" id="faq-3-panel"></div>
    </div>
  `;
}

function fireKeydownOn(target: Element, key: string) {
  (target as HTMLElement).focus();
  let prevented = false;
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  (target as HTMLElement).addEventListener("keydown", (e) => {
    prevented = handleFaqKeyboard(e);
  });
  (target as HTMLElement).dispatchEvent(event);
  return { event, prevented };
}

describe("handleFaqKeyboard", () => {
  it("moves focus from first to second question on ArrowDown", () => {
    createFaqDom();
    const btn1 = document.getElementById("faq-1")!;

    fireKeydownOn(btn1, "ArrowDown");

    expect(document.activeElement?.id).toBe("faq-2");
  });

  it("moves focus from second to first question on ArrowUp", () => {
    createFaqDom();
    const btn2 = document.getElementById("faq-2")!;

    fireKeydownOn(btn2, "ArrowUp");

    expect(document.activeElement?.id).toBe("faq-1");
  });

  it("moves focus to first question on Home", () => {
    createFaqDom();
    const btn3 = document.getElementById("faq-3")!;

    fireKeydownOn(btn3, "Home");

    expect(document.activeElement?.id).toBe("faq-1");
  });

  it("moves focus to last question on End", () => {
    createFaqDom();
    const btn1 = document.getElementById("faq-1")!;

    fireKeydownOn(btn1, "End");

    expect(document.activeElement?.id).toBe("faq-3");
  });

  it("does nothing when target is not a faq-question", () => {
    createFaqDom();
    const other = document.createElement("div");
    document.body.appendChild(other);

    let prevented = false;
    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    other.addEventListener("keydown", (e) => {
      prevented = handleFaqKeyboard(e);
    });
    other.dispatchEvent(event);

    expect(prevented).toBe(false);
  });

  it("does nothing for unsupported keys", () => {
    createFaqDom();
    const btn1 = document.getElementById("faq-1")!;

    fireKeydownOn(btn1, "a");

    expect(document.activeElement?.id).toBe("faq-1");
  });

  it("prevents default for supported navigation keys", () => {
    createFaqDom();
    const btn1 = document.getElementById("faq-1")!;

    const { prevented } = fireKeydownOn(btn1, "ArrowDown");

    expect(prevented).toBe(true);
  });

  it("wraps ArrowDown past last item to first", () => {
    createFaqDom();
    const btn3 = document.getElementById("faq-3")!;

    fireKeydownOn(btn3, "ArrowDown");

    expect(document.activeElement?.id).toBe("faq-1");
  });

  it("wraps ArrowUp past first item to last", () => {
    createFaqDom();
    const btn1 = document.getElementById("faq-1")!;

    fireKeydownOn(btn1, "ArrowUp");

    expect(document.activeElement?.id).toBe("faq-3");
  });
});
