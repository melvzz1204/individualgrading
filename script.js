// Check if user is logged in and has correct permissions
if (!sessionStorage.getItem("username")) {
  window.location.href = "login.html";
  throw new Error("Authentication required");
}

const isAdmin = sessionStorage.getItem("userType") === "admin";
const userType = sessionStorage.getItem("userType");

// Prevent students from accessing admin view
if (userType === "student" && window.location.hash === "#admin") {
  window.location.hash = "";
}

// Security check for student attempting to access admin features
if (!isAdmin && document.getElementById("adminView")) {
  document.getElementById("adminView").remove();
}

const container = document.querySelector(".container");

// Initialize grades storage if it doesn't exist
if (!localStorage.getItem("grades")) {
  localStorage.setItem("grades", JSON.stringify([]));
}

if (isAdmin) {
  // Show admin view only if user is actually admin
  if (userType === "admin") {
    container.querySelector("#gradingForm").style.display = "none";
    const adminView = document.getElementById("adminView");
    adminView.classList.remove("hidden");

    // Add admin badge
    const adminBadge = document.createElement("div");
    adminBadge.className = "admin-badge";
    adminBadge.textContent = "Admin Mode";
    container.insertBefore(adminBadge, container.firstChild);

    // Display all stored grades
    displayAdminResults();

    // Add filter functionality for both group and section
    document
      .getElementById("groupFilter")
      .addEventListener("change", updateFilters);
    document
      .getElementById("sectionFilter")
      .addEventListener("change", updateFilters);
  }
} else {
  // Ensure admin elements are not accessible
  const adminElements = document.querySelectorAll(
    ".admin-view, .admin-badge, .admin-controls"
  );
  adminElements.forEach((el) => el.remove());

  // Show student view
  document.getElementById("gradingForm").style.display = "block";
}

function updateFilters() {
  const groupFilter = document.getElementById("groupFilter").value;
  const sectionFilter = document.getElementById("sectionFilter").value;
  displayAdminResults(groupFilter, sectionFilter);
}

// Function to display admin results
function displayAdminResults(filterGroup = "all", filterSection = "all") {
  if (!isAdmin || sessionStorage.getItem("userType") !== "admin") {
    console.error("Unauthorized access attempted");
    return;
  }

  const adminResults = document.getElementById("adminResults");
  const grades = JSON.parse(localStorage.getItem("grades") || "[]");

  adminResults.innerHTML = "";

  // Apply both filters
  const filteredGrades = grades.filter((grade) => {
    const matchesGroup = filterGroup === "all" || grade.group === filterGroup;
    const matchesSection =
      filterSection === "all" || grade.section === filterSection;
    return matchesGroup && matchesSection;
  });

  if (filteredGrades.length === 0) {
    adminResults.innerHTML = "<p>No grades found for selected filters.</p>";
    return;
  }

  // Sort grades by section and then by group
  filteredGrades.sort((a, b) => {
    if (a.section === b.section) {
      return a.group.localeCompare(b.group);
    }
    return (a.section || "").localeCompare(b.section || "");
  });

  // Display filtered results
  filteredGrades.forEach((grade, index) => {
    const gradeDiv = document.createElement("div");
    gradeDiv.className = "group-section";
    gradeDiv.innerHTML = `
            <div class="group-header">
                <h3>Group ${grade.group.replace("group", "")} - ${
      grade.section || "No Section"
    }</h3>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </div>
            <p class="submitted-by">
                <strong>Submitted by:</strong> ${grade.submittedBy || "Unknown"}
                <span class="section-info">(Section: ${
                  grade.section || "Not specified"
                })</span>
            </p>
            <ul>
                ${grade.students
                  .map(
                    (student) =>
                      `<li>${student.name} - Performance: ${student.performance}</li>`
                  )
                  .join("")}
            </ul>
            <p><strong>Comments:</strong> ${grade.comment || "No comments"}</p>
            <p><strong>Submitted:</strong> ${new Date(
              grade.timestamp
            ).toLocaleString()}</p>
        `;
    adminResults.appendChild(gradeDiv);

    // Add delete functionality
    const deleteBtn = gradeDiv.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", function () {
      if (confirm("Are you sure you want to delete this grade submission?")) {
        const grades = JSON.parse(localStorage.getItem("grades") || "[]");
        grades.splice(index, 1);
        localStorage.setItem("grades", JSON.stringify(grades));
        displayAdminResults(filterGroup, filterSection);
      }
    });
  });
}

// Add logout button
const logoutBtn = document.createElement("button");
logoutBtn.textContent = "Logout";
logoutBtn.className = "logout-btn";
logoutBtn.onclick = () => {
  sessionStorage.clear();
  window.location.href = "login.html";
};
container.appendChild(logoutBtn);

// Handle form submission
document.getElementById("gradingForm").addEventListener("submit", function (e) {
  if (isAdmin) {
    e.preventDefault();
    alert("Administrators cannot submit grades");
    return;
  }

  e.preventDefault();

  const gradeData = {
    group: document.getElementById("groupSelect").value,
    students: [],
    comment: document.getElementById("comment").value,
    timestamp: new Date().toISOString(),
    submittedBy: sessionStorage.getItem("username"), // Add submitter's name
    section: sessionStorage.getItem("section"), // Add section info
  };

  // Collect student data
  for (let i = 1; i <= 6; i++) {
    const name = document.getElementById(`student${i}`).value.trim();
    const performance = document.getElementById(`performance${i}`).value;
    if (name) {
      gradeData.students.push({ name, performance });
    }
  }

  // Save to localStorage
  const grades = JSON.parse(localStorage.getItem("grades") || "[]");
  grades.push(gradeData);
  localStorage.setItem("grades", JSON.stringify(grades));

  // Show submission result
  document.getElementById("resultGroup").textContent =
    gradeData.group.charAt(0).toUpperCase() +
    gradeData.group.slice(1).replace(/([A-Z])/g, " $1");

  const studentsList = document.getElementById("studentsList");
  studentsList.innerHTML = "";
  gradeData.students.forEach((student, index) => {
    const li = document.createElement("li");
    li.textContent = `Student ${index + 1}: ${student.name} - Performance: ${
      student.performance.charAt(0).toUpperCase() + student.performance.slice(1)
    }`;
    studentsList.appendChild(li);
  });

  document.getElementById("resultComment").textContent =
    gradeData.comment || "No comments provided";
  document.getElementById("result").classList.remove("hidden");
});
