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
      const name = (tile.dataset.name || tile.querySelector('.app-name')?.textContent || '').toLowerCase();
      const match = name.includes(query);
      tile.style.display = match ? '' : 'none';
      if (match) groupHasMatch = true;
    });

    group.style.display = groupHasMatch ? '' : 'none';
    if (groupHasMatch) anyVisible = true;
  });

  emptyState.hidden = anyVisible;
});

// Tile yang belum tersedia menampilkan notifikasi tanpa berpindah halaman.
const toast = document.getElementById('toast');
let toastTimer;

document.querySelectorAll('.app-tile.is-placeholder').forEach((tile) => {
  tile.addEventListener('click', (e) => {
    e.preventDefault();
    const name = tile.querySelector('.app-name')?.textContent.trim() || tile.dataset.name;
    toast.innerHTML = `<strong>${name}</strong> — modul sedang disiapkan.`;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  });
});

// Tombol launcher -> kembali ke area aplikasi.
document.getElementById('launcherBtn').addEventListener('click', () => {
  document.querySelector('.apps-wrap').scrollIntoView({ behavior: 'smooth' });
});
