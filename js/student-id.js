/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm
*/
//Nathan Mannings
//student-id.js: creates a random 6 digit student ID that no saved student already has.
//Load this file BEFORE form.js or edit.js.

const MAX_AVATAR_BYTES = 500 * 1024;
const VALID_AVATAR_TYPES = new Set(['image/jpeg', 'image/png']);

function generateStudentId(students) {
    const usedIds = new Set((students || []).map((s) => String(s.id)));

    //only 900,000 six digit numbers exist (100000-999999)
    if (usedIds.size >= 900000) {
        throw new Error('No unused 6 digit student IDs are left.');
    }

    let id;
    do {
        id = String(Math.floor(100000 + Math.random() * 900000));
    } while (usedIds.has(id));

    return id;
}

function getStudentDobValidationMessage(value) {
    if (!value) return '';

    const [year, month, day] = value.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) ||
        month < 1 || month > 12 || day < 1 || day > daysInMonth) {
        return 'Enter a valid date of birth.';
    }

    const today = new Date();
    let age = today.getFullYear() - year;
    const birthdayHasNotOccurred =
        today.getMonth() + 1 < month ||
        (today.getMonth() + 1 === month && today.getDate() < day);
    if (birthdayHasNotOccurred) age -= 1;

    if (age < 12 || age > 20) {
        return 'Student must be between 12 and 20 years old today.';
    }
    return '';
}

function attachStudentDobValidation(input) {
    if (!input) return () => {};

    const validate = () => {
        input.setCustomValidity(getStudentDobValidationMessage(input.value));
    };
    input.addEventListener('input', validate);
    input.addEventListener('change', validate);
    validate();
    return validate;
}

function isValidStudentAvatar(file) {
    return !file || (VALID_AVATAR_TYPES.has(file.type) && file.size <= MAX_AVATAR_BYTES);
}

//grey silhouette used when a student has no saved image
const DEFAULT_STUDENT_AVATAR = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
    '<rect width="120" height="120" fill="#e2e8f0"/>' +
    '<circle cx="60" cy="46" r="22" fill="#94a3b8"/>' +
    '<path d="M18 112c4-24 22-36 42-36s38 12 42 36z" fill="#94a3b8"/></svg>'
);

//largest width/height (in pixels) a saved student image is shrunk to
const AVATAR_MAX_SIDE = 256;

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Could not read image file.'));
        reader.readAsDataURL(file);
    });
}

//read an uploaded image and shrink it to a small JPEG so every student's photo fits in localStorage
//(a full 500KB photo is ~670KB once saved as text, so only a handful of students would fit before saving fails)
async function prepareStudentAvatar(file) {
    const original = await readFileAsDataUrl(file);
    try {
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Could not load image.'));
            image.src = original;
        });
        const scale = Math.min(1, AVATAR_MAX_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; //PNG transparency becomes white instead of black in the JPEG
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
        return original;
    }
}

//save the student list, telling the user if browser storage is full instead of failing silently
function trySaveStudents(key, students) {
    try {
        localStorage.setItem(key, JSON.stringify(students));
        return true;
    } catch (error) {
        console.error('Could not save students', error);
        alert('The student could not be saved because browser storage is full. Delete old student records and try again.');
        return false;
    }
}
