/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    By Kayla Johnson
    role-nav.js: swaps the header navigation to match the logged-in role
*/
(function () {
    const NAV_MENUS ={
        teacher:[
            { href: "registerLanding.html", label: "Home" },
            {
                label: "Students",
                items: [{ href: "matrix.html", label: "Dashboard" },
                    { href: "profile.html", label: "Student Profile" },
                    { href: "teacher.html", label: "Teacher" },
                    { href: "grade.html", label: "Grade" }
                ]
            },
            {
                label: "Finance",
                items: [{ href: "search.html", label: "Query Wizard" },
                    { href: "reports.html", label: "Reports" },
                    { href: "tranHistory.html", label: "Transactions" }
                ]
            }
        ],
        administrator: [{ href: "adminIndex.html", label: "Home" },
            {
                label: "Students",
                items: [
                    { href: "register.html", label: "Register" },
                    { href: "profile.html", label: "Student Profile" },
                    { href: "matrix.html", label: "Academic Matrix" }
                ]
            },
            {
                label: "Finance",
                items: [{ href: "search.html", label: "Query Wizard" },
                    { href: "financialLedger.html", label: "Financial Ledger" },
                    { href: "reports.html", label: "Reports" },
                    { href: "tranHistory.html", label: "Transactions" }
                ]
            }
        ],
        //read-only viewer: only pages that show records without letting them be changed
        viewer: [{ href: "viewer.html", label: "Home" },
            {
                label: "Students",
                items: [{ href: "profile.html", label: "Student Profile" },
                    { href: "matrix.html", label: "Academic Matrix" }
                ]
            },
            {
                label: "Finance",
                items: [{ href: "search.html", label: "Query Wizard" },
                    { href: "reports.html", label: "Reports" },
                    { href: "tranHistory.html", label: "Transactions" }
                ]
            }
        ]
    };

    const role = localStorage.getItem("role");
    const menu = NAV_MENUS[role];
    const nav = document.querySelector("header nav");

    if (!menu || !nav || localStorage.getItem("isLoggedIn") !== "true"){
        return;
    }

    // File name of the current page
    const currentPage = decodeURIComponent(window.location.pathname.split("/").pop());

    function linkHtml(item){
        const current = item.href === currentPage ? ' aria-current="page"' : "";
        return '<li><a href="' + item.href + '"' + current + ">" + item.label + "</a></li>";
    }

    let html ="<ul>";
    menu.forEach(function (entry) {
        if (entry.items) {
            html += '<li class="dropdown"><details name="site-nav">';
            html += "<summary>" + entry.label + "</summary>";
            html += '<ul class="dropdown-menu">';
            entry.items.forEach(function (item) { html += linkHtml(item); });
            html += "</ul></details></li>";
        } else {
            html += linkHtml(entry);
        }
    });
    html +='<li><button type="button" id="logoutButton" class="nav-button">Logout</button></li>';
    html +="</ul>";

    nav.innerHTML = html;

    // Logout:forget who is signed in and return to the login page 
    document.getElementById("logoutButton").addEventListener("click", function () {
        if (typeof logout === "function") {
            logout();
            return;
        }
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        window.location.href = "login.html";
    });

    //Return to home-takes us back to the home page
    //first menu entry is always the role's Home link
    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll(".home-link").forEach(function (link) {
            link.href = menu[0].href;
        });
    });
})();
