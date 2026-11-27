/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    Nathan Mannings - Student Profile
    profile.js: shows one card per enrolled student, filtered by name/ID and by enrollment semester (cohort).
    Administrators may edit or delete a student; teachers may only view.
    Needs finance-common.js (roles and storage keys) and school-data.js (semesters) to be loaded first.
*/
const STORAGE_KEY = 'titchfieldStudents';
const MATRIX_GRADES_KEY = 'titchfieldAcademicMatrixGrades';
const container = document.getElementById('cards-container');
const templateCard = document.querySelector('.profile-card'); // Your existing card element
const selectedId = new URLSearchParams(window.location.search).get('id');
//getCurrentRole() comes from finance-common.js (loaded before this file)
const isAdmin = getCurrentRole() === 'administrator';
const NO_IMAGE_AVATAR = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
    '<rect width="120" height="120" fill="#e2e8f0"/>' +
    '<circle cx="60" cy="46" r="22" fill="#94a3b8"/>' +
    '<path d="M18 112c4-24 22-36 42-36s38 12 42 36z" fill="#94a3b8"/></svg>'
);
//value of the semester filter option that shows every student
const ALL_SEMESTERS = 'all';

function getStudents() {
    try {
        const students = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(students) ? students : [];
    } catch (error) {
        console.error('Could not load students', error);
        return [];
    }
}

function saveStudents(students) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

//remove every grade and transaction that belongs to a deleted student, so no orphaned records are left
function deleteStudentRecords(id) {
    const sameStudent = (value) => String(value).trim().toLowerCase() === String(id).trim().toLowerCase();

    //grades saved by the teacher pages
    saveList(gradesStorageKey, loadList(gradesStorageKey).filter(grade => !sameStudent(grade.studentId)));

    //payments saved by the Financial Ledger
    saveList(historyStorageKey, loadList(historyStorageKey).filter(transaction => !sameStudent(transaction.stuId)));

    //letter grades saved on the Academic Matrix page ({ semester: { studentId: {...} } })
    try {
        const matrixGrades = JSON.parse(localStorage.getItem(MATRIX_GRADES_KEY)) || {};
        //older saves had no semester level ({ studentId: {...} }), so remove a top-level match too
        Object.keys(matrixGrades).forEach(key => {
            if (sameStudent(key)) delete matrixGrades[key];
        });
        Object.values(matrixGrades).forEach(semesterGrades => {
            if (semesterGrades && typeof semesterGrades === 'object') {
                Object.keys(semesterGrades).forEach(studentId => {
                    if (sameStudent(studentId)) delete semesterGrades[studentId];
                });
            }
        });
        localStorage.setItem(MATRIX_GRADES_KEY, JSON.stringify(matrixGrades));
    } catch (error) {
        console.error('Could not update Academic Matrix grades', error);
    }
}

//delete a student (administrators only, after confirming)
function deleteStudent(student) {
    if (!isAdmin) return;

    const fullName = `${student.fname} ${student.lname}`.trim();
    if (!confirm(`Delete ${fullName} (${student.id})? Their grades and payments will also be deleted.`)) {
        return;
    }

    const updated = getStudents().filter(s => String(s.id) !== String(student.id));
    saveStudents(updated);
    deleteStudentRecords(student.id);
    renderProfiles();
}

function populateCard(cardEl, student){
    cardEl.style.display = '';
    cardEl.classList.toggle('active-profile', String(student.id) === selectedId);

    const fullName = `${student.fname} ${student.mname ? student.mname + ' ' : ''}${student.lname}`.trim();

    const setText = (id, value) =>{
        const el = cardEl.querySelector(`#${id}`);
        if (el) el.textContent = value;
    };

    setText('cardStudentId', student.id);
    setText('cardFullName', fullName);
    setText('cardAddress', student.address);
    setText('cardEmail', student.email);
    setText('cardDOB', student.dob);
    setText('cardGrade', student.grade);
    setText('cardSemester', student.semester || 'Not set');
    setText('cardPrevSchool', student.prevSchool || 'None specified');
    setText('cardPGName', student.pgName);
    setText('cardPGContact', student.pgContact);

    const avatarEl = cardEl.querySelector('#cardAvatar');
    if (avatarEl){
        avatarEl.src = student.avatar || NO_IMAGE_AVATAR;
        avatarEl.alt =fullName;
    }

    const editLink = cardEl.querySelector('.edit-profile-link');
    if (editLink) {
        if (isAdmin){
            editLink.href = `edit.html?id=${encodeURIComponent(student.id)}`;
        } else {
            //teachers can view profiles but not edit them
            editLink.parentElement.remove();
        }
    }

    // Remove duplicate IDs from cloned cards so IDs stay unique in the DOM
    cardEl.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));

    // Only an administrator gets a Delete button
    if (isAdmin && !cardEl.querySelector('.card-actions')){
        const actions = document.createElement('div');
        actions.className = 'card-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.type ='button';
        deleteBtn.className= 'delete-transaction';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteStudent(student));

        actions.append(deleteBtn);
        cardEl.appendChild(actions);
    }
}

const searchForm= document.getElementById('profileSearchForm');
const searchInput = document.getElementById('profileSearch');
const semesterFilter = document.getElementById('profileSemesterFilter');
const searchMessage = document.getElementById('profileSearchMessage');

//semester filter:"All semesters" first, then every semester (starts on All so no student is hidden)
if (semesterFilter){
    fillSemesterSelect(semesterFilter, getActiveSemester());
    const allOption = document.createElement('option');
    allOption.value = ALL_SEMESTERS;
    allOption.textContent = 'All semesters';
    semesterFilter.prepend(allOption);
    semesterFilter.value = ALL_SEMESTERS;
}

//true when the student's ID or any part of their name contains the search text
function matchesSearch(student, query) {
    if (!query) return true;
    const searchable = [
        student.id,
        student.fname,
        student.mname,
        student.lname,
        `${student.fname || ''} ${student.lname || ''}`,
        `${student.fname || ''} ${student.mname || ''} ${student.lname || ''}`.replace(/\s+/g, ' ')
    ].join(' | ').toLowerCase();
    return searchable.includes(query);
}

//true when the student was enrolled in the chosen semester (or every semester is chosen)
function matchesSemester(student, semester) {
    return semester === ALL_SEMESTERS || student.semester === semester;
}

function renderProfiles() {
    const students = getStudents();

    // Clear previously rendered clones while keeping the hidden template
    container.querySelectorAll('.profile-card:not(.card-template)').forEach(el => el.remove());

    if (students.length === 0) {
        if (isAdmin) {
            alert('No student registration data found! Please fill out the form first.');
            window.location.href = 'register.html';
        } else if (searchMessage) {
            //teachers cannot register students, so just explain that the list is empty
            searchMessage.textContent = 'No students have been registered yet.';
        }
        return;
    }

    const query = (searchInput?.value || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const semester = semesterFilter ? semesterFilter.value : ALL_SEMESTERS;
    const visible = students.filter(student =>
        matchesSearch(student, query) && matchesSemester(student, semester)
    );
    const isFiltered = query !== '' || semester !== ALL_SEMESTERS;

    if (searchMessage) {
        searchMessage.textContent = !isFiltered
            ? `${students.length} student${students.length === 1 ? '' : 's'} enrolled.`
            : visible.length === 0
                ? 'No students match your search. Try a different name, ID number or semester.'
                : `${visible.length} student${visible.length === 1 ? '' : 's'} found.`;
    }

    visible.forEach(student => {
        const clone = templateCard.cloneNode(true);
        clone.classList.remove('card-template');
        populateCard(clone, student);
        container.appendChild(clone);
    });
}


if (templateCard) {
    templateCard.classList.add('card-template');
    templateCard.style.display = 'none';
}

//filter as the user types or changes semester, and also when Search is pressed
searchInput?.addEventListener('input', renderProfiles);
semesterFilter?.addEventListener('change', renderProfiles);
searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    renderProfiles();
});

renderProfiles();
