const eventList = document.querySelector(".event-list");
const eventRows = [...eventList.querySelectorAll(".event-row")];
const savedEvent = eventRows.find(row => '#' + row.id === location.hash)
  || eventRows.find(row => row.id === history.state?.openClubEvent);

if (savedEvent) {
  eventRows.forEach(row => { row.open = row === savedEvent; });
}

for (const row of eventRows) {
  const summary = row.querySelector("summary");
  summary.append(clubOutline("line"));
  summary.addEventListener("click", event => {
    // The vertical slider always has a current entry.
    if (row.open) event.preventDefault();
  });

  row.addEventListener("toggle", () => {
    if (!row.open) return;
    eventRows.forEach(other => {
      if (other !== row) other.open = false;
    });
    history.replaceState({ ...history.state, openClubEvent: row.id }, "");
  });
}
