/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    Jamelia Freeman - Finance and Reporting
    search.js: searches students by ID or name (with grade and status filters) and shows one student's
    profile, financial statement, transactions and grades. Everything on this page is read-only.
    Needs finance-common.js to be loaded first.
*/

//collect the search controls and output elements
const studentSearchForm = document.getElementById("studentSearchForm");
const studentIdInput = document.getElementById("search-input");
const searchGradeFilter = document.getElementById("searchGradeFilter");
const searchStatusFilter = document.getElementById("searchStatusFilter");
const searchResultsBody = document.getElementById("searchResults");
const studentProfile = document.getElementById("studentProfile");
const studentDetails = document.getElementById("studentDetails");
const transactionTableBody = document.getElementById("tranHistory");
const gradesTableBody = document.getElementById("gradesBody");
const searchMessage = document.getElementById("searchMessage");
const printStatementButton = document.getElementById("printStatement");

//grey silhouette shown when a student has no saved photo
const NO_PHOTO_AVATAR = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
  '<rect width="120" height="120" fill="#e2e8f0"/>' +
  '<circle cx="60" cy="46" r="22" fill="#94a3b8"/>' +
  '<path d="M18 112c4-24 22-36 42-36s38 12 42 36z" fill="#94a3b8"/></svg>'
);

//show one line of text inside a table body (used for "no results" style messages)
function setTableMessage(tableBody, columnCount, message) {
  tableBody.textContent = "";
  const row = tableBody.insertRow();
  const cell = row.insertCell();
  cell.colSpan = columnCount;
  cell.textContent = message;
}

//hide the profile, transactions and grades until a student is chosen
function clearStudentDetails() {
  studentProfile.hidden = true;
  studentDetails.hidden = true;
  transactionTableBody.textContent = "";
  gradesTableBody.textContent = "";
}

//put text into a profile card element (a dash is shown when the student has no value saved)
function setCardText(elementId, value) {
  document.getElementById(elementId).textContent = value === "" || value == null ? "-" : String(value);
}

//fill the profile card, financial statement, transaction table and grades table for one student
function showStudentDetails(student) {
  const transactions = loadList(historyStorageKey);
  const summary = buildStudentSummary(student, transactions, getTodayText());

  //this student's own saved photo (grey placeholder when none was uploaded)
  const photo = document.getElementById("studentProfilePhoto");
  photo.src = student.avatar || NO_PHOTO_AVATAR;
  photo.alt = `Photo of ${student.fname} ${student.lname}`.trim();

  //personal details (field names are matched by normalizeStudent in finance-common.js)
  setCardText("studentProfileId", student.stuId);
  setCardText("studentProfileFirstName", student.fname);
  setCardText("studentProfileLastName", student.lname);
  setCardText("cardAddress", student.address);
  setCardText("cardEmail", student.email);
  setCardText("cardDOB", student.dob);
  setCardText("cardGrade", student.grade);
  setCardText("cardPrevSchool", student.prevSchool);
  setCardText("cardPGName", student.parentName);
  setCardText("cardPGContact", student.parentContact);

  //financial statement
  setCardText("cardTuition", summary.tuitionAmt.toFixed(2));
  setCardText("cardPaid", summary.amtPaid.toFixed(2));
  setCardText("cardDue", summary.amtDue.toFixed(2));
  const statusCell = document.getElementById("cardStatus");
  statusCell.textContent = "";
  statusCell.appendChild(createStatusBadge(summary.status));

  studentProfile.hidden = false;
  studentDetails.hidden = false;

  //transactions made by this student
  transactionTableBody.textContent = "";
  const matchingTransactions = transactions.filter((transaction) =>
    String(transaction.stuId).trim().toLowerCase() === student.stuId.toLowerCase()
  );

  matchingTransactions.forEach((transaction) => {
    const row = transactionTableBody.insertRow();
    [
      transaction.stuId,
      transaction.tranNum,
      transaction.tranAmt,
      transaction.tranDate,
      transaction.tranType,
    ].forEach((value) => {
      row.insertCell().textContent = value == null ? "" : String(value);
    });
  });

  if (matchingTransactions.length === 0) {
    setTableMessage(transactionTableBody, 5, "No transactions found for this student.");
  }

  //grades saved by the teacher pages (sp_grades uses studentId, subjectCode, semester, assessment, score and maxScore)
  gradesTableBody.textContent = "";
  const studentGrades = loadList(gradesStorageKey).filter((grade) =>
    grade && String(grade.studentId).trim().toLowerCase() === student.stuId.toLowerCase()
  );

  studentGrades.forEach((grade) => {
    const row = gradesTableBody.insertRow();
    [
      typeof getSchoolSubjectName === "function" ? getSchoolSubjectName(grade.subjectCode) : grade.subjectCode,
      grade.semester,
      grade.assessment,
      grade.score + " / " + grade.maxScore,
    ].forEach((value) => {
      row.insertCell().textContent = value == null ? "" : String(value);
    });
  });

  //grades entered on the Academic Matrix page (saved as { semester: { studentId: { subject: grade } } })
  let matrixGrades = {};
  try {
    matrixGrades = JSON.parse(localStorage.getItem("titchfieldAcademicMatrixGrades")) || {};
  } catch (error) {
    console.error("Could not load Academic Matrix grades", error);
  }
  //older saves had no semester level ({ studentId: { subject: "A" } }); the matrix page moves them into the active semester
  const isOldMatrixFormat = Object.values(matrixGrades).some((value) =>
    value && typeof value === "object" && Object.values(value).some((grade) => typeof grade === "string")
  );
  if (isOldMatrixFormat) {
    matrixGrades = { [typeof getActiveSemester === "function" ? getActiveSemester() : "-"]: matrixGrades };
  }

  const matrixEntries = [];
  Object.entries(matrixGrades).forEach(([semester, semesterGrades]) => {
    if (!semesterGrades || typeof semesterGrades !== "object") return;
    const matrixKey = Object.keys(semesterGrades).find((id) =>
      id.trim().toLowerCase() === student.stuId.toLowerCase()
    );
    Object.entries((matrixKey && semesterGrades[matrixKey]) || {}).forEach(([subject, value]) => {
      if (String(value ?? "").trim() !== "") matrixEntries.push([subject, semester, value]);
    });
  });

  matrixEntries.forEach(([subject, semester, value]) => {
    const row = gradesTableBody.insertRow();
    [subject, semester, "Academic Matrix", value].forEach((cellValue) => {
      row.insertCell().textContent = String(cellValue);
    });
  });

  if (studentGrades.length === 0 && matrixEntries.length === 0) {
    setTableMessage(gradesTableBody, 4, "No grades have been recorded for this student.");
  }

  searchMessage.textContent =
    `${matchingTransactions.length} transaction${matchingTransactions.length === 1 ? "" : "s"} found for ${student.stuId}.`;
}

//search students by id or name and apply the grade and status filters
function searchStudents(event) {
  event.preventDefault();
  clearStudentDetails();

  const query = studentIdInput.value.trim().toLowerCase();
  const gradeValue = searchGradeFilter.value;
  const statusValue = searchStatusFilter.value;

  //the search box is optional: an empty box matches every student, so only the filters apply
  const students = loadStudents();
  if (students.length === 0) {
    setTableMessage(searchResultsBody, 6, "No student records could be loaded from this browser.");
    searchMessage.textContent = "No student records could be loaded from this browser.";
    return;
  }

  const transactions = loadList(historyStorageKey);
  const todayText = getTodayText();

  //keep students whose id or name contains the search text and who match both filters
  const matches = students
    .map((student) => ({ student, summary: buildStudentSummary(student, transactions, todayText) }))
    .filter(({ student, summary }) => {
      const searchable = `${student.stuId} ${student.fname} ${student.lname}`.toLowerCase();
      return searchable.includes(query) &&
        (gradeValue === "all" || student.grade === gradeValue) &&
        (statusValue === "all" || summary.status === statusValue);
    });

  searchResultsBody.textContent = "";

  matches.forEach(({ student, summary }) => {
    const row = searchResultsBody.insertRow();
    [
      student.stuId,
      `${student.fname} ${student.lname}`.trim(),
      student.grade,
      summary.amtDue.toFixed(2),
    ].forEach((value) => { row.insertCell().textContent = value; });
    row.insertCell().appendChild(createStatusBadge(summary.status));

    //each row gets a button that opens that student's full details
    const actionCell = row.insertCell();
    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "view-student";
    viewButton.dataset.stuId = student.stuId;
    viewButton.textContent = "View";
    actionCell.appendChild(viewButton);
  });

  if (matches.length === 0) {
    setTableMessage(searchResultsBody, 6, "No students match your search. Try a different ID or name.");
    searchMessage.textContent = "No students match your search.";
    return;
  }

  searchMessage.textContent = `${matches.length} student${matches.length === 1 ? "" : "s"} found.`;

  //open the details straight away when only one student matches
  if (matches.length === 1) {
    showStudentDetails(matches[0].student);
  }
}

//open a student's details when their View button is clicked
searchResultsBody.addEventListener("click", (event) => {
  const viewButton = event.target.closest(".view-student");
  if (!viewButton) return;

  const student = loadStudents().find((s) => s.stuId === viewButton.dataset.stuId);
  if (student) {
    showStudentDetails(student);
    studentProfile.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

//open the browser's print window so the statement can be printed or saved as a pdf
if (printStatementButton) {
  printStatementButton.addEventListener("click", () => window.print());
}

studentSearchForm.addEventListener("submit", searchStudents);
