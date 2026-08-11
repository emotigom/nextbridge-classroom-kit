const languageButtons = [...document.querySelectorAll("[data-lang-button]")];
const translatable = [...document.querySelectorAll("[data-ko][data-en]")];
const placeholders = [...document.querySelectorAll("[data-placeholder-ko][data-placeholder-en]")];
const roomSearch = document.querySelector("#room-search");
const roomRows = [...document.querySelectorAll(".room-row[data-room-keywords]")];
const roomEmpty = document.querySelector("#room-empty");
const toast = document.querySelector("#toast");
let toastTimer;

function setLanguage(language) {
  const nextLanguage = language === "en" ? "en" : "ko";
  document.documentElement.lang = nextLanguage;

  for (const element of translatable) {
    const value = element.dataset[nextLanguage];
    if (value !== undefined) element.innerHTML = value;
  }

  for (const element of placeholders) {
    element.placeholder = element.dataset[`placeholder${nextLanguage === "ko" ? "Ko" : "En"}`] || "";
  }

  for (const button of languageButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.langButton === nextLanguage));
  }

  try {
    localStorage.setItem("nextbridge-guide-language", nextLanguage);
  } catch {
    // The guide remains fully usable when storage is unavailable.
  }
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2100);
}

for (const button of languageButtons) {
  button.addEventListener("click", () => setLanguage(button.dataset.langButton));
}

try {
  setLanguage(localStorage.getItem("nextbridge-guide-language") || "ko");
} catch {
  setLanguage("ko");
}

if (roomSearch) {
  roomSearch.addEventListener("input", () => {
    const query = roomSearch.value.trim().toLocaleLowerCase();
    let visibleCount = 0;

    for (const row of roomRows) {
      const searchable = `${row.dataset.roomKeywords || ""} ${row.textContent}`.toLocaleLowerCase();
      const isVisible = !query || searchable.includes(query);
      row.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    }

    if (roomEmpty) roomEmpty.hidden = visibleCount > 0;
  });
}

const copyAddress = document.querySelector("#copy-address");
if (copyAddress) {
  copyAddress.addEventListener("click", async () => {
    const address = copyAddress.dataset.copy || "";
    const isEnglish = document.documentElement.lang === "en";
    try {
      await navigator.clipboard.writeText(address);
      showToast(isEnglish ? "Address copied." : "주소를 복사했습니다.");
    } catch {
      showToast(isEnglish ? "Please copy the address manually." : "주소를 길게 눌러 복사해 주세요.");
    }
  });
}

const revealElements = [...document.querySelectorAll(".reveal")];
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 }
  );

  for (const element of revealElements) observer.observe(element);
} else {
  for (const element of revealElements) element.classList.add("is-visible");
}
