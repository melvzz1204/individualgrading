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

const API_URL = "http://localhost:5000/grades";

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

// Fetch and display grades
function displayAdminResults(filterGroup = "all", filterSection = "all") {
  if (!isAdmin) return;

  const adminResults = document.getElementById("adminResults");
  adminResults.innerHTML = "<p>Loading...</p>";

  fetch(API_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((grades) => {
      const filteredGrades = grades.filter((grade) => {
        const matchesGroup =
          filterGroup === "all" || grade.group === filterGroup;
        const matchesSection =
          filterSection === "all" || grade.section === filterSection;
        return matchesGroup && matchesSection;
      });

      if (filteredGrades.length === 0) {
        adminResults.innerHTML = "<p>No grades found for selected filters.</p>";
        return;
      }

      adminResults.innerHTML = "";
      filteredGrades.forEach((grade) => {
        const gradeDiv = createGradeElement(grade);
        adminResults.appendChild(gradeDiv);
      });
    })
    .catch((error) => {
      console.error("Error fetching grades:", error);
      adminResults.innerHTML = "<p>Error loading grades</p>";
    });
}

// Submit grades
document.getElementById("gradingForm").addEventListener("submit", function (e) {
  e.preventDefault();
  if (isAdmin) return;

  const gradeData = {
    group: document.getElementById("groupSelect").value,
    section: sessionStorage.getItem("section"),
    students: [],
    comment: document.getElementById("comment").value,
    submittedBy: sessionStorage.getItem("username"),
  };

  for (let i = 1; i <= 6; i++) {
    const name = document.getElementById(`student${i}`).value.trim();
    const performance = document.getElementById(`performance${i}`).value;
    if (name) {
      gradeData.students.push({ name, performance });
    }
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gradeData),
  })
    .then((response) => response.json())
    .then(() => {
      alert("Grade submitted successfully!");
      this.reset();
    })
    .catch((error) => {
      console.error("Error submitting grade:", error);
      alert("Error submitting grade");
    });
});

// Delete grade
function deleteGrade(gradeId) {
  if (!isAdmin) return;

  if (confirm("Are you sure you want to delete this grade?")) {
    fetch(`${API_URL}/${gradeId}`, { method: "DELETE" })
      .then(() => {
        alert("Grade deleted successfully");
        displayAdminResults();
      })
      .catch((error) => {
        console.error("Error deleting grade:", error);
        alert("Error deleting grade");
      });
  }
}

// Helper function to create grade element
function createGradeElement(grade) {
  const gradeDiv = document.createElement("div");
  gradeDiv.className = "group-section";
  gradeDiv.innerHTML = `
    <div class="group-header">
      <h3>Group ${grade.group} - ${grade.section || "No Section"}</h3>
      <button class="delete-btn" onclick="deleteGrade('${
        grade._id
      }')">Delete</button>
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
  return gradeDiv;
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
