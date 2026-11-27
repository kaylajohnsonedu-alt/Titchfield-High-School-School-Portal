/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    Jamelia Freeman - Finance and Reporting
    reports.js: filters students by grade and status and shows totals, a status bar chart and a printable table.
    Needs finance-common.js to be loaded first.
*/

//collect report controls and output elements
const gradeFilter = document.getElementById("gradeFilter");
const statusFilter = document.getElementById("statusFilter");
const reportBody = document.getElementById("report-entries");
const printButton = document.getElementById("printReport");
const reportPrintFilters = document.getElementById("reportPrintFilters");

//every status the report can show, and the card that displays its count
const REPORT_STATUSES = {
  "Paid": "rePaidCount",
  "Pending": "rePendingCount",
  "Outstanding": "reOutstandingCount",
};

function getReportRows() {
  //calculate tuition, payments, balances and status for each student
  const students = loadStudents();
  const transactions = loadList(historyStorageKey);
  const todayText = getTodayText();

  return students.map((student) => {
    const summary = buildStudentSummary(student, transactions, todayText);
    return { student, summary };
  });
}

//keep only the rows that match the grade filter
function filterByGrade(allRows) {
  return allRows.filter(({ student }) =>
    gradeFilter.value === "all" || student.grade === gradeFilter.value
  );
}

//keep only the rows that match the status filter
function filterByStatus(gradeRows) {
  return gradeRows.filter(({ summary }) =>
    statusFilter.value === "all" || summary.status === statusFilter.value
  );
}

function renderStudentRecords() {
  //filter student rows and update the report table
  reportBody.textContent = "";
  const visibleRows = filterByStatus(filterByGrade(getReportRows()));

  //show how many students match the current grade and status filters
  document.getElementById("reShownCount").textContent = visibleRows.length;

  visibleRows.forEach(({ student, summary }) => {
    const row = reportBody.insertRow();
    [
      student.stuId,
      student.fname,
      student.lname,
      student.grade,
      summary.tuitionAmt.toFixed(2),
      summary.amtPaid.toFixed(2),
      summary.amtDue.toFixed(2),
    ].forEach((value) => { row.insertCell().textContent = value; });
    row.insertCell().appendChild(createStatusBadge(summary.status)); //coloured status badge
  });

  if (visibleRows.length === 0) {
    const row = reportBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 8;
    cell.textContent = "No students found.";
  }
}

function generateReports() {
  //count each status for the selected grade and show it in the status cards with its share of the grade
  const gradeRows = filterByGrade(getReportRows());
  const statusCounts = { "Paid": 0, "Pending": 0, "Outstanding": 0 };

  gradeRows.forEach(({ summary }) => { statusCounts[summary.status]++; });

  Object.entries(REPORT_STATUSES).forEach(([status, cardId]) => {
    const count = statusCounts[status];
    const percent = gradeRows.length === 0 ? 0 : Math.round((count / gradeRows.length) * 100);
    document.getElementById(cardId).textContent = `${count} (${percent}%)`;
  });

  reportPrintFilters.textContent =
    `Filters: Grade: ${gradeFilter.options[gradeFilter.selectedIndex].text}; Status: ${statusFilter.options[statusFilter.selectedIndex].text}`;
}

function updateReports() {
  renderStudentRecords();
  generateReports();
}

//refresh report details whenever a filter changes
gradeFilter.addEventListener("change", updateReports);
statusFilter.addEventListener("change", updateReports);

//open the browser's print window so the report can be printed or saved as a pdf
if (printButton) {
  printButton.addEventListener("click", () => window.print());
}

updateReports();
