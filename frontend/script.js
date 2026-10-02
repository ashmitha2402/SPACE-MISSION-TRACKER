let missions = [];

const missionList = document.querySelector('#mission-list');
const searchInput = document.querySelector('#mission-search');
const emptyState = document.querySelector('#empty-state');
const filterButtons = document.querySelectorAll('.filter-button');
const loadingScreen = document.querySelector('#loading-screen');

let selectedFilter = 'all';

function formatStatus(status) {
  if (status === 'In transit') return 'In Transit';
  return status;
}

function getStatusClass(status) {
  if (status === 'Active' || status === 'In transit') {
    return 'active';
  }

  if (status === 'Completed') {
    return 'completed';
  }

  return 'upcoming';
}

function getVisibleMissions() {
  const searchText = searchInput.value.trim().toLowerCase();

  return missions.filter((mission) => {
    const statusClass = getStatusClass(mission.status);

    const matchesStatus =
      selectedFilter === 'all' ||
      statusClass === selectedFilter;

    const searchableText =
      `${mission.name} ${mission.agency} ${mission.destination}`.toLowerCase();

    return matchesStatus && searchableText.includes(searchText);
  });
}

function renderMissions() {
  const visibleMissions = getVisibleMissions();

  missionList.innerHTML = visibleMissions.map((mission) => {
    const statusClass = getStatusClass(mission.status);
    const symbol = mission.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const launchDate = new Date(mission.launchDate);

    const launchLabel = new Intl.DateTimeFormat('en', {
      month: 'short',
      year: 'numeric'
    }).format(launchDate);

    return `
      <article class="mission-row">
        <div class="mission-name-wrap">
          <span class="mission-symbol" aria-hidden="true">${symbol}</span>

          <div>
            <div class="mission-name">${mission.name}</div>
            <div class="mission-agency">${mission.agency}</div>
          </div>
        </div>

        <div class="row-destination">
          <span class="mission-detail-label">DESTINATION</span>
          <span class="mission-detail">${mission.destination}</span>
        </div>

        <div class="row-launch">
          <span class="mission-detail-label">LAUNCH</span>
          <span class="mission-detail">${launchLabel}</span>
        </div>

        <div class="row-status">
          <span class="mission-detail-label">STATUS</span>
          <span class="status-pill status-${statusClass}">
            ${formatStatus(mission.status)}
          </span>
        </div>

        <button
          class="follow-button${mission.followed ? ' is-following' : ''}"
          type="button"
          data-mission="${mission.id}"
          aria-pressed="${mission.followed}"
          aria-label="${mission.followed ? 'Unfollow' : 'Follow'} ${mission.name}"
        >
          ${mission.followed ? '★' : '☆'}
        </button>
      </article>
    `;
  }).join('');

  emptyState.hidden = visibleMissions.length > 0;

  document.querySelector('#total-count').textContent =
    String(missions.length).padStart(2, '0');

  document.querySelector('#active-count').textContent =
    String(
      missions.filter(
        (mission) =>
          mission.status === 'Active' ||
          mission.status === 'In transit'
      ).length
    ).padStart(2, '0');

  document.querySelector('#upcoming-count').textContent =
    String(
      missions.filter(
        (mission) => mission.status === 'upcoming'
      ).length
    ).padStart(2, '0');

  document.querySelector('#following-count').textContent =
    String(
      missions.filter((mission) => mission.followed).length
    ).padStart(2, '0');

  document.querySelector('#all-filter-count').textContent =
    String(missions.length);
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedFilter = button.dataset.filter;

    filterButtons.forEach((filterButton) => {
      const isSelected = filterButton === button;

      filterButton.classList.toggle('is-active', isSelected);
      filterButton.setAttribute(
        'aria-pressed',
        String(isSelected)
      );
    });

    renderMissions();
  });
});

searchInput.addEventListener('input', renderMissions);

missionList.addEventListener('click', (event) => {
  const followButton = event.target.closest('.follow-button');

  if (!followButton) return;

  const mission = missions.find(
    (item) => item.id === followButton.dataset.mission
  );

  if (!mission) return;

  mission.followed = !mission.followed;

  renderMissions();
});

document.addEventListener('keydown', (event) => {
  if (
    event.key === '/' &&
    document.activeElement !== searchInput
  ) {
    event.preventDefault();
    searchInput.focus();
  }
});

document.querySelector('#today-date').textContent =
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
    .format(new Date())
    .toUpperCase();

async function loadMissions() {
  try {
    const response = await fetch(
      'http://localhost:3000/api/missions'
    );

    if (!response.ok) {
      throw new Error('Failed to load missions');
    }

    missions = await response.json();

    missions = missions.map((mission) => ({
      ...mission,
      followed: false
    }));

    renderMissions();

  } catch (error) {
    console.error('Could not load missions:', error);

    missionList.innerHTML = `
      <p style="padding: 20px;">
        Unable to load missions from the API.
      </p>
    `;
  } finally {
    window.setTimeout(() => {
      loadingScreen.classList.add('is-fading');
      loadingScreen.setAttribute('aria-hidden', 'true');

      window.setTimeout(() => {
        loadingScreen.hidden = true;
      }, 800);
    }, 500);
  }
}

loadMissions();