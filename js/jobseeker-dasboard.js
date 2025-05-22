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

const sampleApplications = [
  {
    id: 1,
    jobTitle: "Frontend Developer",
    company: "StartupXYZ",
    appliedDate: "2024-01-15",
    status: "reviewing"
  },
  {
    id: 2,
    jobTitle: "Product Manager",
    company: "BigTech Corp",
    appliedDate: "2024-01-10",
    status: "pending"
  },
  {
    id: 3,
    jobTitle: "Marketing Specialist",
    company: "Creative Agency",
    appliedDate: "2024-01-08",
    status: "accepted"
  }
];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  initializeDashboard();
  loadFeaturedJobs();
  loadRecentApplications();
  setupEventListeners();
});

function initializeDashboard() {
  // Set user initial (you would get this from Firebase Auth)
  const userInitial = document.getElementById('user-initial');
  const userName = document.getElementById('user-name');
  
  // This would come from your Firebase user data
  const currentUser = getCurrentUser();
  if (currentUser) {
    userInitial.textContent = currentUser.name.charAt(0).toUpperCase();
    userName.textContent = currentUser.name;
  }
  
  // Update statistics
  updateStatistics();
}

function getCurrentUser() {
  // This would integrate with Firebase Auth
  // For demo purposes, returning sample user
  return {
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com"
  };
}

function updateStatistics() {
  // Update application statistics
  document.getElementById('applications-count').textContent = sampleApplications.length;
  document.getElementById('interviews-count').textContent = sampleApplications.filter(app => app.status === 'accepted').length;
  document.getElementById('saved-jobs-count').textContent = '5'; // This would come from saved jobs data
}

function loadFeaturedJobs() {
  const jobsGrid = document.getElementById('featured-jobs');
  jobsGrid.innerHTML = '';
  
  sampleJobs.forEach(job => {
    const jobCard = createJobCard(job);
    jobsGrid.appendChild(jobCard);
  });
}

function createJobCard(job) {
  const jobCard = document.createElement('div');
  jobCard.className = 'job-card';
  jobCard.innerHTML = `
    <div class="job-header">
      <div>
        <h3 class="job-title">${job.title}</h3>
        <p class="company-name">${job.company}</p>
      </div>
      <span class="job-salary">${job.salary}</span>
    </div>
    <div class="job-details">
      <span class="job-location">${job.location}</span>
      <span class="job-type">${job.type}</span>
    </div>
    <p class="job-description">${job.description}</p>
    <div class="job-actions">
      <button class="apply-btn" onclick="applyToJob(${job.id})">Apply Now</button>
      <button class="save-btn" onclick="saveJob(${job.id})">Save Job</button>
    </div>
  `;
  return jobCard;
}

function loadRecentApplications() {
  const applicationsList = document.getElementById('recent-applications');
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
  const statusText = application.status.charAt(0).toUpperCase() + application.status.slice(1);
  
  applicationItem.innerHTML = `
    <div class="application-info">
      <h4>${application.jobTitle}</h4>
      <p>${application.company} • Applied on ${formatDate(application.appliedDate)}</p>
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
  
  searchBtn.addEventListener('click', performJobSearch);
  
  // Allow search on Enter key
  jobSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performJobSearch();
    }
  });
  
  // Quick action buttons
  setupQuickActionListeners();
  
  // Logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', handleLogout);
}

function performJobSearch() {
  const searchTerm = document.getElementById('job-search').value.toLowerCase();
  const location = document.getElementById('location-filter').value;
  const category = document.getElementById('category-filter').value;
  
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

function displayFilteredJobs(jobs) {
  const jobsGrid = document.getElementById('featured-jobs');
  jobsGrid.innerHTML = '';
  
  if (jobs.length === 0) {
    jobsGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">No jobs found matching your criteria. Try adjusting your search.</p>';
    return;
  }
  
  jobs.forEach(job => {
    const jobCard = createJobCard(job);
    jobsGrid.appendChild(jobCard);
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

function applyToJob(jobId) {
  // In a real application, this would send the application to your backend
  const job = sampleJobs.find(j => j.id === jobId);
  if (job) {
    // Add to applications (simulate)
    const newApplication = {
      id: sampleApplications.length + 1,
      jobTitle: job.title,
      company: job.company,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    
    sampleApplications.unshift(newApplication);
    
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

function handleUpdateResume() {
  showNotification('Redirecting to resume editor...', 'info');
  // In a real app, redirect to resume editing page
  // window.location.href = 'resume-editor.html';
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
    // In a real app, this would use Firebase Auth signOut
    // firebase.auth().signOut().then(() => {
    //   window.location.href = 'login.html';
    // });
    
    showNotification('Logging out...', 'info');
    setTimeout(() => {
      // Simulate logout redirect
      alert('Logout successful! (In a real app, you would be redirected to login page)');
    }, 1000);
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
      document.body.removeChild(notification);
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