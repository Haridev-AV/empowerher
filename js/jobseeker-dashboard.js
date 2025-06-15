// Mobile Navigation
const mobileNav = document.querySelector(".hamburger");
const navbar = document.querySelector(".menubar");

const toggleNav = () => {
  navbar.classList.toggle("active");
  mobileNav.classList.toggle("hamburger-active");
};

mobileNav.addEventListener("click", () => toggleNav());

// Profile Dropdown
const profileButton = document.getElementById('profile-button');
const profileDropdown = document.getElementById('profile-dropdown-content');

profileButton.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.classList.remove('show');
  }
});

// Sample data for demonstration
const sampleJobs = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120,000 - $150,000",
    description: "We're looking for an experienced frontend developer to join our dynamic team. You'll work with React, TypeScript, and modern web technologies.",
    posted: "2 days ago"
  },
  {
    id: 2,
    title: "UX/UI Designer",
    company: "Design Studio",
    location: "Remote",
    type: "Contract",
    salary: "$80,000 - $100,000",
    description: "Join our creative team to design beautiful and functional user experiences for web and mobile applications.",
    posted: "1 day ago"
  },
  {
    id: 3,
    title: "Marketing Manager",
    company: "Growth Co.",
    location: "New York, NY",
    type: "Full-time",
    salary: "$90,000 - $110,000",
    description: "Lead marketing initiatives and drive customer acquisition through digital marketing strategies and campaigns.",
    posted: "3 days ago"
  },
  {
    id: 4,
    title: "Data Scientist",
    company: "Analytics Pro",
    location: "Austin, TX",
    type: "Full-time",
    salary: "$130,000 - $160,000",
    description: "Analyze complex datasets and build machine learning models to drive business insights and decision-making.",
    posted: "1 week ago"
  }
];

const sampleApplications = [];
let appliedJobIds = [];

// Firebase integration for user display
let currentFirebaseUser = null;
let userProfileData = null;

// Function to load user profile data from Firebase
async function loadUserProfile(userId) {
  try {
    const db = firebase.firestore();
    const docRef = db.collection("jobseekers").doc(userId);
    const doc = await docRef.get();
    
    if (doc.exists) {
      userProfileData = doc.data();
      console.log("User profile data loaded:", userProfileData);
      return userProfileData;
    } else {
      console.log("No profile document found for user:", userId);
      return null;
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
    return null;
  }
}

// Function to update user display with Firebase data
async function updateUserDisplayFromFirebase(user) {
  const userInitial = document.getElementById('user-initial');
  const userName = document.getElementById('user-name');
  const welcomeMessage = document.getElementById('welcome-message');
  
  // Load profile data from Firestore
  const profileData = await loadUserProfile(user.uid);
  
  let displayName = 'User'; // Default fallback
  let initialLetter = 'U'; // Default fallback
  
  if (profileData && profileData.firstName) {
    // Use first name from profile if available
    displayName = profileData.firstName;
    initialLetter = profileData.firstName.charAt(0).toUpperCase();
    
    // If both first and last name are available, use full name
    if (profileData.lastName) {
      displayName = `${profileData.firstName} ${profileData.lastName}`;
    }
  } else if (user.displayName) {
    // Fallback to Firebase Auth display name
    displayName = user.displayName;
    initialLetter = user.displayName.charAt(0).toUpperCase();
  } else if (user.email) {
    // Fallback to email
    displayName = user.email;
    initialLetter = user.email.charAt(0).toUpperCase();
  }
  
  // Update UI elements
  if (userInitial) {
    userInitial.textContent = initialLetter;
  }
  
  if (userName) {
    userName.textContent = displayName;
  }
  
  // Update welcome message to show profile completion status
  if (welcomeMessage) {
    if (profileData && profileData.profileComplete) {
      welcomeMessage.innerHTML = `Welcome back, <span id="user-name">${displayName}</span>!`;
    } else {
      welcomeMessage.innerHTML = `Welcome, <span id="user-name">${displayName}</span>! <small style="color: #666; font-size: 0.8em;">(Complete your profile to get started)</small>`;
    }
  }
}

// Function to check if profile is complete and show appropriate message
function checkProfileCompletionStatus(profileData) {
  if (!profileData) {
    showNotification('Please complete your profile to get the best job recommendations!', 'warning');
    return false;
  }
  
  const requiredFields = ['firstName', 'lastName', 'contactNumber', 'skills'];
  const missingFields = requiredFields.filter(field => !profileData[field] || 
    (Array.isArray(profileData[field]) && profileData[field].length === 0));
  
  if (missingFields.length > 0 || !profileData.profileComplete) {
    showNotification('Complete your profile to improve your job search experience!', 'info');
    return false;
  }
  
  return true;
}

// Firebase auth state listener
if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      currentFirebaseUser = user;
      console.log("User logged in:", user.displayName || user.email);
      
      // Update user display with profile data
      await updateUserDisplayFromFirebase(user);
      
      // Check profile completion status
      checkProfileCompletionStatus(userProfileData);
      
      // Initialize dashboard after user data is loaded
      initializeDashboard();
    } else {
      console.log("No user logged in");
      // Redirect to login if needed
      window.location.href = 'login.html';
    }
  });
} else {
  console.warn("Firebase not initialized - using sample data");
  // Fallback initialization for testing
  initializeDashboard();
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if Firebase auth hasn't handled it yet
  if (!currentFirebaseUser) {
    console.log("DOM loaded, waiting for Firebase auth...");
  }
  
  loadFeaturedJobs();
  loadRecentApplications();
  setupEventListeners();
});

// Modify your existing initializeDashboard function
async function initializeDashboard() {
  console.log("Initializing dashboard for user:", currentFirebaseUser?.email || 'unknown');
  
  try {
    // Load applications from Firebase first
    await loadApplicationsFromFirebase();
    
    // Update statistics
    updateStatistics();
    
    // Load featured jobs
    loadFeaturedJobs();
    
    // If profile data is available, customize the dashboard
    if (userProfileData) {
      customizeDashboardForUser(userProfileData);
    }
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    showNotification('Error loading dashboard data. Please refresh the page.', 'error');
  }
}

function customizeDashboardForUser(profileData) {
  // Customize dashboard based on user's profile data
  // For example, filter jobs based on skills, location preferences, etc.
  
  if (profileData.skills && profileData.skills.length > 0) {
    console.log("User skills:", profileData.skills);
    // You could filter featured jobs based on user skills here
  }
  
  if (profileData.homeAddress) {
    console.log("User location:", profileData.homeAddress);
    // You could set default location filter based on user's address
    const locationFilter = document.getElementById('location-filter');
    if (locationFilter && profileData.homeAddress) {
      // This is a simple example - you'd want more sophisticated location matching
      const userLocation = profileData.homeAddress.toLowerCase();
      for (let option of locationFilter.options) {
        if (userLocation.includes(option.value.toLowerCase()) && option.value !== '') {
          option.selected = true;
          break;
        }
      }
    }
  }
}

function getCurrentUser() {
  // Return current Firebase user data combined with profile data
  if (currentFirebaseUser && userProfileData) {
    return {
      uid: currentFirebaseUser.uid,
      email: currentFirebaseUser.email,
      name: userProfileData.firstName ? 
        `${userProfileData.firstName} ${userProfileData.lastName || ''}`.trim() : 
        currentFirebaseUser.displayName || currentFirebaseUser.email,
      profileData: userProfileData
    };
  }
  
  // Fallback for demo purposes
  return {
    name: "User",
    email: "user@email.com"
  };
}

function updateStatistics() {
  // Remove references to sampleApplications if you want to use Firebase data
  // For now, keeping sample applications but you can update this too
  document.getElementById('applications-count').textContent = sampleApplications.length;
  document.getElementById('interviews-count').textContent = sampleApplications.filter(app => app.status === 'accepted').length;
  document.getElementById('saved-jobs-count').textContent = '0'; // Update this to fetch from Firebase
}

// Updated loadFeaturedJobs function
async function loadFeaturedJobs() {
  const jobsGrid = document.getElementById('featured-jobs');
  if (!jobsGrid) return;
  
  jobsGrid.innerHTML = '<p>Loading featured jobs...</p>';
  
  try {
    const db = firebase.firestore();
    const snapshot = await db.collection('jobPost').limit(6).get();
    
    const jobs = [];
    snapshot.forEach(doc => {
      jobs.push({ id: doc.id, ...doc.data() });
    });
    
    jobsGrid.innerHTML = '';
    
    if (jobs.length === 0) {
      jobsGrid.innerHTML = '<p style="text-align: center; color: #666;">No jobs available at the moment.</p>';
      return;
    }
    
    // Filter jobs based on user skills if available
    let jobsToShow = jobs;
    if (userProfileData && userProfileData.skills && userProfileData.skills.length > 0) {
      const userSkills = userProfileData.skills.map(skill => skill.toLowerCase());
      const filteredJobs = jobs.filter(job => {
        const jobText = (job.jobTitle + ' ' + job.jobDescription).toLowerCase();
        return userSkills.some(skill => jobText.includes(skill));
      });
      
      if (filteredJobs.length > 0) {
        jobsToShow = filteredJobs;
      }
    }
    
    // Clear currentJobs array and populate with new jobs
    currentJobs = [];
    jobsToShow.forEach((job, index) => {
      const jobCard = createJobCard(job, index);
      jobsGrid.appendChild(jobCard);
    });
    
  } catch (error) {
    console.error('Error loading featured jobs:', error);
    jobsGrid.innerHTML = '<p style="text-align: center; color: #666;">Error loading jobs. Please try again later.</p>';
  }
}

let currentJobs = [];

// Updated createJobCard function to show application status
function createJobCard(job, index) {
  const jobCard = document.createElement('div');
  jobCard.className = 'job-card';
  
  // Store job in global array for modal access
  currentJobs[index] = job;
  
  // Safely get job properties with fallbacks
  const jobTitle = job.jobTitle || 'Job Title Not Available';
  const companyName = job.companyName || 'Company Name Not Available';
  const location = job.location || 'Location Not Specified';
  const jobType = job.jobType || 'Full-time';
  const salary = job.salary || 'Salary Not Specified';
  const description = job.jobDescription || job.description || 'No description available';
  
  // Find application status if exists
  const application = sampleApplications.find(app => app.jobId === job.id);
  const hasApplied = application && application.status !== 'withdrawn';
  const isWithdrawn = application && application.status === 'withdrawn';
  
  jobCard.innerHTML = `
    <div class="job-header">
      <div>
        <h3 class="job-title">${jobTitle}</h3>
        <p class="company-name">${companyName}</p>
      </div>
      <span class="job-salary">${salary}</span>
    </div>
    <div class="job-details">
      <span class="job-location">${location}</span>
      <span class="job-type">${jobType}</span>
      ${hasApplied ? '<span class="applied-badge" style="color: #28a745; font-weight: bold;">✓ Applied</span>' : ''}
      ${isWithdrawn ? '<span class="withdrawn-badge" style="color: #dc3545; font-weight: bold;">Withdrawn</span>' : ''}
    </div>
    <p class="job-description">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
    <div class="job-actions">
      <button class="apply-btn" onclick="showJobModal(${index})">View Details</button>
    </div>
  `;
  return jobCard;
}

// Updated loadRecentApplications function
function loadRecentApplications() {
  const applicationsList = document.getElementById('recent-applications');
  if (!applicationsList) return;
  
  applicationsList.innerHTML = '';
  
  if (sampleApplications.length === 0) {
    applicationsList.innerHTML = '<p style="text-align: center; color: #666;">No applications yet. Start applying to jobs!</p>';
    return;
  }
  
  sampleApplications.forEach(application => {
    const applicationItem = createApplicationItem(application);
    applicationsList.appendChild(applicationItem);
  });
}

function createApplicationItem(application) {
  const applicationItem = document.createElement('div');
  applicationItem.className = 'application-item';
  
  const statusClass = `status-${application.status}`;
  const statusText = application.status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  let interviewDetailsHTML = '';
  if (application.status === 'interview_scheduled' && application.interviewDetails) {
    const { date, time, type } = application.interviewDetails;
    const interviewDate = new Date(`${date}T${time}`);
    const formattedDate = formatDate(interviewDate);
    const formattedTime = interviewDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    interviewDetailsHTML = `
      <div class="interview-details">
        <div class="interview-detail-item">
          <i class="fas fa-calendar"></i>
          <span>${formattedDate}</span>
        </div>
        <div class="interview-detail-item">
          <i class="fas fa-clock"></i>
          <span>${formattedTime}</span>
        </div>
        <div class="interview-detail-item">
          <i class="fas fa-video"></i>
          <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
        </div>
      </div>
    `;
  }
  
  applicationItem.innerHTML = `
    <div class="application-info">
      <h4>${application.jobTitle}</h4>
      <p>${application.company} • Applied on ${formatDate(application.appliedDate)}</p>
      ${interviewDetailsHTML}
    </div>
    <span class="application-status ${statusClass}">${statusText}</span>
  `;
  
  return applicationItem;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function setupEventListeners() {
  // Job search functionality
  const searchBtn = document.getElementById('search-btn');
  const jobSearchInput = document.getElementById('job-search');
  const locationFilter = document.getElementById('location-filter');
  const categoryFilter = document.getElementById('category-filter');
  
  if (searchBtn) searchBtn.addEventListener('click', performJobSearch);
  
  // Allow search on Enter key
  if (jobSearchInput) {
    jobSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performJobSearch();
      }
    });
  }
  
  // Quick action buttons
  setupQuickActionListeners();
  
  // Logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

function performJobSearch() {
  const searchTerm = document.getElementById('job-search')?.value?.toLowerCase() || '';
  const location = document.getElementById('location-filter')?.value || '';
  const category = document.getElementById('category-filter')?.value || '';
  
  let filteredJobs = sampleJobs;
  
  // Filter by search term
  if (searchTerm) {
    filteredJobs = filteredJobs.filter(job => 
      job.title.toLowerCase().includes(searchTerm) ||
      job.company.toLowerCase().includes(searchTerm) ||
      job.description.toLowerCase().includes(searchTerm)
    );
  }
  
  // Filter by location
  if (location) {
    filteredJobs = filteredJobs.filter(job => 
      job.location.toLowerCase().includes(location.toLowerCase()) ||
      (location === 'remote' && job.location.toLowerCase().includes('remote'))
    );
  }
  
  // Filter by category (this would be more sophisticated in a real app)
  if (category) {
    filteredJobs = filteredJobs.filter(job => 
      job.title.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  // Update the jobs display
  displayFilteredJobs(filteredJobs);
}

// Updated displayFilteredJobs function
function displayFilteredJobs(jobs) {
  const jobsGrid = document.getElementById('featured-jobs');
  if (!jobsGrid) return;

  jobsGrid.innerHTML = '';

  if (jobs.length === 0) {
    jobsGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">No jobs found matching your criteria. Try adjusting your search.</p>';
    return;
  }
  currentJobs = [];
  jobs.forEach(job => {
    const card = createJobCard(job);
    jobsGrid.appendChild(card);
  });
}

// Firebase Firestore-based Job Search Function
// Updated performJobSearch function (keep as is, it's already correct)
async function performJobSearch() {
  const jobsGrid = document.getElementById('featured-jobs');
  jobsGrid.innerHTML = '<p>Searching...</p>';

  const searchTerm = document.getElementById('job-search')?.value?.trim().toLowerCase() || '';
  const locationFilter = document.getElementById('location-filter')?.value?.trim().toLowerCase() || '';
  const categoryFilter = document.getElementById('category-filter')?.value?.trim().toLowerCase() || '';

  try {
    const db = firebase.firestore();
    const snapshot = await db.collection('jobPost').get();

    const results = [];

    snapshot.forEach(doc => {
      const job = doc.data();
      const jobId = doc.id;

      const jobTitle = job.jobTitle?.toLowerCase() || '';
      const location = job.location?.toLowerCase() || '';
      const company = job.companyName?.toLowerCase() || '';
      const description = (job.jobDescription || job.description || '').toLowerCase();

      const matchesSearchTerm = !searchTerm || 
        jobTitle.includes(searchTerm) || 
        description.includes(searchTerm) || 
        company.includes(searchTerm);
      
      const matchesLocation = !locationFilter || 
        locationFilter === 'all locations' || 
        location.includes(locationFilter);
      
      const matchesCategory = !categoryFilter || 
        jobTitle.includes(categoryFilter);

      if (matchesSearchTerm && matchesLocation && matchesCategory) {
        results.push({ id: jobId, ...job });
      }
    });

    displayFilteredJobs(results);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    jobsGrid.innerHTML = '<p style="text-align: center; color: #666;">Error loading jobs. Please try again later.</p>';
  }
}

function displayFilteredJobs(jobs) {
  const jobsGrid = document.getElementById('featured-jobs');
  if (!jobsGrid) return;

  jobsGrid.innerHTML = '';

  if (jobs.length === 0) {
    jobsGrid.innerHTML = '<p style="text-align:center; color:#666;">No jobs found matching your criteria.</p>';
    return;
  }

  jobs.forEach(job => {
    const card = createJobCard(job);
    jobsGrid.appendChild(card);
  });
}

function setupQuickActionListeners() {
  const actionButtons = document.querySelectorAll('.action-btn');
  
  actionButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      switch(index) {
        case 0: // Update Resume
          handleUpdateResume();
          break;
        case 1: // Set Job Alerts
          handleSetJobAlerts();
          break;
        case 2: // Company Research
          handleCompanyResearch();
          break;
        case 3: // Skill Development
          handleSkillDevelopment();
          break;
      }
    });
  });
}

// Update the application functions to save to storage
function applyToJob(jobId) {
  // Check if profile is complete before allowing application
  if (!userProfileData || !userProfileData.profileComplete) {
    showNotification('Please complete your profile before applying to jobs!', 'warning');
    setTimeout(() => {
      window.location.href = 'edit-profile-jobseeker.html';
    }, 2000);
    return;
  }
  
  // Check if user has already applied to this job
  if (appliedJobIds.includes(jobId)) {
    showNotification('You have already applied to this job!', 'warning');
    return;
  }
  
  // In a real application, this would send the application to your backend
  const job = sampleJobs.find(j => j.id === jobId);
  if (job) {
    // Add to applied jobs tracking
    appliedJobIds.push(jobId);
    
    // Add to applications
    const newApplication = {
      id: sampleApplications.length + 1,
      jobId: jobId,
      jobTitle: job.title,
      company: job.company,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    
    sampleApplications.unshift(newApplication);
    
    // Save to storage
    saveApplicationsToStorage();
    
    // Update UI
    loadRecentApplications();
    updateStatistics();
    
    // Show success message
    showNotification(`Application submitted for ${job.title} at ${job.company}!`, 'success');
  }
}


function saveJob(jobId) {
  const job = sampleJobs.find(j => j.id === jobId);
  if (job) {
    // In a real app, this would save to the database
    showNotification(`${job.title} has been saved to your favorites!`, 'info');
    
    // Update saved jobs count
    const savedCount = parseInt(document.getElementById('saved-jobs-count').textContent);
    document.getElementById('saved-jobs-count').textContent = savedCount + 1;
  }
}

// Enhanced handleUpdateResume function with inline upload
function handleUpdateResume() {
  createResumeUploadModal();
}

// Create and show the resume upload modal
function createResumeUploadModal() {
  // Remove existing modal if any
  const existingModal = document.getElementById('resume-upload-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const modalHTML = `
    <div id="resume-upload-modal" class="resume-modal-overlay">
      <div class="resume-modal-container">
        <div class="resume-modal-header">
          <h3>Update Resume</h3>
          <button class="resume-modal-close" onclick="closeResumeModal()">×</button>
        </div>
        <div class="resume-modal-content">
          <div class="resume-upload-area">
            <input type="file" id="resume-modal-input" accept=".pdf" style="display: none;">
            <label for="resume-modal-input" class="resume-upload-label">
              <div class="upload-icon">📄</div>
              <div class="upload-text">
                <strong>Click to upload resume</strong>
                <span>PDF files only (max 10MB)</span>
              </div>
            </label>
            <div class="resume-progress-container">
              <div class="resume-progress-bar" id="resume-modal-progress"></div>
            </div>
          </div>
          <div class="resume-file-display" id="resume-modal-file-display">
            <div class="file-info">
              <span class="file-icon">📄</span>
              <span class="file-name" id="resume-modal-file-name"></span>
            </div>
            <button class="file-remove-btn" onclick="removeSelectedFile()">×</button>
          </div>
          <div class="resume-modal-actions">
            <button class="resume-cancel-btn" onclick="closeResumeModal()">Cancel</button>
            <button class="resume-upload-btn" id="resume-modal-upload" onclick="uploadNewResume()" disabled>
              Update Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Setup event listeners
  setupResumeModalListeners();

  // Show modal with animation
  setTimeout(() => {
    document.getElementById('resume-upload-modal').classList.add('show');
  }, 10);
}

// Setup event listeners for the modal
function setupResumeModalListeners() {
  const fileInput = document.getElementById('resume-modal-input');
  const uploadBtn = document.getElementById('resume-modal-upload');
  const fileDisplay = document.getElementById('resume-modal-file-display');
  const fileName = document.getElementById('resume-modal-file-name');
  const progressBar = document.getElementById('resume-modal-progress');

  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      
      if (file) {
        // Validate file type
        if (file.type !== 'application/pdf') {
          showNotification('Please select a PDF file only.', 'error');
          this.value = '';
          resetModalFileDisplay();
          return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          showNotification('File size should be less than 10MB.', 'error');
          this.value = '';
          resetModalFileDisplay();
          return;
        }
        
        // Show file info and enable upload button
        if (fileName) fileName.textContent = file.name;
        if (fileDisplay) fileDisplay.classList.add('show');
        if (uploadBtn) uploadBtn.disabled = false;
        
        // Start upload simulation for UI feedback
        simulateModalUpload(file);
      }
    });
  }

  // Close modal when clicking outside
  const modalOverlay = document.getElementById('resume-upload-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        closeResumeModal();
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('resume-upload-modal')) {
      closeResumeModal();
    }
  });
}

// Simulate upload progress for UI feedback
function simulateModalUpload(file) {
  const progressBar = document.getElementById('resume-modal-progress');
  if (!progressBar) return;
  
  // Show progress bar
  progressBar.style.width = '0%';
  
  // Simulate upload progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    
    if (progress >= 100) {
      progress = 100;
      progressBar.style.width = '100%';
      
      // Reset progress after completion
      setTimeout(() => {
        progressBar.style.width = '0%';
      }, 500);
      
      clearInterval(interval);
    } else {
      progressBar.style.width = progress + '%';
    }
  }, 200);
}

// Reset file display in modal
function resetModalFileDisplay() {
  const fileDisplay = document.getElementById('resume-modal-file-display');
  const uploadBtn = document.getElementById('resume-modal-upload');
  const progressBar = document.getElementById('resume-modal-progress');
  
  if (fileDisplay) fileDisplay.classList.remove('show');
  if (uploadBtn) uploadBtn.disabled = true;
  if (progressBar) progressBar.style.width = '0%';
}

// Remove selected file
function removeSelectedFile() {
  const fileInput = document.getElementById('resume-modal-input');
  if (fileInput) fileInput.value = '';
  resetModalFileDisplay();
}

// Upload new resume to Cloudinary and update Firebase
async function uploadNewResume() {
  const fileInput = document.getElementById('resume-modal-input');
  const uploadBtn = document.getElementById('resume-modal-upload');
  
  if (!fileInput || !fileInput.files[0]) {
    showNotification('Please select a file first.', 'error');
    return;
  }

  const file = fileInput.files[0];
  const originalBtnText = uploadBtn.textContent;
  
  try {
    // Update button state
    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;
    
    // Check if user is logged in
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error('You must be logged in to update your resume.');
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(file);
    
    // Update Firebase document
    const db = firebase.firestore();
    const profileData = {
      resumeURL: uploadResult.url,
      resumeFileName: file.name,
      cloudinaryPublicId: uploadResult.publicId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("jobseekers").doc(user.uid).set(profileData, { merge: true });
    
    showNotification('Resume updated successfully!', 'success');
    
    // Close modal after success
    setTimeout(() => {
      closeResumeModal();
    }, 1500);
    
  } catch (error) {
    console.error('Error updating resume:', error);
    showNotification(`Failed to update resume: ${error.message}`, 'error');
    
    // Reset button state
    uploadBtn.textContent = originalBtnText;
    uploadBtn.disabled = false;
  }
}

// Upload file to Cloudinary (same function from edit-profile-jobseeker.js)
async function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
    formData.append('resource_type', 'raw');
    formData.append('folder', 'resumes');

    const xhr = new XMLHttpRequest();
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve({
          url: response.secure_url,
          publicId: response.public_id,
          originalFilename: response.original_filename
        });
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/raw/upload`);
    xhr.send(formData);
  });
}

// Close the resume modal
function closeResumeModal() {
  const modal = document.getElementById('resume-upload-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

async function loadApplicationsFromFirebase() {
  try {
    const applications = await jobApplicationHandler.getUserApplications(20);
    
    // Clear existing data
    sampleApplications.length = 0;
    appliedJobIds.length = 0;

    // Process each application
    applications.forEach(app => {
      // Add to applications list
      sampleApplications.push({
        id: app.id,
        jobId: app.jobId,
        jobTitle: app.jobDetails.jobTitle,
        company: app.jobDetails.companyName,
        appliedDate: app.applicationDate
          ? app.applicationDate.toDate().toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        status: app.status
      });

      // Add to applied jobs tracking
      if (!appliedJobIds.includes(app.jobId)) {
        appliedJobIds.push(app.jobId);
      }
    });

    // Update UI
    loadRecentApplications();
    updateStatistics();

    // Save to localStorage as backup
    saveApplicationsToStorage();

  } catch (error) {
    console.error('Error loading applications from Firebase:', error);
    // Show user-friendly error message
    if (error.message.includes('requires an index')) {
      showNotification('Please contact support to set up required database indexes', 'error');
    } else {
      showNotification('Error loading applications. Please try again later.', 'error');
    }
    // Load from localStorage as fallback
    loadApplicationsFromStorage();
  }
}


function handleSetJobAlerts() {
  showNotification('Opening job alerts setup...', 'info');
  // In a real app, open job alerts modal or page
}

function handleCompanyResearch() {
  showNotification('Opening company research tools...', 'info');
  // In a real app, redirect to company research page
}

function handleSkillDevelopment() {
  showNotification('Browsing available courses...', 'info');
  // In a real app, redirect to learning platform
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().signOut().then(() => {
        showNotification('Logged out successfully!', 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1000);
      }).catch((error) => {
        console.error('Logout error:', error);
        showNotification('Error logging out. Please try again.', 'error');
      });
    } else {
      showNotification('Logging out...', 'info');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    }
  }
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  // Set background color based on type
  switch(type) {
    case 'success':
      notification.style.background = '#28a745';
      break;
    case 'error':
      notification.style.background = '#dc3545';
      break;
    case 'warning':
      notification.style.background = '#ffc107';
      notification.style.color = '#000';
      break;
    default:
      notification.style.background = '#17a2b8';
  }
  
  // Add to page
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Auto-refresh data every 5 minutes (in a real app)
setInterval(() => {
  // In a real application, you would fetch fresh data from your API
  console.log('Auto-refreshing dashboard data...');
}, 300000); // 5 minutes

// Updated showJobModal function to show application status
async function showJobModal(jobIndex) {
  const job = currentJobs[jobIndex];
  
  if (!job) {
    console.error('Job not found at index:', jobIndex);
    showNotification('Error loading job details', 'error');
    return;
  }
  
  // Find application status if exists
  const application = sampleApplications.find(app => app.jobId === job.id);
  const hasApplied = application && application.status !== 'withdrawn';
  const isWithdrawn = application && application.status === 'withdrawn';
  const applicationId = application?.id;
  
  const modalHTML = `
    <div class="job-modal-overlay" onclick="this.remove()">
      <div class="job-modal" onclick="event.stopPropagation()">
        <button class="close-modal" onclick="document.querySelector('.job-modal-overlay').remove()">×</button>
        <h2>${job.jobTitle || 'Job Title Not Available'}</h2>
        <p><strong>Company:</strong> ${job.companyName || 'Not specified'}</p>
        <p><strong>Location:</strong> ${job.location || 'Not specified'}</p>
        <p><strong>Type:</strong> ${job.jobType || 'Not specified'}</p>
        <p><strong>Salary:</strong> ${job.salary || 'Not specified'}</p>
        <p><strong>Description:</strong><br>${job.jobDescription || job.description || 'No description available'}</p>
        <div style="margin-top: 20px;">
          ${hasApplied ? 
            `<div class="application-actions">
              <button class="withdraw-btn" onclick="withdrawApplication('${applicationId}', '${job.id}')">Withdraw Application</button>
              <span class="applied-status">✓ Application Submitted</span>
            </div>` :
            isWithdrawn ?
            `<div class="application-actions">
              <span class="withdrawn-status">Application Withdrawn</span>
              <button class="apply-btn" onclick="applyToJobModal('${job.id}', '${job.jobTitle}', '${job.companyName}')">Apply Again</button>
            </div>` :
            `<button class="apply-btn" onclick="applyToJobModal('${job.id}', '${job.jobTitle}', '${job.companyName}')">Apply for Job</button>`
          }
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}


async function applyToJobModal(jobId, title, company) {
  try {
    // Show loading state
    const applyButton = document.querySelector('.job-modal .apply-btn');
    const originalText = applyButton.textContent;
    applyButton.textContent = 'Applying...';
    applyButton.disabled = true;

    // Submit application using the handler
    const result = await jobApplicationHandler.submitJobApplication(jobId);

    if (result.success) {
      // Update local tracking (keep your existing logic)
      appliedJobIds.push(jobId);
      
      const newApplication = {
        id: sampleApplications.length + 1,
        jobId: jobId,
        jobTitle: title,
        company: company,
        appliedDate: new Date().toISOString().split('T')[0],
        status: 'pending'
      };

      sampleApplications.unshift(newApplication);
      saveApplicationsToStorage();
      
      // Update UI
      loadRecentApplications();
      updateStatistics();
      showNotification(result.message, 'success');
      
      // Close modal
      document.querySelector('.job-modal-overlay')?.remove();
      
      // Refresh jobs to show updated status
      loadFeaturedJobs();
      
    } else {
      showNotification(result.message, 'error');
      
      // Reset button
      applyButton.textContent = originalText;
      applyButton.disabled = false;
    }

  } catch (error) {
    console.error('Application error:', error);
    showNotification('An error occurred while applying. Please try again.', 'error');
    
    // Reset button
    const applyButton = document.querySelector('.job-modal .apply-btn');
    applyButton.textContent = 'Apply for Job';
    applyButton.disabled = false;
  }
}

// Add function to persist applications to localStorage (optional enhancement)
function saveApplicationsToStorage() {
  try {
    localStorage.setItem('jobApplications', JSON.stringify(sampleApplications));
    localStorage.setItem('appliedJobIds', JSON.stringify(appliedJobIds));
  } catch (error) {
    console.warn('Could not save applications to localStorage:', error);
  }
}

// Add function to load applications from localStorage (optional enhancement)
function loadApplicationsFromStorage() {
  try {
    const savedApplications = localStorage.getItem('jobApplications');
    const savedAppliedIds = localStorage.getItem('appliedJobIds');
    
    if (savedApplications) {
      const parsedApplications = JSON.parse(savedApplications);
      sampleApplications.push(...parsedApplications);
    }
    
    if (savedAppliedIds) {
      const parsedIds = JSON.parse(savedAppliedIds);
      appliedJobIds.push(...parsedIds);
    }
  } catch (error) {
    console.warn('Could not load applications from localStorage:', error);
  }
}

// Add withdraw application function
async function withdrawApplication(applicationId, jobId) {
  if (!confirm('Are you sure you want to withdraw your application?')) {
    return;
  }

  try {
    // Show loading state
    const withdrawButton = document.querySelector('.withdraw-btn');
    const originalText = withdrawButton.textContent;
    withdrawButton.textContent = 'Withdrawing...';
    withdrawButton.disabled = true;

    // Call Firebase to withdraw application
    const result = await jobApplicationHandler.withdrawApplication(applicationId);

    if (result.success) {
      // Remove from local tracking using splice instead of reassignment
      const jobIndex = appliedJobIds.indexOf(jobId);
      if (jobIndex > -1) {
        appliedJobIds.splice(jobIndex, 1);
      }

      const appIndex = sampleApplications.findIndex(app => app.id === applicationId);
      if (appIndex > -1) {
        sampleApplications.splice(appIndex, 1);
      }
      
      // Update storage
      saveApplicationsToStorage();
      
      // Update UI
      loadRecentApplications();
      updateStatistics();
      showNotification(result.message, 'success');
      
      // Close modal
      document.querySelector('.job-modal-overlay')?.remove();
      
      // Refresh jobs to show updated status
      loadFeaturedJobs();
    } else {
      let errorMessage = result.message;
      
      // Handle specific error cases
      if (result.error) {
        if (result.error.includes('permissions')) {
          errorMessage = 'You do not have permission to withdraw this application. Please contact support.';
        } else if (result.error.includes('not found')) {
          errorMessage = 'Application not found. It may have been already withdrawn.';
        } else if (result.error.includes('stage')) {
          errorMessage = 'This application cannot be withdrawn at this stage.';
        }
      }
      
      showNotification(errorMessage, 'error');
      
      // Reset button
      withdrawButton.textContent = originalText;
      withdrawButton.disabled = false;
    }
  } catch (error) {
    console.error('Error withdrawing application:', error);
    
    let errorMessage = 'An error occurred while withdrawing your application.';
    if (error.message.includes('permissions')) {
      errorMessage = 'You do not have permission to withdraw this application. Please contact support.';
    }
    
    showNotification(errorMessage, 'error');
    
    // Reset button
    const withdrawButton = document.querySelector('.withdraw-btn');
    if (withdrawButton) {
      withdrawButton.textContent = 'Withdraw Application';
      withdrawButton.disabled = false;
    }
  }
}

// Add this at the top of the file, after the existing CSS
const style = document.createElement('style');
style.textContent = `
  .application-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .withdraw-btn {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .withdraw-btn:hover {
    background-color: #c82333;
  }

  .withdraw-btn:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }

  .applied-status {
    color: #28a745;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 5px;
  }
`;
document.head.appendChild(style);

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