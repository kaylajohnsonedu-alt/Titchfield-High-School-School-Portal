/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    By Jamelia Freeman
    viewer.js: the Read-Only Viewer. Shows every student's grade, enrollment semester, balance and status,
    filtered by ID/name, grade and status. Nothing here can be added, changed or deleted.
    Needs finance-common.js to be loaded first.
*/

//collect the viewer controls and output elements
const viewerFilterForm = document.getElementById("viewerFilterForm");
const viewerSearch = document.getElementById("viewerSearch");
const viewerGradeFilter = document.getElementById("viewerGradeFilter");
const viewerStatusFilter = document.getElementById("viewerStatusFilter");
const viewerEntries = document.getElementById("viewerEntries");
const viewerMessage = document.getElementById("viewerMessage");
const printDirectoryButton = document.getElementById("printDirectory");

//every status the viewer counts, and the card that displays its count
const VIEWER_STATUS_CARDS = {
  "Paid": "viewPaidCount",
  "Pending": "viewPendingCount",
  "Outstanding": "viewOutstandingCount",
};

//calculate tuition, payments, balance and status for each student
function getViewerRows() {
  const students = loadStudents();
  const transactions = loadList(historyStorageKey);
  const todayText = getTodayText();

  return students.map((student) => ({
    student,
    summary: buildStudentSummary(student, transactions, todayText),
  }));
}

//true when the student's id or name contains the search text
function matchesViewerSearch(student, query) {
  const searchable = `${student.stuId} ${student.fname} ${student.lname}`.toLowerCase();
  return searchable.includes(query);
}

//keep only the rows that match the search box, grade filter and status filter
function filterViewerRows(allRows) {
  const query = viewerSearch.value.trim().toLowerCase();
  const gradeValue = viewerGradeFilter.value;
  const statusValue = viewerStatusFilter.value;

  return allRows.filter(({ student, summary }) =>
    matchesViewerSearch(student, query) &&
    (gradeValue === "all" || student.grade === gradeValue) &&
    (statusValue === "all" || summary.status === statusValue)
  );
}

//show the total number of students and how many have each status
function updateViewerCards(allRows) {
  const statusCounts = { "Paid": 0, "Pending": 0, "Outstanding": 0 };
  allRows.forEach(({ summary }) => { statusCounts[summary.status]++; });

  document.getElementById("viewStudentCount").textContent = allRows.length;
  Object.entries(VIEWER_STATUS_CARDS).forEach(([status, cardId]) => {
    document.getElementById(cardId).textContent = statusCounts[status];
  });
}

//draw the matching students as plain text cells (no inputs or buttons, so the records stay read-only)
function renderViewer() {
  const allRows = getViewerRows();
  const visibleRows = filterViewerRows(allRows);
  viewerEntries.textContent = "";

  updateViewerCards(allRows);

  visibleRows.forEach(({ student, summary }) => {
    const row = viewerEntries.insertRow();
    [
      student.stuId,
      `${student.fname} ${student.lname}`.trim(),
      student.grade ? "Grade " + student.grade : "-",
      student.semester || "-",
      summary.tuitionAmt.toFixed(2),
      summary.amtPaid.toFixed(2),
      summary.amtDue.toFixed(2),
    ].forEach((value) => { row.insertCell().textContent = value; });
    row.insertCell().appendChild(createStatusBadge(summary.status)); //coloured status badge
  });

  //show a friendly message when nothing matches
  if (allRows.length === 0) {
    const row = viewerEntries.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 8;
    cell.textContent = "No students have been registered yet.";
    viewerMessage.textContent = "No student records could be found.";
    return;
  }

  if (visibleRows.length === 0) {
    const row = viewerEntries.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 8;
    cell.textContent = "No students match your search.";
  }

  viewerMessage.textContent =
    `Showing ${visibleRows.length} of ${allRows.length} student${allRows.length === 1 ? "" : "s"}.`;
}

//refresh the directory whenever the search text or a filter changes
viewerSearch.addEventListener("input", renderViewer);
viewerGradeFilter.addEventListener("change", renderViewer);
viewerStatusFilter.addEventListener("change", renderViewer);
viewerFilterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderViewer();
});

//open the browser's print window so the directory can be printed or saved as a pdf
if (printDirectoryButton) {
  printDirectoryButton.addEventListener("click", () => window.print());
}

renderViewer();
