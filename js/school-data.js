/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    By Nathan Mannings

    school-data.js:one shared place for the teacher pages (teacher.html, grade.html) and the
    Query Wizard to read students and subjects, so they all see the same records as the
    Register, Student Profile and Academic Matrix pages. It also keeps the active semester.

    Load this file !BEFORE! teacher.js, grade-entry.js, search.js, matrix.js, form.js, edit.js or profile.js
*/

//every semester the school uses (the Academic Matrix "Semester Year" list and the registry use the same list)
const SCHOOL_SEMESTERS = [
    "Autumn 2024", "Spring 2025", "Summer 2025",
    "Autumn 2025", "Spring 2026", "Summer 2026", "Autumn 2026"
];
//the semester chosen on the Academic Matrix page (id="semester") is saved here as the active semester
const ACTIVE_SEMESTER_KEY = "activeSemester";
//used until an administrator chooses an active semester
const DEFAULT_ACTIVE_SEMESTER = "Autumn 2026";

//return the active semester (the default one when none has been chosen or the saved one is unknown)
function getActiveSemester() {
    const saved = localStorage.getItem(ACTIVE_SEMESTER_KEY);
    return SCHOOL_SEMESTERS.includes(saved) ? saved : DEFAULT_ACTIVE_SEMESTER;
}

//save a new active semester (ignored if it is not one of the school's semesters)
function setActiveSemester(semester) {
    if (SCHOOL_SEMESTERS.includes(semester)) {
        localStorage.setItem(ACTIVE_SEMESTER_KEY, semester);
    }
}

//fill a <select> with every semester and select one of them
function fillSemesterSelect(select, selectedSemester) {
    if (!select) return;
    select.textContent = "";
    SCHOOL_SEMESTERS.forEach(semester => {
        const option = document.createElement("option");
        option.value = semester;
        option.textContent = semester;
        select.appendChild(option);
    });
    select.value = SCHOOL_SEMESTERS.includes(selectedSemester) ? selectedSemester : getActiveSemester();
}

//students saved by the Register / Edit pages (the main student list for the whole site)
const SCHOOL_STUDENT_KEY = "titchfieldStudents";
//older/sample student lists that may also exist in this browser
const SCHOOL_EXTRA_STUDENT_KEYS = ["titchfieldStudent", "sp_students"];
//optional custom subject list; when it is missing the default subjects below are used
const SCHOOL_SUBJECTS_KEY = "sp_subjects";

//same subjects as the Academic Matrix page, so grades line up across the site
const DEFAULT_SCHOOL_SUBJECTS = [
    { code: "MATH", name: "Mathematics" },
    { code: "SCI", name: "Science" },
    { code: "ENG", name: "English" },
    { code: "HIST", name: "History" },
    { code: "CS", name: "Computer Science" }
];

function readSchoolList(key) {
    try {
        const saved = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(saved)) return saved;
        if (saved && Array.isArray(saved.students)) return saved.students;
        return saved && typeof saved === "object" ? [saved] : [];
    } catch (error) {
        console.error("Could not read " + key, error);
        return [];
    }
}

//turn 9, "9", "Grade 9" or "Form 9" into "Grade 9" (blank when there is no number)
function toGradeLevel(value) {
    const match = String(value ?? "").match(/\d+/);
    return match ? "Grade " + Number(match[0]) : "";
}

//every student as { id, firstName, lastName, gradeLevel }, registered students first, no duplicate ids
function getSchoolStudents() {
    const seen = new Set();
    const students = [];

    [SCHOOL_STUDENT_KEY, ...SCHOOL_EXTRA_STUDENT_KEYS].forEach(key => {
        readSchoolList(key).forEach(record => {
            if (!record || typeof record !== "object") return;
            const id = String(record.id ?? record.stuId ?? record.studentId ?? "").trim();
            if (!id || seen.has(id)) return;
            seen.add(id);
            students.push({
                id: id,
                firstName: String(record.firstName ?? record.fname ?? "").trim(),
                lastName: String(record.lastName ?? record.lname ?? "").trim(),
                gradeLevel: toGradeLevel(record.grade ?? record.gradelvl ?? record.gradeLevel ?? record.formLevel)
            });
        });
    });

    return students;
}

//the same Grade Level options as the Student Registry form (register.html / edit.html)
const SCHOOL_GRADE_LEVELS = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Grade 13"];

function getSchoolGradeLevels() {
    return SCHOOL_GRADE_LEVELS.slice();
}

function getSchoolSubjects() {
    const saved = readSchoolList(SCHOOL_SUBJECTS_KEY).filter(s => s && s.code && s.name);
    return saved.length > 0 ? saved : DEFAULT_SCHOOL_SUBJECTS;
}

//show "Mathematics" instead of "MATH" (falls back to the code itself)
function getSchoolSubjectName(code) {
    const subject = getSchoolSubjects().find(s => s.code === code);
    return subject ? subject.name : String(code ?? "");
}
