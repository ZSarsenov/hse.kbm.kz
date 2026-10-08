// Скролл-контейнер приложения — <main> в Layout: корень страницы
// h-screen overflow-hidden, поэтому window.scrollTo — тихий no-op,
// из-за чего при переключении страниц таблицы не возвращались к началу.
export function scrollToAppTop() {
  const main = document.querySelector('main');
  if (main) {
    // main в Layout имеет класс scroll-smooth — скролл будет плавным
    main.scrollTo({ top: 0 });
  } else {
    window.scrollTo({ top: 0 });
  }
}
