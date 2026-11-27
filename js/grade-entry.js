/*
 * Members: 1. Mario Creary - 2504252 - Friday 12pm - 2pm
 *          2. Nathan Mannings - 2501919 - Friday 12pm - 2pm
 *          3. Kayla Johnson - 2409453 - Friday 12pm - 2pm
 *          4. Damani Williams - 2007591 - Friday 12pm - 2pm
 *          5. Jamelia Freeman - 2407243 - Friday 12pm - 2pm
 * 
 *          By Mario Creary
 */

// This is for the grade entry page where it uses the same localStorage keys and grade record fields as teacher.js.

// Constants for localStorage keys and semester
const KEY_USERS = "sp_users";
const KEY_TEACHERS = "sp_teachers";
//students and subjects come from school-data.js (shared with Register, Profile and Academic Matrix)
const KEY_GRADES = "sp_grades";
// The active semester chosen by the administrator on the Academic Matrix page (from school-data.js)
const SEMESTER = getActiveSemester();

// The variables track the selected subject, grade level, and assessment
let selectedSubjectCode = "";
let selectedGradeLevel = "";
let selectedAssessment = "";

// This function checks if the user is a teacher and redirects to the login page if not
function loadData(key, fallback) {
    try {
        const savedData = localStorage.getItem(key);
        return savedData === null ? fallback : JSON.parse(savedData);
    } catch (error) {
        console.error("Could not read " + key, error);
        return fallback;
    }
}

// This function saves data to localStorage and returns true if successful, false otherwise
function saveData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Could not save " + key, error);
        return false;
    }
}

function sameId(a, b) {
    return String(a) === String(b);
}

// This function is set up to display messages to the user about the grade entry process, indicating success or failure
function setGradeMessage(message, success) {
    const element = document.getElementById("gradeMessage");
    element.textContent = message;
    if (success) {
        element.classList.add("success");
    } else {
        element.classList.remove("success");
    }
}

function getClassStudents() {
    return getSchoolStudents().filter(student => student.gradeLevel === selectedGradeLevel);
}

function fillSubjectDropdown() {
    const username = localStorage.getItem("username");
    const users = loadData(KEY_USERS, []);
    const teachers = loadData(KEY_TEACHERS, []);
    const subjects = getSchoolSubjects();
    const currentUser = users.find(user => user.username === username);
    let currentTeacher = null;

    if (currentUser) {
        currentTeacher = teachers.find(teacher => teacher.teacherId === currentUser.teacherId);
    }

    let teacherSubjects = subjects;
    if (currentTeacher && Array.isArray(currentTeacher.subjects)) {
        teacherSubjects = subjects.filter(subject => currentTeacher.subjects.includes(subject.code));
    }

    const select = document.getElementById("subjectSelect");
    teacherSubjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject.code;
        option.textContent = subject.name;
        select.appendChild(option);
    });
}

// This function populates the grade level dropdown based on the same Grade Level options as the Student Registry (register.html).
function fillFormDropdown() {
    const select = document.getElementById("gradeSelect");
    select.innerHTML = '<option value="">-- Select Grade Level --</option>';
    const gradeLevels = getSchoolGradeLevels();
    gradeLevels.forEach(level => {
        const option = document.createElement("option");
        option.value = level;
        option.textContent = level;
        select.appendChild(option);
    });
    select.disabled = false;
}

// Keys a number box should never accept (browsers allow e, +, - in number inputs by default)
const BLOCKED_NUMBER_KEYS = ["e", "E", "+", "-"];

function blockNonNumberKeys(event) {
    if (BLOCKED_NUMBER_KEYS.includes(event.key)) event.preventDefault();
}

// Only allow pasting plain non-negative numbers into a number box
function blockNonNumberPaste(event) {
    const text = (event.clipboardData || window.clipboardData).getData("text").trim();
    if (!/^\d*\.?\d+$/.test(text)) event.preventDefault();
}

// The current "Marked out of" value, or 0 when it is blank or not a valid positive number
function getMaxScore() {
    const max = Number(document.getElementById("maxScoreInput").value);
    return Number.isFinite(max) && max > 0 ? max : 0;
}

// Keep a score between 0 and "Marked out of"; anything typed above the maximum is brought down to it
function limitScore(input) {
    const max = getMaxScore();
    input.classList.remove("invalid");
    input.setCustomValidity("");
    if (input.value === "") return;

    const score = Number(input.value);
    if (!Number.isFinite(score) || score < 0) {
        input.value = "";
        return;
    }
    if (max > 0 && score > max) {
        input.value = max;
        setGradeMessage(`Scores cannot be higher than the "Marked out of" value (${max}).`, false);
    }
}

// Apply the current "Marked out of" limit to every score; existing scores above a lowered maximum are flagged
function updateScoreLimits() {
    const max = getMaxScore();
    document.querySelectorAll(".student-score-input").forEach(input => {
        input.max = max > 0 ? String(max) : "";
        input.classList.remove("invalid");
        if (input.value !== "" && max > 0 && Number(input.value) > max) {
            input.classList.add("invalid");
        }
    });
    if (document.querySelector(".student-score-input.invalid")) {
        setGradeMessage(`Some scores are higher than ${max}. Lower them or raise "Marked out of".`, false);
    }
}

// This function builds the grade entry form based on the selected subject, grade level, and assessment. It also creates a table with student names and input fields for their scores.
function buildGradeForm() {
    const container = document.getElementById("gradeFormContainer");
    container.textContent = "";

    if (!selectedGradeLevel || !selectedAssessment) return;

    const students = getClassStudents();
    if (students.length === 0) {
        container.textContent = "No students found in this class.";
        return;
    }

    const grades = loadData(KEY_GRADES, []);
    const maxScoreInput = document.getElementById("maxScoreInput");
    const table = document.createElement("table");
    table.className = "grade-table";
    table.innerHTML = '<thead><tr><th scope="col">Student Name</th><th scope="col">Score</th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector("tbody");

    students.forEach(student => {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        nameCell.textContent = student.firstName + " " + student.lastName;
        const scoreInput = document.createElement("input");
        scoreInput.type = "number";
        scoreInput.min = "0";
        scoreInput.step = "any";
        scoreInput.inputMode = "decimal";
        scoreInput.className = "student-score-input";
        scoreInput.addEventListener("keydown", blockNonNumberKeys);
        scoreInput.addEventListener("paste", blockNonNumberPaste);
        scoreInput.addEventListener("input", () => limitScore(scoreInput));
        scoreInput.setAttribute("data-student-id", student.id);
        scoreInput.setAttribute("aria-label", "Score for " + student.firstName + " " + student.lastName);

        const existing = grades.find(grade =>
            sameId(grade.studentId, student.id) &&
            grade.subjectCode === selectedSubjectCode &&
            grade.semester === SEMESTER &&
            grade.assessment === selectedAssessment
        );
        if (existing) {
            scoreInput.value = existing.score;
            if (!maxScoreInput.value) maxScoreInput.value = existing.maxScore;
        }

        const scoreCell = document.createElement("td");
        scoreCell.appendChild(scoreInput);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        tbody.appendChild(row);
    });

    container.appendChild(table);
    updateScoreLimits();
}

// This function saves the grades entered by the teacher into localStorage
function saveGrades() {
    const maxScore = Number(document.getElementById("maxScoreInput").value);
    if (!selectedSubjectCode || !selectedGradeLevel || !selectedAssessment) {
        setGradeMessage("Select a subject, grade level, and assessment first.", false);
        return;
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
        setGradeMessage("Enter a valid 'Marked out of' value greater than 0.", false);
        return;
    }

    const inputs = document.querySelectorAll(".student-score-input");
    const classStudentIds = [];
    const newRecords = [];
    let allValid = true;

    inputs.forEach(input => {
        const studentId = input.getAttribute("data-student-id");
        const scoreText = input.value.trim();
        classStudentIds.push(studentId);
        input.classList.remove("invalid");

        if (scoreText === "") return;

        const score = Number(scoreText);
        if (Number.isFinite(score) && score >= 0 && score <= maxScore) {
            newRecords.push({
                studentId: studentId,
                subjectCode: selectedSubjectCode,
                semester: SEMESTER,
                assessment: selectedAssessment,
                score: score,
                maxScore: maxScore
            });
        } else {
            allValid = false;
            input.classList.add("invalid");
        }
    });

    if (!allValid) {
        setGradeMessage("Check the highlighted scores. Each score must be between 0 and the maximum.", false);
        return;
    }

    const grades = loadData(KEY_GRADES, []).filter(grade => {
        const isSelectedClassStudent = classStudentIds.some(id => sameId(id, grade.studentId));
        const isSelectedAssessment = grade.subjectCode === selectedSubjectCode &&
            grade.semester === SEMESTER && grade.assessment === selectedAssessment;
        return !(isSelectedClassStudent && isSelectedAssessment);
    });

    newRecords.forEach(record => grades.push(record));
    if (saveData(KEY_GRADES, grades)) {
        setGradeMessage("Grades successfully saved. You can view them on the Teacher Dashboard report card.", true);
    } else {
        setGradeMessage("Could not save grades to storage.", false);
    }
}

// This function initializes the grade entry page
function initGradePage() {
    checkTeacher();
    if (localStorage.getItem("role") !== "teacher") return;

    //This populates the subject dropdown and sets up event listeners for the form and assessment dropdowns, as well as the max score input and save button.
    fillSubjectDropdown();
    document.getElementById("subjectSelect").addEventListener("change", event => {
        selectedSubjectCode = event.target.value;
        selectedGradeLevel = "";
        selectedAssessment = "";
        document.getElementById("gradeSelect").value = "";
        document.getElementById("assessmentSelect").value = "";
        document.getElementById("assessmentSelect").disabled = !selectedSubjectCode;
        document.getElementById("maxScoreInput").value = "";
        document.getElementById("maxScoreInput").disabled = true;
        document.getElementById("gradeFormContainer").textContent = "";
        setGradeMessage("", false);
        fillFormDropdown();
        document.getElementById("gradeSelect").disabled = !selectedSubjectCode;
    });

    document.getElementById("gradeSelect").addEventListener("change", event => {
        selectedGradeLevel = event.target.value;
        selectedAssessment = "";
        document.getElementById("assessmentSelect").value = "";
        document.getElementById("maxScoreInput").value = "";
        document.getElementById("maxScoreInput").disabled = true;
        document.getElementById("gradeFormContainer").textContent = "";
        setGradeMessage("", false);
    });

    document.getElementById("assessmentSelect").addEventListener("change", event => {
        selectedAssessment = event.target.value;
        document.getElementById("maxScoreInput").disabled = !selectedAssessment;
        document.getElementById("maxScoreInput").value = "";
        setGradeMessage("", false);
        buildGradeForm();
    });

    const maxScoreInput = document.getElementById("maxScoreInput");
    maxScoreInput.addEventListener("keydown", blockNonNumberKeys);
    maxScoreInput.addEventListener("paste", blockNonNumberPaste);
    maxScoreInput.addEventListener("input", () => {
        setGradeMessage("", false);
        updateScoreLimits();
    });
    document.getElementById("saveGradesButton").addEventListener("click", saveGrades);
    document.getElementById("logoutButton")?.addEventListener("click", logout);
    document.getElementById("gradeSelect").disabled = true;
    document.getElementById("assessmentSelect").disabled = true;
    document.getElementById("maxScoreInput").disabled = true;
}

document.addEventListener("DOMContentLoaded", initGradePage);
