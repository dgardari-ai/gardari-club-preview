const eventList = document.querySelector(".event-list");
const eventRows = [...eventList.querySelectorAll(".event-row")];
const navigation = performance.getEntriesByType('navigation')[0];
const savedId = navigation?.type === 'back_forward' ? history.state?.openClubEvent : undefined;
const savedEvent = eventRows.find(row => '#' + row.id === location.hash)
  || eventRows.find(row => row.id === savedId);

if (savedEvent || savedId === null) {
  eventRows.forEach(row => { row.open = row === savedEvent; });
}

function saveEventSelection() {
  const openClubEvent = eventRows.find(row => row.open)?.id ?? null;
  if (history.state?.openClubEvent !== openClubEvent) {
    history.replaceState({ ...history.state, openClubEvent }, "");
  }
}

saveEventSelection();

for (const row of eventRows) {
  row.querySelector('summary').append(clubOutline('line'));
  const toggle = clubOutline('line');
  const vertical = toggle.firstElementChild.cloneNode();
  vertical.setAttribute('x1', '50%');
  vertical.setAttribute('x2', '50%');
  vertical.setAttribute('y1', '0');
  vertical.setAttribute('y2', '100%');
  toggle.append(vertical);
  row.querySelector('.event-plus').replaceChildren(toggle);
  const moreOutline = clubOutline();
  moreOutline.classList.add('event-more-outline');
  row.querySelector('.event-more')?.append(moreOutline);

  row.addEventListener("toggle", () => {
    if (row.open) {
      eventRows.forEach(other => { if (other !== row) other.open = false; });
    }
    saveEventSelection();
  });
}

eventList.addEventListener('click', event => {
  const row = event.target.closest('.event-row[open]');
  if (!row || event.target.closest('summary, a') || window.getSelection()?.isCollapsed === false) return;
  const containedFocus = row.contains(document.activeElement);
  row.open = false;
  if (containedFocus) row.querySelector('summary').focus({ preventScroll: true });
});
