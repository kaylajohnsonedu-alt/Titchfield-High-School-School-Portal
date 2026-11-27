/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    By Damani Williams
*/


// STORAGE KEYS
// User accounts and teacher records are kept in localStorage (shared with teacher.js and grade-entry.js)
const KEY_LOGIN_USERS = "sp_users";
const KEY_LOGIN_TEACHERS = "sp_teachers";

// The home page each role is sent to after logging in (or when it opens a page it may not use)
const ROLE_HOME_PAGES = {
    administrator: "adminIndex.html",
    teacher: "registerLanding.html",
    viewer: "viewer.html" // read-only viewer (brief section 3C)
};

// Starting accounts saved the first time the site is opened in a browser.
// teacherId links a teacher login to the subjects that teacher may grade (subject codes from school-data.js)
const DEFAULT_USERS = [
    { username: "admin", password: "admin123", role: "administrator", fullName: "System Administrator" },
    { username: "teacher", password: "teacher123", role: "teacher", fullName: "Ms. McLeod", teacherId: "T001" },
    { username: "teacher2", password: "teacher123", role: "teacher", fullName: "Ms. Elliot", teacherId: "T002" },
    { username: "viewer", password: "viewer123", role: "viewer", fullName: "Read-Only Viewer" }
];

const DEFAULT_TEACHERS = [
    { teacherId: "T001", name: "Ms. McLeod", subjects: ["MATH", "AMATH"] },
    { teacherId: "T002", name: "Ms. Elliot", subjects: ["ENGLANG", "ENGLIT"] }
];


// SEED DATA
// Reads a saved list from localStorage (returns an empty array if it is missing or broken)
function readLoginList(key) {
    try {
        const saved = JSON.parse(localStorage.getItem(key));
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("Could not read " + key, error);
        return [];
    }
}

// Saves the default users and teachers, so the login and teacher pages always have accounts to use.
// Any default account missing from a browser's saved list (e.g. the viewer added later) is added to it.
function seedLoginData() {
    try {
        const savedUsers = readLoginList(KEY_LOGIN_USERS);
        const missingUsers = DEFAULT_USERS.filter(defaultUser =>
            !savedUsers.some(user => user.username === defaultUser.username)
        );
        if (missingUsers.length > 0) {
            localStorage.setItem(KEY_LOGIN_USERS, JSON.stringify(savedUsers.concat(missingUsers)));
        }
        if (readLoginList(KEY_LOGIN_TEACHERS).length === 0) {
            localStorage.setItem(KEY_LOGIN_TEACHERS, JSON.stringify(DEFAULT_TEACHERS));
        }
    } catch (error) {
        console.error("Could not save the default accounts", error);
    }
}

seedLoginData();


// LOGIN
// Retrieves the login form using its unique ID
const loginForm = document.getElementById("loginForm");

// Checks whether the login form exists on the current webpage
if (loginForm) {

    // Adds an event listener that waits for the form to be submitted
    loginForm.addEventListener("submit", function (e) {

        // Prevents the browser from refreshing the page when the form is submitted
        e.preventDefault();

        // Retrieves the username entered by the user and removes whitespace
        const username = document.getElementById("username").value.trim();

        // Retrieves the password entered by the user and removes whitespace
        const password = document.getElementById("password").value.trim();

        // Retrieves the selected role from the dropdown menu
        const role = document.getElementById("role").value;

        // Searches the saved user accounts for one matching all three credentials
        const validUser = readLoginList(KEY_LOGIN_USERS).find(user =>
            user.username === username &&
            user.password === password &&
            user.role === role
        );

        // Checks whether a matching user account was found
        if (validUser) {

            // Stores the login status, username and role of the authenticated user
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("username", validUser.username);
            localStorage.setItem("role", validUser.role);

            // Sends the user to the home page for their role (admin portal, teacher portal or read-only viewer)
            window.location.href = ROLE_HOME_PAGES[validUser.role];

        } else {

            // Displays an error message if the credentials do not match
            document.getElementById("message").textContent =
                "Invalid username, password, or role.";
        }
    });
}


// PAGE SECURITY
// Set to true once a redirect has started, so a page that checks twice only shows one message
let authRedirectStarted = false;

// Sends the visitor to another page without adding the protected page to the browser history
function redirectTo(page) {
    authRedirectStarted = true;
    window.location.replace(page);
}

// Returns true when someone is logged in; otherwise sends them to the login page
function checkAuth() {
    if (authRedirectStarted) return false;

    if (localStorage.getItem("isLoggedIn") !== "true" || !ROLE_HOME_PAGES[localStorage.getItem("role")]) {
        redirectTo("login.html");
        return false;
    }
    return true;
}

// Returns true when the logged-in user has the given role; otherwise sends them to their own home page
function requireRole(role) {
    if (!checkAuth()) return false;

    const currentRole = localStorage.getItem("role");
    if (currentRole !== role) {
        alert("Access Denied");
        redirectTo(ROLE_HOME_PAGES[currentRole]);
        return false;
    }
    return true;
}

// ADMIN PAGE SECURITY
function checkAdmin() {
    return requireRole("administrator");
}

// TEACHER PAGE SECURITY
function checkTeacher() {
    return requireRole("teacher");
}


// LOGOUT
// Forgets who is logged in but keeps the school's students, grades and transactions
function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.href = "login.html";
}
