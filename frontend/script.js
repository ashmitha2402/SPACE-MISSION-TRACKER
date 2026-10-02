const missions = [
  { name: 'Artemis II', agency: 'NASA', destination: 'Lunar flyby', launchDate: '2026-11-01', launchLabel: 'Nov 2026', status: 'upcoming', symbol: 'A2', followed: true },
  { name: 'Europa Clipper', agency: 'NASA', destination: 'Jupiter system', launchDate: '2024-10-14', launchLabel: 'Oct 2024', status: 'active', symbol: 'EC', followed: false },
  { name: 'JUICE', agency: 'ESA', destination: 'Jupiter system', launchDate: '2023-04-14', launchLabel: 'Apr 2023', status: 'active', symbol: 'J', followed: false },
  { name: 'OSIRIS-REx', agency: 'NASA', destination: 'Asteroid Bennu', launchDate: '2016-09-08', launchLabel: 'Sep 2016', status: 'completed', symbol: 'OR', followed: false }
];

const missionList = document.querySelector('#mission-list');
const searchInput = document.querySelector('#mission-search');
const emptyState = document.querySelector('#empty-state');
const filterButtons = document.querySelectorAll('.filter-button');
const loadingScreen = document.querySelector('#loading-screen');
let selectedFilter = 'all';

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getVisibleMissions() {
  const searchText = searchInput.value.trim().toLowerCase();
  return missions.filter((mission) => {
    const matchesStatus = selectedFilter === 'all' || mission.status === selectedFilter;
    const searchableText = `${mission.name} ${mission.agency} ${mission.destination}`.toLowerCase();
    return matchesStatus && searchableText.includes(searchText);
  });
}

function renderMissions() {
  const visibleMissions = getVisibleMissions();
  missionList.innerHTML = visibleMissions.map((mission) => `
    <article class="mission-row">
      <div class="mission-name-wrap">
        <span class="mission-symbol" aria-hidden="true">${mission.symbol}</span>
        <div><div class="mission-name">${mission.name}</div><div class="mission-agency">${mission.agency}</div></div>
      </div>
      <div class="row-destination"><span class="mission-detail-label">DESTINATION</span><span class="mission-detail">${mission.destination}</span></div>
      <div class="row-launch"><span class="mission-detail-label">LAUNCH</span><span class="mission-detail">${mission.launchLabel}</span></div>
      <div class="row-status"><span class="mission-detail-label">STATUS</span><span class="status-pill status-${mission.status}">${formatStatus(mission.status)}</span></div>
      <button class="follow-button${mission.followed ? ' is-following' : ''}" type="button" data-mission="${mission.name}" aria-pressed="${mission.followed}" aria-label="${mission.followed ? 'Unfollow' : 'Follow'} ${mission.name}">${mission.followed ? '★' : '☆'}</button>
    </article>
  `).join('');

  emptyState.hidden = visibleMissions.length > 0;
  document.querySelector('#total-count').textContent = String(missions.length).padStart(2, '0');
  document.querySelector('#active-count').textContent = String(missions.filter((mission) => mission.status === 'active').length).padStart(2, '0');
  document.querySelector('#upcoming-count').textContent = String(missions.filter((mission) => mission.status === 'upcoming').length).padStart(2, '0');
  document.querySelector('#following-count').textContent = String(missions.filter((mission) => mission.followed).length).padStart(2, '0');
  document.querySelector('#all-filter-count').textContent = String(missions.length);
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const isSelected = filterButton === button;
      filterButton.classList.toggle('is-active', isSelected);
      filterButton.setAttribute('aria-pressed', String(isSelected));
    });
    renderMissions();
  });
});

searchInput.addEventListener('input', renderMissions);

missionList.addEventListener('click', (event) => {
  const followButton = event.target.closest('.follow-button');
  if (!followButton) return;
  const mission = missions.find((item) => item.name === followButton.dataset.mission);
  if (!mission) return;
  mission.followed = !mission.followed;
  renderMissions();
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
});

document.querySelector('#today-date').textContent = new Intl.DateTimeFormat('en', {
  month: 'short', day: 'numeric', year: 'numeric'
}).format(new Date()).toUpperCase();

renderMissions();

window.setTimeout(() => {
  loadingScreen.classList.add('is-fading');
  loadingScreen.setAttribute('aria-hidden', 'true');

  window.setTimeout(() => {
    loadingScreen.hidden = true;
  }, 800);
}, 2000);