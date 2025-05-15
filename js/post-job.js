//post-job.js
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded");
    const form = document.getElementById("postJobForm");
    const errorMessage = document.getElementById("error-message");
    
    // Set user initial in profile button
    const userInitialElement = document.getElementById("user-initial");
    
    // Form elements
    const jobTitle = document.getElementById("jobTitle");
    const jobType = document.getElementById("jobType");
    const modeOfWork = document.getElementById("modeOfWork");
    const location = document.getElementById("location");
    const duration = document.getElementById("duration");
    const salary = document.getElementById("salary");
    const lastDate = document.getElementById("lastDate");
    const skills = document.getElementById("skills");
    const jobDescription = document.getElementById("jobDescription");
    const hiringWorkflow = document.getElementById("hiringWorkflow");
    
    // Set min date for lastDate input to today
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0
    let dd = today.getDate();
    
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    
    const formattedToday = yyyy + '-' + mm + '-' + dd;
    lastDate.setAttribute("min", formattedToday);
    
    // Check if Firebase is initialized properly
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not initialized!");
        errorMessage.textContent = "Firebase initialization failed. Check console for details.";
        return;
    } else {
        console.log("Firebase is initialized");
    }
    
    // Handle floating labels for select elements
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        select.addEventListener('change', function() {
            if (this.value) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
    });
    
    // Check authentication status
    firebase.auth().onAuthStateChanged(async (user) => {
        console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "No user logged in");
        
        if (user) {
            // Set user initial in profile button
            try {
                const userDoc = await firebase.firestore().collection("recruiters").doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const companyName = userData.companyName || "";
                    if (companyName) {
                        userInitialElement.textContent = companyName.charAt(0).toUpperCase();
                    } else {
                        userInitialElement.textContent = user.email.charAt(0).toUpperCase();
                    }
                } else {
                    userInitialElement.textContent = user.email.charAt(0).toUpperCase();
                }
            } catch (error) {
                console.error("Error getting user data:", error);
                userInitialElement.textContent = user.email.charAt(0).toUpperCase();
            }
        } else {
            console.warn("User not logged in!");
            errorMessage.textContent = "You must be logged in to post jobs.";
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        }
    });
    
    // Handle form submission
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        console.log("Form submitted");
        
        // Reset error message
        errorMessage.textContent = "";
        
        // Validate auth state
        const user = firebase.auth().currentUser;
        
        if (!user) {
            console.error("No user logged in during form submission");
            errorMessage.style.color = "red";
            errorMessage.textContent = "You must be logged in to post a job.";
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('input[type="submit"]');
        const originalBtnText = submitBtn.value;
        submitBtn.value = "Posting...";
        submitBtn.disabled = true;
        
        try {
            // Get company info
            const recruiterDoc = await firebase.firestore().collection("recruiters").doc(user.uid).get();
            let companyName = "";
            let companyLogo = "";
            
            if (recruiterDoc.exists) {
                const recruiterData = recruiterDoc.data();
                companyName = recruiterData.companyName || "";
                companyLogo = recruiterData.companyLogo || "";
            }
            
            // Create job posting data
            const jobData = {
                // Keep both fields to satisfy both the security rules and the query in recruiter.js
                recruiterId: user.uid,  // Used in recruiter.js query
                userId: user.uid,      // Used in security rules
                companyName: companyName,
                companyLogo: companyLogo,
                // IMPORTANT: Make sure we use both 'title' and 'jobTitle' fields to cover all bases
                title: jobTitle.value.trim(),        // Used in recruiter.js display
                jobTitle: jobTitle.value.trim(),     // Used in original data structure
                jobType: jobType.value,
                modeOfWork: modeOfWork.value,
                location: location.value.trim(),
                duration: duration.value.trim(),
                salary: salary.value.trim(),
                lastDate: lastDate.value,
                skills: skills.value.trim().split(',').map(skill => skill.trim()),
                jobDescription: jobDescription.value.trim(),
                hiringWorkflow: hiringWorkflow.value.trim(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: "Active"
            };
            
            console.log("Job data to save:", jobData);
            
            // Add to Firestore
            const jobRef = await firebase.firestore().collection("jobPost").add(jobData);
            
            console.log("Job posted successfully with ID:", jobRef.id);
            errorMessage.style.color = "green";
            errorMessage.textContent = "Job posted successfully!";
            
            // Reset form after successful submission
            form.reset();
            
            // Redirect to job listings after a delay
            setTimeout(() => {
                window.location.href = "recruiter-dashboard.html";
            }, 2000);
            
        } catch (error) {
            console.error("Error posting job:", error);
            errorMessage.style.color = "red";
            errorMessage.textContent = `Failed to post job: ${error.message}`;
        } finally {
            // Reset button state
            submitBtn.value = originalBtnText;
            submitBtn.disabled = false;
        }
    });
    
    // Handle profile dropdown
    const profileButton = document.getElementById("profile-button");
    const dropdownContent = document.getElementById("profile-dropdown-content");
    
    profileButton.addEventListener("click", function() {
        dropdownContent.classList.toggle("show");
    });
    
    // Close dropdown when clicking outside
    window.addEventListener("click", function(event) {
        if (!event.target.matches('.profile-btn') && !event.target.matches('#user-initial')) {
            if (dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
            }
        }
    });
    
    // Handle logout
    document.getElementById("logout-btn").addEventListener("click", function(e) {
        e.preventDefault();
        firebase.auth().signOut().then(() => {
            window.location.href = "index.html";
        }).catch((error) => {
            console.error("Error signing out:", error);
        });
    });
});