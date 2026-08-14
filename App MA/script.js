// Pencarian aplikasi
const searchInput = document.getElementById('appSearch');
const groups = document.querySelectorAll('[data-group]');
const emptyState = document.getElementById('emptyState');

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  let anyVisible = false;

  groups.forEach((group) => {
    const tiles = group.querySelectorAll('.app-tile');
    let groupHasMatch = false;

    tiles.forEach((tile) => {
      const name = tile.dataset.name.toLowerCase();
      const match = name.includes(query);
      tile.style.display = match ? '' : 'none';
      if (match) groupHasMatch = true;
    });

    group.style.display = groupHasMatch ? '' : 'none';
    if (groupHasMatch) anyVisible = true;
  });

  emptyState.hidden = anyVisible;
});

// Klik tile aplikasi -> toast "segera hadir" (placeholder sebelum aplikasi dibangun)
const toast = document.getElementById('toast');
let toastTimer;

document.querySelectorAll('.app-tile').forEach((tile) => {
  tile.addEventListener('click', (e) => {
    const href = tile.getAttribute('href');
    if (href && href !== '#') return; // aplikasi sudah tersedia, biarkan navigasi berjalan
    e.preventDefault();
    const name = tile.dataset.name;
    toast.innerHTML = `<strong>${name}</strong> — aplikasi ini sedang dalam pengembangan.`;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  });
});

// Tombol launcher (ikon grid) -> scroll ke atas apps grid
document.getElementById('launcherBtn').addEventListener('click', () => {
  document.querySelector('.apps-wrap').scrollIntoView({ behavior: 'smooth' });
});
