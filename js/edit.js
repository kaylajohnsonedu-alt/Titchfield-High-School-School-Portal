/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    Nathan Mannings - Student Registry
    edit.js:loads one student into the edit form, validates the changes and saves them.
    Needs school-data.js and student-id.js to be loaded first.
*/
const STORAGE_KEY = 'titchfieldStudents';

const form = document.getElementById('edit-registration-form');
const avatarInput = document.getElementById('avatar');
const fnameInput = document.getElementById('fname');
const mnameInput = document.getElementById('Mname');
const lnameInput = document.getElementById('lname');
const addressInput = document.getElementById('adress');
const emailInput = document.getElementById('emailL');
const dobInput = document.getElementById('DOB');
const gradeInput = document.getElementById('gradelvl');
const semesterInput = document.getElementById('enrollSemester');
const prevSchoolInput = document.getElementById('PrevSchool');
const pgFnameInput = document.getElementById('PGname');
const pgLnameInput = document.getElementById('PGlname');
const pgContactInput = document.getElementById('PGcontact');
const validateDob = attachStudentDobValidation(dobInput);

const params = new URLSearchParams(window.location.search);
const editId = params.get('edit') || params.get('id');

let existingAvatar = '';
let avatarDataUrl = '';

function getStudents() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveStudents(students) {
    return trySaveStudents(STORAGE_KEY, students);
}

//teachers can view profiles but not edit them
if (localStorage.getItem('role') === 'teacher') {
    window.location.replace('profile.html');
}

function showAvatarPreview(src) {
    const previewWrap = document.getElementById('avatar-preview-wrap');
    const preview = document.getElementById('avatar-preview');
    if (!previewWrap || !preview) return;

    previewWrap.style.display = src ? 'block' : 'none';
    preview.src = src || '';
}

function populateForEdit(student) {
    if (!student) return;

    fnameInput.value = student.fname || '';
    mnameInput.value = student.mname || '';
    lnameInput.value = student.lname || '';
    addressInput.value = student.address || '';
    emailInput.value = student.email || '';
    dobInput.value = student.dob || '';
    gradeInput.value = student.grade || '';
    //students saved before semesters were added start on the active semester
    fillSemesterSelect(semesterInput, student.semester || getActiveSemester());
    prevSchoolInput.value = student.prevSchool || '';
    pgContactInput.value = student.pgContact || '';

    // Split stored pgName back into first/last name if needed
    const pgParts = (student.pgName || '').trim().split(/\s+/).filter(Boolean);
    pgFnameInput.value = pgParts[0] || '';
    pgLnameInput.value = pgParts.slice(1).join(' ') || '';

    existingAvatar = student.avatar || '';
    avatarInput.dataset.optional = existingAvatar ? 'true' : 'false';
    avatarInput.required = !existingAvatar;
    showAvatarPreview(existingAvatar);

    const heading = document.querySelector('h1');
    if (heading) heading.textContent = 'Edit Registration Information';

    const submitBtn = form?.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Save Changes';
}

if (form) {
    const studentToEdit = editId
        ? getStudents().find(s => String(s.id) === String(editId))
        : null;
    if (studentToEdit) {
        populateForEdit(studentToEdit);

        //Reset Fields puts back the values that are currently saved for this student
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            const savedStudent = getStudents().find(s => String(s.id) === String(editId));
            avatarInput.value = '';
            avatarDataUrl = '';
            avatarInput.setCustomValidity('');
            document.getElementById('confirm').checked = false;
            populateForEdit(savedStudent || studentToEdit);
        });
    } else {
        window.location.replace('profile.html');
    }
}

avatarInput?.addEventListener('change', async () => {
    const file = avatarInput.files && avatarInput.files[0];
    if (!file) {
        avatarDataUrl = '';
        avatarInput.setCustomValidity('');
        showAvatarPreview(existingAvatar);
        refreshFieldValidation(avatarInput, true);
        return;
    }

    if (!isValidStudentAvatar(file)) {
        avatarInput.setCustomValidity('Student image must be a JPEG or PNG and 500KB or smaller.');
        avatarDataUrl = '';
        refreshFieldValidation(avatarInput, true);
        return;
    }

    avatarInput.setCustomValidity('');
    try {
        avatarDataUrl = await prepareStudentAvatar(file);
        showAvatarPreview(avatarDataUrl);
    } catch {
        avatarInput.setCustomValidity('Failed to read the selected image.');
        avatarDataUrl = '';
    }
    refreshFieldValidation(avatarInput, true);
});

form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editId) {
        window.location.replace('profile.html');
        return;
    }
    validateDob();
    if (!form.reportValidity()) return;

    const file = avatarInput?.files && avatarInput.files[0];
    if (file) {
        if (!isValidStudentAvatar(file)) {
            avatarInput.setCustomValidity('Student image must be a JPEG or PNG and 500KB or smaller.');
            refreshFieldValidation(avatarInput, true);
            avatarInput.reportValidity();
            return;
        }
        if (!avatarDataUrl) {
            try {
                avatarDataUrl = await prepareStudentAvatar(file);
            } catch {
                avatarInput.setCustomValidity('Failed to read the selected image.');
                refreshFieldValidation(avatarInput, true);
                return;
            }
        }
    }

    const students = getStudents();
    const index = students.findIndex(s => String(s.id) === String(editId));
    if (index === -1) {
        alert('Student record could not be found. Select a student and try again.');
        window.location.replace('profile.html');
        return;
    }

    const pgFullName = `${pgFnameInput.value.trim()} ${pgLnameInput.value.trim()}`.trim();
    const finalAvatar = avatarDataUrl || existingAvatar || '';
    const updatedStudent = {
        id: students[index].id,
        fname: fnameInput.value.trim(),
        mname: mnameInput.value.trim(),
        lname: lnameInput.value.trim(),
        address: addressInput.value.trim(),
        email: emailInput.value.trim(),
        dob: dobInput.value,
        grade: gradeInput.value,
        semester: semesterInput.value, //grade + semester = the student's cohort
        prevSchool: prevSchoolInput.value.trim(),
        pgName: pgFullName,
        pgContact: pgContactInput.value.trim(),
        avatar: finalAvatar
    };

    students[index] = updatedStudent;
    if (!saveStudents(students)) return;
    window.location.href = `profile.html?id=${encodeURIComponent(updatedStudent.id)}`;
});