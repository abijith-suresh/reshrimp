export function handleFaqKeyboard(e: KeyboardEvent): boolean {
  if (!e.target) return false;
  const button = (e.target as HTMLElement).closest(".faq-question");
  if (!button) return false;

  const item = button.closest(".faq-item");
  if (!item) return false;

  const allItems = Array.from(document.querySelectorAll(".faq-item"));
  const currentIndex = allItems.indexOf(item as HTMLElement);
  if (currentIndex === -1) return false;

  let nextIndex: number;

  switch (e.key) {
    case "ArrowDown":
      nextIndex = currentIndex + 1 >= allItems.length ? 0 : currentIndex + 1;
      break;
    case "ArrowUp":
      nextIndex = currentIndex - 1 < 0 ? allItems.length - 1 : currentIndex - 1;
      break;
    case "Home":
      nextIndex = 0;
      break;
    case "End":
      nextIndex = allItems.length - 1;
      break;
    default:
      return false;
  }

  const nextButton = allItems[nextIndex].querySelector(".faq-question") as HTMLElement | null;
  if (nextButton) {
    nextButton.focus();
  }

  e.preventDefault();
  return true;
}
