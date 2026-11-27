/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    Nathan Mannings - Student Registry
    form.js: validates the registration form and saves the new student in localStorage.
    Needs school-data.js and student-id.js to be loaded first.
*/
const STORAGE_KEY = 'titchfieldStudents';
const form = document.getElementById('registration-form');
const avatarInput = document.getElementById('avatar');

const students = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const dobInput = document.getElementById('DOB');
const validateDob = attachStudentDobValidation(dobInput);

//the enrollment semester starts on the active semester chosen on the Academic Matrix page
const semesterInput = document.getElementById('enrollSemester');
fillSemesterSelect(semesterInput, getActiveSemester());

avatarInput.addEventListener('change', () => {
    const file = avatarInput.files && avatarInput.files[0];
    avatarInput.setCustomValidity(
        file && !isValidStudentAvatar(file)
            ? 'Student image must be a JPEG or PNG and 500KB or smaller.'
            : ''
    );
    refreshFieldValidation(avatarInput, true);
});

form.addEventListener('submit', async function (e) {
    e.preventDefault();
    validateDob();
    if (!form.reportValidity()) return;

    const selectedFile = avatarInput.files && avatarInput.files[0];

    if (selectedFile && !isValidStudentAvatar(selectedFile)) {
        avatarInput.setCustomValidity('Student image must be a JPEG or PNG and 500KB or smaller.');
        refreshFieldValidation(avatarInput, true);
        avatarInput.reportValidity();
        return;
    }

    let imgSrc = DEFAULT_STUDENT_AVATAR;
    if (selectedFile) {
        try {
            imgSrc = await prepareStudentAvatar(selectedFile);
        } catch {
            avatarInput.setCustomValidity('Failed to read the selected image.');
            refreshFieldValidation(avatarInput, true);
            avatarInput.reportValidity();
            return;
        }
    }
    saveStudent(imgSrc);

    function saveStudent(imgSrc) {
        const studentRecord = {
            id: generateStudentId(students),
            fname: document.getElementById('fname').value.trim(),
            mname: document.getElementById('Mname').value.trim(),
            lname: document.getElementById('lname').value.trim(),
            address: document.getElementById('adress').value.trim(),
            email: document.getElementById('emailL').value.trim(),
            dob: document.getElementById('DOB').value,
            grade: document.getElementById('gradelvl').value,
            semester: semesterInput.value, //grade + semester = the student's cohort
            prevSchool: document.getElementById('PrevSchool').value.trim(),
            pgName: `${document.getElementById('PGname').value.trim()} ${document.getElementById('PGlname').value.trim()}`.trim(),
            pgContact: document.getElementById('PGcontact').value.trim(),
            avatar: imgSrc
        };

        students.push(studentRecord);

        if (!trySaveStudents(STORAGE_KEY, students)) {
            students.pop();
            return;
        }
        window.location.href = `profile.html?id=${studentRecord.id}`;
    }
});