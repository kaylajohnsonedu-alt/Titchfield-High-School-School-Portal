/*
 * Members: 1. Mario Creary - 2504252 - Friday 12pm - 2pm
 *          2. Nathan Mannings - 2501919 - Friday 12pm - 2pm
 *          3. Kayla Johnson - 2409453 - Friday 12pm - 2pm
 *          4. Damani Williams - 2007591 - Friday 12pm - 2pm
 *          5. Jamelia Freeman - 2407243 - Friday 12pm - 2pm
 * 
 *          By Mario Creary
 */

// Storage keys shared by the whole team.
const KEY_USERS = "sp_users";
const KEY_TEACHERS = "sp_teachers";
//students and subjects come from school-data.js (shared with Register, Profile and Academic Matrix)
const KEY_GRADES = "sp_grades";

const TOTAL_STEPS = 3;
// The active semester chosen by the administrator on the Academic Matrix page (from school-data.js)
const SEMESTER = getActiveSemester();

// Remember the teacher's choices as they move through the steps.
let currentStep = 1;
let selectedSubjectCode = "";
let selectedGradeLevel = "";


// This function reads and decodes a value from localStorage (returns fallback if missing/broken).
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Could not read " + key, error);
    return fallback;
  }
}

// This function encodes and saves a value to localStorage. Returns true if it worked.
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Could not save " + key, error);
    return false;
  }
}

// This function shows a message; adds the "success" class for green, removes it for red.
function setMessage(elementId, text, isSuccess) {
  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }
  element.textContent = text;
  if (isSuccess) {
    element.classList.add("success");
  } else {
    element.classList.remove("success");
  }
}

// Compares two ids as text, because ids may be stored as numbers or strings.
function sameId(a, b) {
  return String(a) === String(b);
}

// Returns the students in the currently selected grade level.
function getClassStudents() {
  return getSchoolStudents().filter(s => s.gradeLevel === selectedGradeLevel);
}

// Clears report-card content when the selected subject or class changes.
function clearReport() {
  document.getElementById("reportCardContainer").textContent = "";
  document.getElementById("reportStudentSelect").value = "";
}

// Runs once when the page loads: checks login, fills the first dropdown, connects buttons.
function initTeacherPage() {
  // checkTeacher() comes from login.js and redirects if not logged in as a teacher.
  checkTeacher();
  if (localStorage.getItem("role") !== "teacher") {
    return;
  }

  fillSubjectDropdown();

  const subjectSelect = document.getElementById("subjectSelect");
  const gradeSelect = document.getElementById("gradeSelect");
  const reportStudentSelect = document.getElementById("reportStudentSelect");

  subjectSelect.addEventListener("change", (e) => {
    selectedSubjectCode = e.target.value;
    selectedGradeLevel = "";
    setMessage("step1Message", "", false);

    // A new subject invalidates everything chosen after it.
    document.getElementById("classList").textContent = "";
    clearReport();
    fillFormDropdown();
  });

  gradeSelect.addEventListener("change", (e) => {
    selectedGradeLevel = e.target.value;
    setMessage("step2Message", "", false);
    clearReport();
    loadClassList();
    fillReportStudentDropdown();
  });


  reportStudentSelect.addEventListener("change", (e) => {
    if (e.target.value === "all") {
      showAllReportCards();
    } else if (e.target.value) {
      showReportCard(e.target.value);
    } else {
      document.getElementById("reportCardContainer").textContent = "";
    }
  });

  document.getElementById("nextButton").addEventListener("click", () => {
    if (validateCurrentStep() && currentStep < TOTAL_STEPS) {
      showStep(currentStep + 1);
    }
  });

  document.getElementById("backButton").addEventListener("click", () => {
    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  });


  document.getElementById("logoutButton")?.addEventListener("click", logout);

  showStep(1);
}

// Checks that the teacher has made a choice before moving to the next step.
function validateCurrentStep() {
  if (currentStep === 1 && !selectedSubjectCode) {
    setMessage("step1Message", "Please select a subject to proceed.", false);
    return false;
  }
  if (currentStep === 2 && !selectedGradeLevel) {
    setMessage("step2Message", "Please select a grade level to proceed.", false);
    return false;
  }
  return true;
}

// Shows one step panel, hides the others and updates the progress list.
function showStep(stepNumber) {
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const panel = document.getElementById("step" + i);
    const progressItem = document.getElementById("progress" + i);

    if (i === stepNumber) {
      panel.classList.remove("hidden");
      progressItem.classList.add("active");
    } else {
      panel.classList.add("hidden");
      progressItem.classList.remove("active");
    }
  }

  currentStep = stepNumber;
  document.getElementById("progressText").textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;

  document.getElementById("backButton").style.display = currentStep === 1 ? "none" : "inline-block";
  document.getElementById("nextButton").style.display = currentStep === TOTAL_STEPS ? "none" : "inline-block";

  if (currentStep === TOTAL_STEPS) {
    updateClassStats();
  }
}


// Fills the subject dropdown with every subject offered by the school.
function fillSubjectDropdown() {
  const subjects = getSchoolSubjects();
  const subjectSelect = document.getElementById("subjectSelect");

  subjectSelect.innerHTML = '<option value="">-- Select one of the subjects --</option>';
  subjects.forEach(subject => {
    const option = document.createElement("option");
    option.value = subject.code;
    option.textContent = subject.name;
    subjectSelect.appendChild(option);
  });
}

// Fills the grade-level dropdown with each grade level once.
function fillFormDropdown() {
  const gradeLevels = getSchoolGradeLevels();

  const gradeSelect = document.getElementById("gradeSelect");
  gradeSelect.innerHTML = '<option value="">-- Select Grade Level --</option>';
  gradeLevels.forEach(level => {
    const option = document.createElement("option");
    option.value = level;
    option.textContent = level;
    gradeSelect.appendChild(option);
  });
}

// Lists the students in the selected grade level.
function loadClassList() {
  const classStudents = getClassStudents();
  const classListUl = document.getElementById("classList");
  classListUl.textContent = "";

  if (classStudents.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No students found in this class.";
    classListUl.appendChild(li);
    return;
  }

  classStudents.forEach(student => {
    const li = document.createElement("li");
    li.textContent = `${student.firstName} ${student.lastName} (ID: ${student.id})`;
    classListUl.appendChild(li);
  });
}

// The teacher then fills the Step 4 student dropdown for the selected class.
function fillReportStudentDropdown() {
  const reportStudentSelect = document.getElementById("reportStudentSelect");
  reportStudentSelect.innerHTML = '<option value="">-- Select a student --</option>';

  getClassStudents().forEach(student => {
    const option = document.createElement("option");
    option.value = student.id;
    option.textContent = `${student.firstName} ${student.lastName} (${student.id})`;
    reportStudentSelect.appendChild(option);
  });
}

// This groups one student's grade records by subject code.
function groupBySubject(studentGrades) {
  const groups = {};
  studentGrades.forEach(g => {
    if (!groups[g.subjectCode]) {
      groups[g.subjectCode] = [];
    }
    groups[g.subjectCode].push(g);
  });
  return groups;
}

// This function then updates the class average, highest, lowest and pass rate for the chosen subject.
function updateClassStats() {
  const grades = loadData(KEY_GRADES, []);
  const totals = [];

  getClassStudents().forEach(student => {
    const records = grades.filter(g =>
      sameId(g.studentId, student.id) &&
      g.subjectCode === selectedSubjectCode &&
      g.semester === SEMESTER
    );
    if (records.length > 0) {
      const result = calculateWeighted(records);
      if (result.isComplete) totals.push(result.total);
    }
  });

  const stats = getClassStats(totals);
  document.getElementById("classAverage").textContent = stats.average.toFixed(1) + "%";
  document.getElementById("classHighest").textContent = stats.highest.toFixed(1) + "%";
  document.getElementById("classLowest").textContent = stats.lowest.toFixed(1) + "%";
  document.getElementById("classPassRate").textContent = stats.passRate.toFixed(0) + "%";
}

// This function builds a report card showing assessment scores and the final result for each subject.
function showReportCard(studentId, containerOverride) {
  const container = containerOverride || document.getElementById("reportCardContainer");
  const student = getSchoolStudents().find(s => sameId(s.id, studentId));
  if (!student) {
    container.textContent = "Student not found.";
    return;
  }

  const studentGrades = loadData(KEY_GRADES, []).filter(g =>
    sameId(g.studentId, studentId) && g.semester === SEMESTER
  );
  const subjects = getSchoolSubjects();
  const groups = groupBySubject(studentGrades);
  const box = document.createElement("section");
  box.className = "report-card-box";
  const heading = document.createElement("h3");
  heading.textContent = `Report Card: ${student.firstName} ${student.lastName} (${student.id})`;
  const info = document.createElement("p");
  info.textContent = `Grade Level: ${student.gradeLevel} | Semester: ${SEMESTER}`;
  box.append(heading, info);

  // Every school subject is listed, followed by any graded subject codes not in the subject list
  const subjectCodes = subjects.map(s => s.code);
  Object.keys(groups).forEach(code => {
    if (!subjectCodes.includes(code)) subjectCodes.push(code);
  });

  const finalTotals = [];
  subjectCodes.forEach(code => {
    const subject = subjects.find(s => s.code === code);
    const records = groups[code] || [];
    const title = document.createElement("h4");
    title.textContent = subject ? subject.name : code;
    box.appendChild(title);

    if (records.length === 0) {
      const noGrades = document.createElement("p");
      noGrades.textContent = "No grades entered yet.";
      box.appendChild(noGrades);
      return;
    }

    const result = calculateWeighted(records);

    const table = document.createElement("table");
    table.className = "report-table";
    table.innerHTML = `<thead><tr><th>Assessment</th><th>Score</th><th>Weighted Contribution</th></tr></thead><tbody></tbody>`;
    const tbody = table.querySelector("tbody");
    records.forEach(record => {
      const tr = document.createElement("tr");
      const weight = ASSESSMENT_WEIGHTS[record.assessment] || 0;
      const contribution = record.maxScore > 0 ? (record.score / record.maxScore) * weight : 0;
      [record.assessment, `${record.score} / ${record.maxScore}`, `${contribution.toFixed(1)}%`].forEach(value => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    box.appendChild(table);

    const final = document.createElement("p");
    if (result.isComplete) {
      final.textContent = `Final Grade: ${result.total.toFixed(1)}% (${getLetterGrade(result.total)})`;
      finalTotals.push(result.total);
    } else {
      final.textContent = `Final Grade: In progress (${result.weightEntered}% of assessment weight entered)`;
    }
    box.appendChild(final);
  });

  const average = document.createElement("p");
  average.textContent = finalTotals.length
    ? `Overall Average (completed subjects): ${calculateAverage(finalTotals).toFixed(1)}%`
    : "Overall Average: available once a subject is complete.";
  box.appendChild(average);
  container.appendChild(box);
}

// DThis function them displays a report card for every student in the selected form.
function showAllReportCards() {
  const container = document.getElementById("reportCardContainer");
  container.textContent = "";
  const students = getClassStudents();
  if (students.length === 0) {
    container.textContent = "No students found in this class.";
    return;
  }
  students.forEach(student => showReportCard(student.id, container));
}

document.addEventListener("DOMContentLoaded", initTeacherPage);
