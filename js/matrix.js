/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    Nathan Mannings - Academic Matrix
    matrix.js: a grade grid for the active semester. Administrators unlock a row with the edit button,
    enter letter grades (A to F) and save them; teachers can only view the grid.
    Needs school-data.js (semesters) and login.js (page security) to be loaded first.
*/

const STUDENT_STORAGE_KEY = 'titchfieldStudents';
const GRADE_STORAGE_KEY = 'titchfieldAcademicMatrixGrades';

const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Computer Science'
];

//how many students are shown on one page of the grid
const PAGE_SIZE = 10;
//the same letter grades the report card uses (see getLetterGrade in grades.js)
const LETTER_GRADE_PATTERN = '[A-Fa-f]';

const gridBody = document.getElementById('gradeGridBody');
const recordCountEl = document.getElementById('recordCount');
const saveBtn = document.getElementById('saveGrades');
const semesterSelect = document.getElementById('semester');
const activeSemesterNote = document.getElementById('activeSemesterNote');
const pagination = document.getElementById('matrixPagination');
const dashboardHeading = document.getElementById('dashboardHeading');

//only an administrator may change grades; teachers see the same grid read-only
const isAdmin = localStorage.getItem('role') === 'administrator';

let selectedSemester = '';
let currentPage = 1;
let draftGrades = {};   //grades for the selected semester, including changes that are not saved yet
let hasUnsavedChanges = false;

function getStudents() {
  try {
    const students = JSON.parse(localStorage.getItem(STUDENT_STORAGE_KEY));
    return Array.isArray(students) ? students : [];
  } catch (error) {
    console.error('Could not load students', error);
    return [];
  }
}

//all saved grades, grouped by semester: { "Autumn 2026": { studentId: { subject: "A" } } }
function getSavedGrades() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(GRADE_STORAGE_KEY)) || {};
  } catch (error) {
    console.error('Could not load grades', error);
    return {};
  }

  //older saves were { studentId: { subject: grade } } with no semester; move them into the active semester
  const isOldFormat = Object.values(saved).some((value) =>
    value && typeof value === 'object' && SUBJECTS.some((subject) => subject in value)
  );
  if (isOldFormat) {
    saved = { [getActiveSemester()]: saved };
    localStorage.setItem(GRADE_STORAGE_KEY, JSON.stringify(saved));
  }
  return saved;
}

function formatFullName(student) {
  return `${student.fname || ''} ${student.mname ? student.mname + ' ' : ''}${student.lname || ''}`.trim();
}

//make a fresh copy of the selected semester's saved grades to edit
function loadDraftGrades() {
  const semesterGrades = getSavedGrades()[selectedSemester] || {};
  draftGrades = JSON.parse(JSON.stringify(semesterGrades));
  hasUnsavedChanges = false;
}

//show which semester is active and which one is on screen
function updateSemesterNote() {
  if (!activeSemesterNote) return;
  const active = getActiveSemester();
  activeSemesterNote.textContent = selectedSemester === active
    ? `Showing grades for the active semester (${active}).`
    : `Showing grades for ${selectedSemester}. The active semester is ${active}.`;
}

//create one grade box for a student and subject
function createGradeInput(studentId, subject) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'grade-input';
  input.dataset.subject = subject;
  input.dataset.optional = 'true'; //a blank grade means "not graded yet"
  input.value = (draftGrades[studentId] && draftGrades[studentId][subject]) || '';
  input.placeholder = '—';
  input.maxLength = 1;
  input.pattern = LETTER_GRADE_PATTERN;
  input.title = 'Enter a letter grade from A to F, or leave it blank.';
  input.readOnly = true; //unlocked by the row's edit button
  input.setAttribute('aria-label', `${subject} grade for student ${studentId}`);

  //keep valid changes in the draft so they survive changing pages
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase();
    if (!input.checkValidity()) return;
    draftGrades[studentId] = draftGrades[studentId] || {};
    draftGrades[studentId][subject] = input.value.trim();
    hasUnsavedChanges = true;
  });
  return input;
}

//unlock one row so its grades can be changed
function unlockRow(row) {
  row.classList.add('row-editing');
  row.querySelectorAll('.grade-input').forEach((input) => { input.readOnly = false; });
  const firstInput = row.querySelector('.grade-input');
  if (firstInput) firstInput.focus();
}

//draw the students on the current page
function renderMatrix() {
  const students = getStudents();
  gridBody.textContent = '';

  if (students.length === 0) {
    const row = gridBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = SUBJECTS.length + 3;
    cell.textContent = 'No registered students found. Please register a student first.';
    recordCountEl.textContent = 'Showing 0 of 0 students';
    renderPagination(0);
    return;
  }

  const pageCount = Math.ceil(students.length / PAGE_SIZE);
  currentPage = Math.min(Math.max(currentPage, 1), pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageStudents = students.slice(start, start + PAGE_SIZE);

  pageStudents.forEach((student) => {
    const studentId = String(student.id);
    const row = gridBody.insertRow();
    row.dataset.studentId = studentId;

    row.insertCell().textContent = studentId;
    row.insertCell().textContent = formatFullName(student);

    SUBJECTS.forEach((subject) => {
      row.insertCell().appendChild(createGradeInput(studentId, subject));
    });

    const actionCell = row.insertCell();
    actionCell.className = 'col-action';
    if (isAdmin) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'edit-btn';
      editButton.textContent = '✎';
      editButton.title = 'Edit this student\'s grades';
      editButton.setAttribute('aria-label', `Edit grades for ${formatFullName(student)}`);
      editButton.addEventListener('click', () => unlockRow(row));
      actionCell.appendChild(editButton);
    } else {
      actionCell.textContent = 'View only';
    }
  });

  recordCountEl.textContent =
    `Showing ${start + 1}-${start + pageStudents.length} of ${students.length} students`;
  renderPagination(pageCount);
}

//make sure the grades on screen are valid before leaving the page or saving
function currentPageIsValid() {
  const invalidGrade = gridBody.querySelector('.grade-input:invalid');
  if (invalidGrade) {
    invalidGrade.reportValidity();
    return false;
  }
  return true;
}

function goToPage(page) {
  if (!currentPageIsValid()) return;
  currentPage = page;
  renderMatrix();
}

//draw Previous, one button per page, and Next
function renderPagination(pageCount) {
  pagination.textContent = '';
  if (pageCount <= 1) return;

  const addButton = (label, page, disabled, active) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'page-btn' + (active ? ' active' : '');
    button.textContent = label;
    button.disabled = disabled;
    if (active) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => goToPage(page));
    pagination.appendChild(button);
  };

  addButton('Previous', currentPage - 1, currentPage === 1, false);
  for (let page = 1; page <= pageCount; page++) {
    addButton(String(page), page, false, page === currentPage);
  }
  addButton('Next', currentPage + 1, currentPage === pageCount, false);
}

//save the draft grades for the selected semester
function saveGrades() {
  if (!isAdmin) return;
  if (!currentPageIsValid()) return;

  const savedGrades = getSavedGrades();
  savedGrades[selectedSemester] = draftGrades;

  try {
    localStorage.setItem(GRADE_STORAGE_KEY, JSON.stringify(savedGrades));
  } catch (error) {
    console.error('Could not save grades', error);
    alert('Grades could not be saved. Browser storage may be full.');
    return;
  }

  hasUnsavedChanges = false;
  renderMatrix(); //locks every row again
  alert(`Grades saved for ${selectedSemester}!`);
}

//switch the grid to another semester; an administrator's choice also becomes the active semester
function changeSemester() {
  if (hasUnsavedChanges && !confirm('You have unsaved grade changes. Switch semester and lose them?')) {
    semesterSelect.value = selectedSemester;
    return;
  }

  selectedSemester = semesterSelect.value;
  if (isAdmin) setActiveSemester(selectedSemester);
  currentPage = 1;
  loadDraftGrades();
  updateSemesterNote();
  renderMatrix();
}

function initMatrixPage() {
  fillSemesterSelect(semesterSelect, getActiveSemester());
  selectedSemester = semesterSelect.value;
  semesterSelect.addEventListener('change', changeSemester);

  if (isAdmin) {
    saveBtn.addEventListener('click', saveGrades);
  } else {
    //teachers view the grid only
    saveBtn.hidden = true;
    if (dashboardHeading) dashboardHeading.textContent = 'Student Grade Dashboard';
  }

  //warn before leaving the page with unsaved grade changes
  window.addEventListener('beforeunload', (event) => {
    if (hasUnsavedChanges) event.preventDefault();
  });

  loadDraftGrades();
  updateSemesterNote();
  renderMatrix();
}

initMatrixPage();
