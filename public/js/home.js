document.getElementById("lyrics-button")?.addEventListener("click", () => {
  window.location.href = "/go";
});

document.getElementById("login-button")?.addEventListener("click", () => {
  window.location.href = "/login";
});

document.getElementById("logout-button")?.addEventListener("click", () => {
  window.location.href = "/logout";
});

document.getElementById("refresh-button")?.addEventListener("click", () => {
  window.location.href = "/refresh_token";
});
