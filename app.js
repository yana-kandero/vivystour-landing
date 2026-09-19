// ============================================================
// VivysTour landing — konfiguracja Supabase
// TODO PRZED DEPLOYEM: wklej tu te same wartości, co w supabase-config.js
// głównej aplikacji (app.vivystour.pl) — URL projektu i anon key.
// Klucz anon jest publiczny z założenia (jak w aplikacji tour), ale
// insert do tabeli "leads" musi być dozwolony w RLS (public insert leads) —
// to już jest skonfigurowane w Supabase dla tego projektu.
// ============================================================
const SUPABASE_URL = "https://pmhhtbuhrflwincuulco.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtaGh0YnVocmZsd2luY3V1bGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MjY0ODUsImV4cCI6MjEwNTIwMjQ4NX0.VWHDQZ9ucshVxe6lrPaqIvDbSo1QJWYlnVVLDhkK_nM";

// ------------------------------------------------------------
// WAŻNE: zanim formularz zacznie zapisywać zgłoszenia, upewnij się,
// że tabela "leads" w Supabase dopuszcza:
//   1) lead_type = 'landing_signup' (jeśli jest ograniczenie CHECK na
//      kolumnie lead_type, trzeba je poszerzyć — zapytaj mnie, przygotuję
//      gotowy SQL do wklejenia w SQL Editor)
//   2) property_id = NULL (zgłoszenia z lendingu nie dotyczą jednego,
//      konkretnego już wystawionego obiektu)
//   3) kolumna landing_variant text (do porównania Wariantu 1 vs Wariantu 2 —
//      landing z AI-awatarem, gdy będzie gotowy)
// ------------------------------------------------------------

let supabaseClient = null;
try {
  if (window.supabase && SUPABASE_URL.indexOf("TODO") === -1) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.error("Supabase init error:", e);
}

const form = document.getElementById("leadForm");
const statusEl = document.getElementById("formStatus");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.style.color = "";
  statusEl.textContent = "";

  const fd = new FormData(form);
  const payload = {
    name: (fd.get("name") || "").toString().trim(),
    phone: (fd.get("phone") || "").toString().trim(),
    email: (fd.get("email") || "").toString().trim(),
    address: (fd.get("address") || "").toString().trim(),
    message: (fd.get("message") || "").toString().trim(),
    consent_marketing: fd.get("consent") === "on",
    landing_variant: (fd.get("landing_variant") || "v1").toString(),
  };

  if (!payload.name || !payload.phone || !payload.consent_marketing) {
    statusEl.style.color = "#ff8a8a";
    statusEl.textContent = "Uzupełnij wymagane pola i zaznacz zgodę.";
    return;
  }

  const submitBtn = form.querySelector(".form__submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Wysyłanie...";

  // Fallback: jeśli Supabase nie jest jeszcze skonfigurowany (TODO powyżej),
  // nie blokujemy formularza — informujemy w konsoli i pokazujemy komunikat.
  if (!supabaseClient) {
    console.warn("Supabase nie jest skonfigurowany — zgłoszenie NIE zostało zapisane.", payload);
    statusEl.style.color = "#ff8a8a";
    statusEl.textContent = "Formularz nie jest jeszcze podłączony do bazy danych. Skontaktuj się z nami bezpośrednio: info@vivysgroup.pl";
    submitBtn.disabled = false;
    submitBtn.textContent = "Wyślij zgłoszenie";
    return;
  }

  try {
    const { error } = await supabaseClient.from("leads").insert([
      {
        property_id: null,
        lead_type: "landing_signup",
        name: payload.name,
        phone: payload.phone,
        slot: null,
        language: "pl",
        consent_marketing: payload.consent_marketing,
        // Uwaga: jeśli w tabeli "leads" nie ma kolumn email/address/message,
        // usuń poniższe trzy linie albo dodaj te kolumny w Supabase.
        email: payload.email || null,
        address: payload.address || null,
        message: payload.message || null,
        landing_variant: payload.landing_variant,
      },
    ]);

    if (error) throw error;

    form.reset();
    statusEl.style.color = "#8fffb0";
    statusEl.textContent = "Dziękujemy! Odezwiemy się najszybciej, jak to możliwe.";
  } catch (err) {
    console.error("Insert error:", err);
    statusEl.style.color = "#ff8a8a";
    statusEl.textContent = "Coś poszło nie tak. Spróbuj ponownie lub napisz na info@vivysgroup.pl";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Wyślij zgłoszenie";
  }
});

// Przyciski "Włącz dźwięk" na filmach z autoplay-loop
document.querySelectorAll(".sound-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const video = document.getElementById(btn.dataset.target);
    if (!video) return;
    const turningOn = video.muted;
    // Wycisz wszystkie pozostałe filmy, żeby nie grały jednocześnie
    document.querySelectorAll("video").forEach((v) => {
      if (v !== video) {
        v.muted = true;
        const b = document.querySelector(`.sound-btn[data-target="${v.id}"]`);
        if (b) { b.classList.remove("is-on"); b.textContent = "🔇 Włącz dźwięk"; }
      }
    });
    video.muted = !turningOn;
    if (turningOn) {
      video.currentTime = 0;
      video.play();
      btn.classList.add("is-on");
      btn.textContent = "🔊 Dźwięk włączony";
    } else {
      btn.classList.remove("is-on");
      btn.textContent = "🔇 Włącz dźwięk";
    }
  });
});

// Nav: subtelne tło po scrollu
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  if (window.scrollY > 40) {
    nav.style.background = "rgba(11,14,23,.85)";
  } else {
    nav.style.background = "rgba(11,14,23,.55)";
  }
});
