// Edit Job JavaScript - Updated version of post-job.js
// This script handles loading job data and updating it

// Global variables
let currentJobId = null;
let currentUserId = null;

document.addEventListener("DOMContentLoaded", function () {
  console.log("Edit job page loaded");
  
  // Check if Firebase is available
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK is not loaded");
    showError("Firebase SDK is not available. Please check your internet connection.");
    return;
  }
  
  // Check authentication status
  checkAuth();
  
  // Get job ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');
  
  if (jobId) {
    console.log("Job ID found in URL:", jobId);
    currentJobId = jobId;
    loadJobData(jobId);
  } else {
    console.error("No job ID provided in URL");
    showError("No job ID found. Please go back to the dashboard and select a job to edit.");
  }
  
  // Setup form submission handler
  const jobForm = document.getElementById("postJobForm");
  if (jobForm) {
    jobForm.addEventListener("submit", function (e) {
      e.preventDefault();
      updateJob();
    });
  }
});

// Function to check if user is authenticated
function checkAuth() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in
      console.log("User authenticated:", user.uid);
      currentUserId = user.uid;
      document.getElementById("user-initial").textContent = user.email.charAt(0).toUpperCase();
    } else {
      // No user is signed in, redirect to login
      console.log("No user is signed in, redirecting to login...");
      window.location.href = "index.html";
    }
  });
}

// Function to load job data from Firestore
function loadJobData(jobId) {
  console.log("Loading job data for job ID:", jobId);
  
  // Show loading state
  document.querySelectorAll('input, textarea, select').forEach(el => {
    el.disabled = true;
  });
  
  firebase.firestore()
    .collection("jobPost")
    .doc(jobId)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const jobData = doc.data();
        console.log("Job data retrieved:", jobData);
        
        // Check if the current user has permission to edit this job
        if (jobData.userId === currentUserId || jobData.recruiterId === currentUserId) {
          // Populate form fields with job data
          populateFormFields(jobData);
        } else {
          console.error("User does not have permission to edit this job");
          showError("You don't have permission to edit this job.");
          setTimeout(() => {
            window.location.href = "recruiter-dashboard.html";
          }, 3000);
        }
      } else {
        console.error("Job document does not exist");
        showError("Job not found. It may have been deleted.");
      }
    })
    .catch((error) => {
      console.error("Error getting job document:", error);
      showError("Error loading job data: " + error.message);
    })
    .finally(() => {
      // Re-enable form fields
      document.querySelectorAll('input, textarea, select').forEach(el => {
        el.disabled = false;
      });
    });
}

// Function to populate form fields with job data
function populateFormFields(jobData) {
  // Map jobData to form fields
  const fieldMappings = {
    // Direct mappings (field name in Firestore -> form field ID)
    "title": "jobTitle",
    "jobTitle": "jobTitle", // Handling both possible field names
    "jobType": "jobType",
    "modeOfWork": "modeOfWork",
    "location": "location",
    "duration": "duration",
    "salary": "salary",
    "skills": "skills",
    "jobDescription": "jobDescription",
    "hiringWorkflow": "hiringWorkflow"
  };
  
  // For each field in our mapping
  for (const [dataField, formField] of Object.entries(fieldMappings)) {
    // Get the form element
    const element = document.getElementById(formField);
    
    // If the element exists and we have data for it
    if (element && (jobData[dataField] !== undefined)) {
      // Set the value based on element type
      if (element.tagName === "SELECT") {
        // For select elements, we need to find the option value
        const options = element.options;
        for (let i = 0; i < options.length; i++) {
          if (options[i].value === jobData[dataField]) {
            element.selectedIndex = i;
            break;
          }
        }
      } else {
        // For input and textarea elements
        element.value = jobData[dataField];
      }
    }
  }
  
  // Handle special case for lastDate (assuming it's stored as a Timestamp in Firestore)
  const lastDateElement = document.getElementById("lastDate");
  if (lastDateElement && jobData.lastDate) {
    let lastDate;
    
    // Convert Firestore timestamp to Date object if needed
    if (jobData.lastDate.toDate && typeof jobData.lastDate.toDate === "function") {
      lastDate = jobData.lastDate.toDate();
    } else if (jobData.lastDate instanceof Date) {
      lastDate = jobData.lastDate;
    } else {
      // Try to parse the string to a Date
      lastDate = new Date(jobData.lastDate);
    }
    
    // Format date as YYYY-MM-DD for input[type="date"]
    if (!isNaN(lastDate.getTime())) {
      const year = lastDate.getFullYear();
      const month = String(lastDate.getMonth() + 1).padStart(2, '0');
      const day = String(lastDate.getDate()).padStart(2, '0');
      lastDateElement.value = `${year}-${month}-${day}`;
    }
  }
  
  // Update page title to reflect editing mode
  document.querySelector('.text').textContent = "Edit Job: " + (jobData.title || jobData.jobTitle || "Untitled Job");
  
  // Change submit button text
  const submitBtn = document.querySelector('input[type="submit"]');
  if (submitBtn) {
    submitBtn.value = "Update Job";
  }
}

// Function to update job in Firestore
function updateJob() {
  console.log("Updating job with ID:", currentJobId);
  
  if (!currentJobId) {
    showError("No job ID available. Cannot update job.");
    return;
  }
  
  // Show loading state
  const submitBtn = document.querySelector('input[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.value = "Updating...";
  }
  
  // Get form values
  const jobData = {
    title: document.getElementById("jobTitle").value,
    jobType: document.getElementById("jobType").value,
    modeOfWork: document.getElementById("modeOfWork").value,
    location: document.getElementById("location").value,
    duration: document.getElementById("duration").value,
    salary: document.getElementById("salary").value,
    lastDate: new Date(document.getElementById("lastDate").value),
    skills: document.getElementById("skills").value,
    jobDescription: document.getElementById("jobDescription").value,
    hiringWorkflow: document.getElementById("hiringWorkflow").value,
    updatedAt: new Date()
  };
  
  console.log("Updated job data:", jobData);
  
  // Update document in Firestore
  firebase.firestore()
    .collection("jobPost")
    .doc(currentJobId)
    .update(jobData)
    .then(() => {
      console.log("Job updated successfully");
      alert("Job updated successfully!");
      window.location.href = "recruiter-dashboard.html";
    })
    .catch((error) => {
      console.error("Error updating job:", error);
      showError("Error updating job: " + error.message);
    })
    .finally(() => {
      // Reset button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.value = "Update Job";
      }
    });
}

// Helper function to show error messages
function showError(message) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorElement.style.display = "none";
    }, 5000);
  } else {
    alert(message);
  }
}