/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    By Jamelia Freeman

    validation.js: shows a message under each form field as soon as its value is invalid.
    Every field is required unless it has data-optional="true".
*/

// Every kind of form field that gets live validation (buttons, checkboxes and radios are skipped)
const LIVE_VALIDATION_SELECTOR =['input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"])','select','textarea'].join(',');

let liveValidationId= 0;

function getFieldValidationMessage(control){
    const validity = control.validity;
    if (validity.valid) return '';
    if (validity.customError) return control.validationMessage;
    if (validity.valueMissing) return 'This field is required.';
    if (validity.typeMismatch) return `Enter a valid ${control.type === 'email' ? 'email address' : control.type}.`;
    if (validity.patternMismatch) return control.title || 'Enter a value in the required format.';
    if (validity.rangeOverflow) return 'The value is above the allowed maximum.';
    if (validity.rangeUnderflow) return 'The value is below the allowed minimum.';
    if (validity.tooLong) return `Use no more than ${control.maxLength} characters.`;
    if (validity.badInput) return 'Enter a valid value.';
    return control.validationMessage || 'Enter a valid value.';
}

function refreshFieldValidation(control, reveal){
    if (!control || !control.matches(LIVE_VALIDATION_SELECTOR)) return;

    const message = getFieldValidationMessage(control);
    const error = document.getElementById(control.dataset.validationErrorId);
    if (error) error.textContent = message;

    const shouldReveal = reveal=== true ||
        (reveal !== false && control.dataset.validationTouched === 'true');
    if (message && shouldReveal){
        control.setAttribute('aria-invalid', 'true');
        if (error) error.hidden = false;
        return;
    }

    if (message) return;

    if (!message){
        control.removeAttribute('aria-invalid');
        if (error){
            error.hidden = true;
            error.textContent = '';
        }
    }
}

function enableLiveValidation(control){
    if (control.dataset.liveValidation === 'true') return;

    control.dataset.liveValidation = 'true';
    control.required = control.dataset.optional !== 'true';

    if (!control.id){
        control.id = `live-validation-field-${++liveValidationId}`;
    }

    const error = document.createElement('span');
    error.id = `${control.id}-validation-error`;
    error.className = 'field-validation-error';
    error.setAttribute('aria-live', 'polite');
    error.hidden = true;
    control.dataset.validationErrorId = error.id;
    control.insertAdjacentElement('afterend', error);

    const revealError = () =>{
        control.dataset.validationTouched = 'true';
        refreshFieldValidation(control, true);
    };
    control.addEventListener('input', revealError);
    control.addEventListener('change', revealError);
    control.addEventListener('blur', revealError);
    control.addEventListener('invalid', revealError);
}

document.querySelectorAll(LIVE_VALIDATION_SELECTOR).forEach(enableLiveValidation);
