// recruiter-dashboard.js - Enhanced debugging version

// Global tracking variables
let isFirebaseInitialized = false;
let isUserAuthenticated = false;
let currentUserId = null;
let firestoreAvailable = false;

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed");
  
  // Check Firebase initialization
  if (typeof firebase !== "undefined") {
    console.log("Firebase SDK is loaded");
    isFirebaseInitialized = true;
    
    if (firebase.app) {
      console.log("Firebase app is initialized");
      
      // Check if Firestore is available
      if (firebase.firestore) {
        console.log("Firestore is available");
        firestoreAvailable = true;
      } else {
        console.error("Firestore is not available - this will cause data loading issues");
      }
    } else {
      console.error("Firebase app is not initialized - check firebase-config.js");
    }
  } else {
    console.error("Firebase SDK is not loaded - check script tags in HTML");
  }
  
  // Mobile navigation toggle
  const mobileNav = document.querySelector(".hamburger");
  const navbar = document.querySelector(".menubar");

  if (mobileNav) {
    mobileNav.addEventListener("click", () => {
      navbar.classList.toggle("active");
      mobileNav.classList.toggle("hamburger-active");
    });
  }

  // Profile dropdown toggle
  const profileBtn = document.getElementById("profile-button");
  const dropdownContent = document.getElementById("profile-dropdown-content");

  if (profileBtn && dropdownContent) {
    profileBtn.addEventListener("click", function () {
      console.log("Profile button clicked");
      dropdownContent.classList.toggle("show");
    });
  } else {
    console.error("Profile dropdown elements not found in DOM");
  }

  // Close dropdown when clicking outside
  window.addEventListener("click", function (event) {
    if (dropdownContent && 
        !event.target.matches(".profile-btn") &&
        !event.target.parentNode.matches(".profile-btn")) {
      if (dropdownContent.classList.contains("show")) {
        dropdownContent.classList.remove("show");
      }
    }
  });

  // Post job button event
  const postJobBtn = document.getElementById("post-job-btn");
  if (postJobBtn) {
    postJobBtn.addEventListener("click", function () {
      window.location.href = "post-job.html";
    });
  } else {
    console.error("Post job button not found in DOM");
  }

  // Logout button event
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      logout();
    });
  } else {
    console.error("Logout button not found in DOM");
  }

  // Check authentication status
  console.log("Checking authentication status...");
  checkAuth();
});

// Function to check authentication status
function checkAuth() {
  if (!isFirebaseInitialized) {
    console.error("Cannot check auth - Firebase not initialized");
    loadDemoData();
    return;
  }
  
  // Check if Firebase Auth is available
  if (firebase.auth) {
    console.log("Firebase Auth is available, checking user status...");
    
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        // User is signed in
        console.log("User is signed in:", user.uid);
        console.log("User email:", user.email);
        isUserAuthenticated = true;
        currentUserId = user.uid;
        
        document.getElementById("user-initial").textContent = user.email
          .charAt(0)
          .toUpperCase();
          
        console.log("Loading user profile for:", user.uid);
        loadUserProfile(user.uid);
        
        // Load dashboard data
        console.log("Loading dashboard data for user:", user.uid);
        loadDashboardData();
      } else {
        // No user is signed in, redirect to login
        console.log("No user is signed in, redirecting to login...");
        window.location.href = "index.html";
      }
    }, function(error) {
      console.error("Auth state change error:", error);
      document.getElementById("profile-status").textContent = 
        "Error checking authentication status. Please try refreshing the page.";
    });
  } else {
    // Firebase Auth is not loaded
    console.error("Firebase Auth is not available, showing demo data");
    loadDemoData();
  }
}

// Function to load user profile
function loadUserProfile(userId) {
  console.log("loadUserProfile called with userId:", userId);
  
  if (!firestoreAvailable) {
    console.error("Cannot load user profile - Firestore not available");
    document.getElementById("company-name").textContent = "Company";
    document.getElementById("profile-status").textContent = 
      "Error: Firestore not available. Check console for details.";
    return;
  }
  
  console.log("Attempting to get recruiter document for:", userId);
  firebase.firestore()
    .collection("recruiters")
    .doc(userId)
    .get()
    .then((doc) => {
      console.log("Recruiter document retrieved:", doc.exists);
      
      if (doc.exists) {
        const data = doc.data();
        console.log("Recruiter data:", data);
        
        if (data.companyName) {
          document.getElementById("company-name").textContent = data.companyName;
        } else {
          document.getElementById("company-name").textContent = "Company";
        }
        
        document.getElementById("profile-status").textContent =
          data.profileComplete
            ? "Your profile is complete!"
            : "Please complete your company profile to attract more candidates.";
      } else {
        console.log("No recruiter document found");
        document.getElementById("profile-status").textContent =
          "Welcome! Please set up your company profile.";
      }
    })
    .catch((error) => {
      console.error("Error getting recruiter document:", error);
      document.getElementById("profile-status").textContent =
        "Error loading profile. Please try again later.";
    });
}

// Function to load dashboard data
function loadDashboardData() {
  console.log("loadDashboardData called");
  console.log("Is user authenticated:", isUserAuthenticated);
  console.log("Current user ID:", currentUserId);
  console.log("Is Firestore available:", firestoreAvailable);

  if (isUserAuthenticated && currentUserId && firestoreAvailable) {
    console.log("Loading jobs, applications, and analytics for user:", currentUserId);
    
    // Load jobs
    loadJobs(currentUserId);
    
    // Load applications
    loadApplications(currentUserId);
    
    // Load analytics
    loadAnalytics(currentUserId);
  } else {
    console.log("Conditions not met for loading dashboard data, showing demo data");
    // Load demo data
    loadDemoData();
  }
}

// Function to load jobs
function loadJobs(userId) {
  console.log("loadJobs called with userId:", userId);
  
  if (!userId) {
    console.error("Invalid userId provided to loadJobs function");
    document.getElementById("jobs-container").innerHTML = 
      "<p>Error: User ID is not available. Please try logging in again.</p>";
    return;
  }
  
  if (!firestoreAvailable) {
    console.error("Cannot load jobs - Firestore not available");
    document.getElementById("jobs-container").innerHTML = 
      "<p>Error: Firebase Firestore is not available. Please check console for details.</p>";
    return;
  }
  
  const jobsContainer = document.getElementById("jobs-container");
  if (!jobsContainer) {
    console.error("Jobs container element not found in DOM");
    return;
  }
  
  jobsContainer.innerHTML = "<p>Loading jobs...</p>";
  
  console.log("Executing Firestore query for jobs...");
  
  // Use a compound query to search for jobs with either recruiterId OR userId
  const db = firebase.firestore();
  
  // First try to get jobs by userId field (supported by current rules)
  db.collection("jobPost")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(4)
    .get()
    .then((querySnapshot) => {
      console.log(`Found ${querySnapshot.size} jobs for userId=${userId}`);
      
      if (querySnapshot.empty) {
        console.log("No jobs found with userId, trying recruiterId field");
        
        // Try with recruiterId field (after updating security rules)
        return db.collection("jobPost")
          .where("recruiterId", "==", userId)
          .orderBy("createdAt", "desc")
          .limit(4)
          .get();
      }
      
      return querySnapshot;
    })
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        console.log("No jobs found with either userId or recruiterId");
        
        jobsContainer.innerHTML = `
          <div class="empty-state">
            <p>You haven't posted any jobs yet.</p>
            <button class="btn btn-primary" onclick="window.location.href='post-job.html'">Post Your First Job</button>
          </div>
        `;
        return;
      }
      
      console.log(`Rendering ${querySnapshot.size} jobs`);
      
      let jobsHTML = "";
      querySnapshot.forEach((doc) => {
        const job = doc.data();
        job.id = doc.id;
        
        console.log("Processing job:", job.id);
        console.log("Job title:", job.title || job.jobTitle);
        console.log("Job creation date:", job.createdAt);
        
        // Handle Firestore timestamps properly
        let createdAtDisplay = "Unknown date";
        if (job.createdAt) {
          if (job.createdAt.toDate && typeof job.createdAt.toDate === "function") {
            createdAtDisplay = formatDate(job.createdAt.toDate());
          } else if (job.createdAt instanceof Date) {
            createdAtDisplay = formatDate(job.createdAt);
          }
        }

        jobsHTML += `
          <div class="job-card">
            <h3>${job.title || job.jobTitle || "Untitled Job"}</h3>
            <p>${job.location || "No location specified"}</p>
            <div class="job-meta">
              <span>${job.jobType || "N/A"}</span>
              <span>${createdAtDisplay}</span>
            </div>
            <div class="job-actions">
              <button class="edit" onclick="editJob('${job.id}')">Edit</button>
              <button class="delete" onclick="deleteJob('${job.id}')">Delete</button>
            </div>
          </div>
        `;
      });

      jobsContainer.innerHTML = jobsHTML;
      console.log("Jobs rendering complete");
    })
    .catch((error) => {
      console.error("Error getting jobs:", error);
      jobsContainer.innerHTML = `
        <p>You haven't listed any job yet. Add a new job here.</p>
      `;
    });
}

// Function to load applications
function loadApplications(userId) {
  console.log("loadApplications called with userId:", userId);
  
  if (!userId || !firestoreAvailable) {
    console.error("Cannot load applications - missing userId or Firestore");
    document.getElementById("applications-container").innerHTML = 
      "<p>Error loading applications data. Please try again later.</p>";
    return;
  }
  
  const applicationsContainer = document.getElementById("applications-container");
  applicationsContainer.innerHTML = "<p>Loading applications...</p>";
  
  firebase.firestore()
    .collection("applicant-post")
    .where("recruiterId", "==", userId)
    .orderBy("applicationDate", "desc")
    .limit(4)
    .get()
    .then((querySnapshot) => {
      console.log(`Found ${querySnapshot.size} applications for recruiterId=${userId}`);

      if (querySnapshot.empty) {
        applicationsContainer.innerHTML = "<p>No applications received yet.</p>";
        return;
      }

      let applicationsHTML = "";
      querySnapshot.forEach((doc) => {
        const application = doc.data();
        application.id = doc.id;

        // Handle Firestore timestamps properly
        let appliedAtDisplay = "Unknown date";
        if (application.applicationDate) {
          if (application.applicationDate.toDate && typeof application.applicationDate.toDate === "function") {
            appliedAtDisplay = formatDate(application.applicationDate.toDate());
          } else if (application.applicationDate instanceof Date) {
            appliedAtDisplay = formatDate(application.applicationDate);
          }
        }

        // Get applicant name from applicantDetails
        const applicantName = application.applicantDetails ? 
          `${application.applicantDetails.firstName || ''} ${application.applicantDetails.lastName || ''}`.trim() : 
          'Unknown Candidate';

        // Get job title from jobDetails
        const jobTitle = application.jobDetails ? 
          application.jobDetails.jobTitle || 'Unknown Position' : 
          'Unknown Position';

        // Determine which action buttons to show based on status
        let actionButtons = '';
        if (application.status === 'pending') {
          actionButtons = `
            <button class="review" onclick="reviewApplication('${application.id}')">
              <i class="fas fa-check-circle"></i> Review Application
            </button>
          `;
        } else {
          actionButtons = `
            <button class="view" onclick="reviewApplication('${application.id}')">
              <i class="fas fa-eye"></i> View Details
            </button>
          `;
        }

        applicationsHTML += `
          <div class="job-card">
            <h3>${applicantName}</h3>
            <p>Applied for: ${jobTitle}</p>
            <div class="job-meta">
              <span class="status-${application.status || 'pending'}">${application.status || 'New'}</span>
              <span>${appliedAtDisplay}</span>
            </div>
            <div class="job-actions">
              ${actionButtons}
            </div>
          </div>
        `;
      });

      applicationsContainer.innerHTML = applicationsHTML;
    })
    .catch((error) => {
      console.error("Error getting applications:", error);
      applicationsContainer.innerHTML =
        "<p>Error loading applications. Please try again later.</p>";
    });
}

// Function to load analytics
function loadAnalytics(userId) {
  console.log("loadAnalytics called with userId:", userId);
  
  if (!userId || !firestoreAvailable) {
    console.error("Cannot load analytics - missing userId or Firestore");
    return;
  }

  // Get total jobs
  firebase.firestore()
    .collection("jobPost")
    .where("recruiterId", "==", userId)
    .get()
    .then((snapshot) => {
      console.log(`Total jobs count: ${snapshot.size}`);
      document.getElementById("total-jobs").textContent = snapshot.size;
      
      // If no jobs found with recruiterId, try userId
      if (snapshot.size === 0) {
        return firebase.firestore()
          .collection("jobPost")
          .where("userId", "==", userId)
          .get();
      }
    })
    .then((snapshot) => {
      if (snapshot && snapshot.size > 0) {
        document.getElementById("total-jobs").textContent = snapshot.size;
      }
    })
    .catch((error) => {
      console.error("Error getting jobs count:", error);
    });

  // Get total applications from applicant-post collection
  firebase.firestore()
    .collection("applicant-post")
    .where("recruiterId", "==", userId)
    .get()
    .then((snapshot) => {
      console.log(`Total applications count: ${snapshot.size}`);
      document.getElementById("total-applications").textContent = snapshot.size;
    })
    .catch((error) => {
      console.error("Error getting applications count:", error);
    });

  // Get active interviews (applications with interview_scheduled status)
  firebase.firestore()
    .collection("applicant-post")
    .where("recruiterId", "==", userId)
    .where("status", "==", "interview_scheduled")
    .get()
    .then((snapshot) => {
      console.log(`Active interviews count: ${snapshot.size}`);
      document.getElementById("active-interviews").textContent = snapshot.size;
    })
    .catch((error) => {
      console.error("Error getting interviews count:", error);
    });

  // Get positions filled (applications with accepted status)
  firebase.firestore()
    .collection("applicant-post")
    .where("recruiterId", "==", userId)
    .where("status", "==", "accepted")
    .get()
    .then((snapshot) => {
      console.log(`Positions filled count: ${snapshot.size}`);
      document.getElementById("positions-filled").textContent = snapshot.size;
    })
    .catch((error) => {
      console.error("Error getting hired count:", error);
    });
}

// Function to load demo data when Firebase is not connected
function loadDemoData() {
  console.log("Loading demo data");
  
  // Set company name
  document.getElementById("company-name").textContent = "Demo Company";
  document.getElementById("profile-status").textContent =
    "Demo Mode - Firebase not connected";
  document.getElementById("user-initial").textContent = "D";

  // Set demo jobs
  const demoJobs = [
    {
      title: "Frontend Developer",
      location: "New York, NY",
      jobType: "Full-time",
      createdAt: new Date(2023, 3, 15),
      id: "demo1",
    },
    {
      title: "UX Designer",
      location: "Remote",
      jobType: "Contract",
      createdAt: new Date(2023, 3, 10),
      id: "demo2",
    },
    {
      title: "Product Manager",
      location: "San Francisco, CA",
      jobType: "Full-time",
      createdAt: new Date(2023, 3, 5),
      id: "demo3",
    },
  ];

  let jobsHTML = "";
  demoJobs.forEach((job) => {
    jobsHTML += `
        <div class="job-card">
          <h3>${job.title}</h3>
          <p>${job.location}</p>
          <div class="job-meta">
            <span>${job.jobType}</span>
            <span>${formatDate(job.createdAt)}</span>
          </div>
          <div class="job-actions">
            <button class="edit" onclick="editJob('${job.id}')">Edit</button>
            <button class="delete" onclick="deleteJob('${job.id}')">Delete</button>
          </div>
        </div>
      `;
  });

  document.getElementById("jobs-container").innerHTML = jobsHTML;

  // Set demo applications
  const demoApplications = [
    {
      candidateName: "Jane Smith",
      jobTitle: "Frontend Developer",
      status: "New",
      appliedAt: new Date(2023, 3, 16),
      id: "app1",
    },
    {
      candidateName: "John Doe",
      jobTitle: "UX Designer",
      status: "Interview",
      appliedAt: new Date(2023, 3, 12),
      id: "app2",
    },
  ];

  let applicationsHTML = "";
  demoApplications.forEach((app) => {
    applicationsHTML += `
        <div class="job-card">
          <h3>${app.candidateName}</h3>
          <p>Applied for: ${app.jobTitle}</p>
          <div class="job-meta">
            <span>${app.status}</span>
            <span>${formatDate(app.appliedAt)}</span>
          </div>
          <div class="job-actions">
            <button class="edit" onclick="viewApplication('${app.id}')">View</button>
          </div>
        </div>
      `;
  });

  document.getElementById("applications-container").innerHTML = applicationsHTML;

  // Set analytics
  document.getElementById("total-jobs").textContent = "3";
  document.getElementById("total-applications").textContent = "2";
  document.getElementById("active-interviews").textContent = "1";
  document.getElementById("positions-filled").textContent = "0";
}

// Helper function to format dates
function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date)) {
    return '';
  }

  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

// Job edit function
function editJob(jobId) {
  console.log("editJob called with jobId:", jobId);
  window.location.href = `edit-job.html?id=${jobId}`;
}

// Job delete function
function deleteJob(jobId) {
  console.log("deleteJob called with jobId:", jobId);
  if (confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
    if (firestoreAvailable) {
      firebase.firestore()
        .collection("jobPost")
        .doc(jobId)
        .delete()
        .then(() => {
          console.log("Job deleted successfully");
          alert("Job deleted successfully!");
          loadDashboardData(); // Reload data
        })
        .catch((error) => {
          console.error("Error removing job: ", error);
          alert("Error deleting job. Please try again.");
        });
    } else {
      // Demo mode
      console.log("Demo mode - job would be deleted");
      alert("Job would be deleted (Demo Mode)");
    }
  }
}

// View application function
function viewApplication(applicationId) {
  console.log("viewApplication called with applicationId:", applicationId);
  window.location.href = `view-application.html?id=${applicationId}`;
}

// Logout function
function logout() {
  console.log("logout function called");
  if (firebase.auth) {
    firebase.auth()
      .signOut()
      .then(() => {
        console.log("Sign-out successful");
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
        alert("Error signing out. Please try again.");
      });
  } else {
    // Demo mode
    console.log("Demo mode - would log out");
    alert("You would be logged out (Demo Mode)");
    window.location.href = "index.html";
  }
}

// Add function to handle application review
function reviewApplication(applicationId) {
  console.log("reviewApplication called with applicationId:", applicationId);
  
  // Get application details from Firestore
  firebase.firestore()
    .collection("applicant-post")
    .doc(applicationId)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        showNotification('Application not found', 'error');
        return;
      }

      const application = doc.data();
      const applicantDetails = application.applicantDetails || {};
      const jobDetails = application.jobDetails || {};
      
      // Create modal HTML
      const modalHTML = `
        <div class="review-modal-overlay" onclick="closeReviewModal()">
          <div class="review-modal" onclick="event.stopPropagation()">
            <button class="close-modal" onclick="closeReviewModal()">×</button>
            
            <div class="review-header">
              <h2>Review Application</h2>
              <span class="status-badge status-${application.status}">${application.status}</span>
            </div>

            <div class="review-content">
              <div class="review-section">
                <h3>Applicant Details</h3>
                <div class="details-grid">
                  <div class="detail-item">
                    <label>Name:</label>
                    <span>${applicantDetails.firstName} ${applicantDetails.lastName}</span>
                  </div>
                  <div class="detail-item">
                    <label>Email:</label>
                    <span>${applicantDetails.email}</span>
                  </div>
                  <div class="detail-item">
                    <label>Phone:</label>
                    <span>${applicantDetails.contactNumber || 'Not provided'}</span>
                  </div>
                  <div class="detail-item">
                    <label>Location:</label>
                    <span>${applicantDetails.homeAddress || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div class="review-section">
                <h3>Job Details</h3>
                <div class="details-grid">
                  <div class="detail-item">
                    <label>Position:</label>
                    <span>${jobDetails.jobTitle}</span>
                  </div>
                  <div class="detail-item">
                    <label>Department:</label>
                    <span>${jobDetails.department || 'Not specified'}</span>
                  </div>
                  <div class="detail-item">
                    <label>Location:</label>
                    <span>${jobDetails.location}</span>
                  </div>
                  <div class="detail-item">
                    <label>Type:</label>
                    <span>${jobDetails.jobType}</span>
                  </div>
                </div>
              </div>

              <div class="review-section">
                <h3>Resume</h3>
                ${applicantDetails.resumeURL ? 
                  `<a href="${applicantDetails.resumeURL}" target="_blank" class="resume-download-btn" download="${applicantDetails.resumeFileName || 'resume.pdf'}">
                    <i class="fas fa-download"></i> Download Resume
                  </a>` : 
                  '<p>No resume uploaded</p>'
                }
              </div>

              <div class="review-section">
                <h3>Application Status</h3>
                <div class="status-history">
                  ${application.statusHistory ? 
                    application.statusHistory.map(status => `
                      <div class="status-item">
                        <span class="status-badge status-${status.status}">${status.status}</span>
                        <span class="status-date">${formatDate(status.timestamp)}</span>
                        ${status.notes ? `<p class="status-notes">${status.notes}</p>` : ''}
                      </div>
                    `).join('') : 
                    '<p>No status history available</p>'
                  }
                </div>
              </div>

              <div class="review-actions">
                <button class="action-btn accept" onclick="updateApplicationStatus('${applicationId}', 'accepted')">
                  <i class="fas fa-check"></i> Accept
                </button>
                <button class="action-btn reject" onclick="updateApplicationStatus('${applicationId}', 'rejected')">
                  <i class="fas fa-times"></i> Reject
                </button>
                <button class="action-btn interview" onclick="scheduleInterview('${applicationId}')">
                  <i class="fas fa-calendar"></i> Schedule Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add modal to page
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .review-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .review-modal {
          background: white;
          border-radius: 8px;
          padding: 20px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .close-modal {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }

        .review-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-item label {
          font-weight: 600;
          color: #666;
          margin-bottom: 5px;
        }

        .resume-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          transition: background 0.2s;
        }

        .resume-download-btn:hover {
          background: #0056b3;
        }

        .status-history {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: white;
          border-radius: 4px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9em;
          font-weight: 500;
        }

        .status-pending { background: #ffd700; color: #000; }
        .status-accepted { background: #28a745; color: white; }
        .status-rejected { background: #dc3545; color: white; }
        .status-interview_scheduled { background: #17a2b8; color: white; }

        .review-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .action-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 5px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s;
        }

        .action-btn:hover {
          opacity: 0.9;
        }

        .action-btn.accept { background: #28a745; }
        .action-btn.reject { background: #dc3545; }
        .action-btn.interview { background: #17a2b8; }
      `;
      document.head.appendChild(style);

    })
    .catch((error) => {
      console.error("Error loading application:", error);
      showNotification('Error loading application details', 'error');
    });
}

function closeReviewModal() {
  const modal = document.querySelector('.review-modal-overlay');
  if (modal) {
    modal.remove();
  }
}

function updateApplicationStatus(applicationId, newStatus) {
  if (!confirm(`Are you sure you want to ${newStatus} this application?`)) {
    return;
  }

  const timestamp = new Date();
  const formattedDate = formatDate(timestamp);

  firebase.firestore()
    .collection("applicant-post")
    .doc(applicationId)
    .update({
      status: newStatus,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      statusHistory: firebase.firestore.FieldValue.arrayUnion({
        status: newStatus,
        timestamp: timestamp,
        notes: `Application ${newStatus} by recruiter on ${formattedDate}`
      })
    })
    .then(() => {
      showNotification(`Application ${newStatus} successfully on ${formattedDate}`, 'success');
      closeReviewModal();
      loadApplications(currentUserId);
    });
}

function scheduleInterview(applicationId) {
  const template = document.getElementById('interview-modal-template');
  const modalContent = template.content.cloneNode(true);
  
  // Set minimum date to today
  const dateInput = modalContent.getElementById('interview-date');
  dateInput.min = new Date().toISOString().split('T')[0];
  
  // Add event listeners
  const closeBtn = modalContent.querySelector('.close-modal');
  const cancelBtn = modalContent.querySelector('.btn-secondary');
  const scheduleBtn = modalContent.querySelector('.btn-primary');
  
  closeBtn.onclick = () => closeInterviewModal();
  cancelBtn.onclick = () => closeInterviewModal();
  scheduleBtn.onclick = () => confirmInterviewSchedule(applicationId);
  
  document.body.appendChild(modalContent);
}

function closeInterviewModal() {
  const modal = document.querySelector('.interview-modal-overlay');
  if (modal) {
    modal.remove();
  }
}

function confirmInterviewSchedule(applicationId) {
  const date = document.getElementById('interview-date').value;
  const time = document.getElementById('interview-time').value;
  const type = document.getElementById('interview-type').value;
  const notes = document.getElementById('interview-notes').value;

  if (!date || !time) {
    showNotification('Please select both date and time', 'error');
    return;
  }

  const interviewDateTime = new Date(`${date}T${time}`);
  const formattedDateTime = formatDate(interviewDateTime);

  firebase.firestore()
    .collection("applicant-post")
    .doc(applicationId)
    .update({
      status: 'interview_scheduled',
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      interviewDetails: {
        date: date,
        time: time,
        type: type,
        notes: notes,
        scheduledAt: new Date()
      },
      statusHistory: firebase.firestore.FieldValue.arrayUnion({
        status: 'interview_scheduled',
        timestamp: new Date(),
        notes: `Interview scheduled for ${formattedDateTime} (${type})${notes ? ` - ${notes}` : ''}`
      })
    })
    .then(() => {
      showNotification(`Interview scheduled for ${formattedDateTime}`, 'success');
      closeInterviewModal();
      closeReviewModal();
      loadApplications(currentUserId);
    });
}