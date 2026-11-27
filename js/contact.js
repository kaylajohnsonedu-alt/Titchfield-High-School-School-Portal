/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    By Kayla Johnson
    contact.js: validates the Contact Us form, saves each message in localStorage
    and lists the sent messages under the form
*/

//Fetch Form and Message Elements
let contactForm = document.getElementById("contact-form");
let userName = document.getElementById("your-name");
let userEmail = document.getElementById("your-email");
let userSubject = document.getElementById("your-subject");
let userMessage = document.getElementById("your-message");
let errorMessage = document.getElementById("message");
let sentMessages = document.getElementById("sent-messages");

//Load stored data when document body is loaded
document.body.onload = function(){ displayStoredData(); userName.focus();};

//Execute function when form is submitted
contactForm.addEventListener('submit', function(event){

    //Prevent the default browser refresh behavior and clearing form values
    event.preventDefault();

    //Set Error Message container text and background colours
    errorMessage.style.color ="white";
    errorMessage.style.backgroundColor ="purple";

    let namePattern = /^[a-zA-Z'-]+(?: [a-zA-Z'-]+)*$/;
    if (namePattern.test(userName.value)){
        errorMessage.style.display ="none";
    } else {
        errorMessage.style.display ="block";
        errorMessage.textContent ="Please enter a valid name! Blank spaces and Numbers are NOT accepted";
        userName.focus();
        return;
    }

    let emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (emailPattern.test(userEmail.value)){
        errorMessage.style.display ="none";
    } else{
        errorMessage.style.display ="block";
        errorMessage.textContent ="Please enter a valid email address";
        userEmail.focus();
        return;
    }

    if (userSubject.value.trim().length < 10){
        errorMessage.style.display ="block";
        errorMessage.textContent ="Subject must be at least 10 characters long";
        userSubject.focus();
        return;
    }

    if (userMessage.value.trim().length < 20){
        errorMessage.style.display ="block";
        errorMessage.textContent ="Message must be at least 20 characters long";
        userMessage.focus();
        return;
    }

    errorMessage.style.display ="block";
    errorMessage.textContent ="Message sent! Please see Message Queue below.";
    errorMessage.style.color ="white";
    errorMessage.style.backgroundColor ="green";

    let data = JSON.parse(localStorage.getItem("sentMessages")) || [];
    data.push({name:userName.value,email:userEmail.value,subject:userSubject.value,message:userMessage.value});
    //Save to localStorage
    localStorage.setItem("sentMessages", JSON.stringify(data));
    //Call function to display messages
    displayStoredData();

    //contactForm.action="";
    //contactForm.method ="POST";
    contactForm.reset();
    //contactForm.submit();

});


//Based on safe coding we should turn characters like < and > into safe text so a message cannot add HTML to the page 
function escapeHtml(text){
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function displayStoredData(){
    //Retrieve and parse data
    let data = JSON.parse(localStorage.getItem("sentMessages"));

    if (data != null){
    let messageText ="<h2>Sent Messages</h2>";
    messageText +="<table id='message-table'><thead><tr><td> <b>#</b> </td><td> <b>Name</b> </td><td> <b>Email</b> </td><td> <b>Subject</b> </td><td> <b>Message</b> </td></tr></thead><tbody>";
    //Looping through the array
    for (let i = 0; i < data.length; i++){
        messageText +="<tr><td>" + (i+1) + "</td><td>" + escapeHtml(data[i].name) + " </td><td>" + escapeHtml(data[i].email) + " </td><td>" + escapeHtml(data[i].subject) + " </td><td>" + escapeHtml(data[i].message) + "</td></tr>";
    }

    messageText +="</tbody></table> <br /><br />";
    //Teachers and viewers may read the sent messages but not delete them
    if (!isReadOnlyUserLoggedIn()){
        messageText +="<button onclick='deleteMessages();'>Delete Sent Messages</button> <br /><br />";
    }
    sentMessages.innerHTML = messageText;
    document.getElementById("message-table").style.maxWidth ="50vw";
    sentMessages.style.display ="block";
    sentMessages.style.color ="white";
   }
};


//True when the person using the site is logged in as a teacher or a read-only viewer
function isReadOnlyUserLoggedIn(){
    const role = localStorage.getItem("role");
    return localStorage.getItem("isLoggedIn") ==="true" && (role ==="teacher" || role ==="viewer");
}

function deleteMessages(){
    //Teachers and viewers cannot delete messages, even if the function is called another way
    if (isReadOnlyUserLoggedIn()){
        return;
    }
    //Only remove the contact messages as localStorage.clear() would also wipe
    //the portal's login, student and finance data stored on this site
    localStorage.removeItem("sentMessages");
    window.location.reload();
};
